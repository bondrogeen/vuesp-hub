import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  ACCESS_PAGES,
  DEFAULT_ROLE_ACCESS,
  isAccessPage,
  type AccessPage,
  type RoleAccess,
} from '../domain/access.ts';
import type { UserRole } from '../../users/domain/user.ts';

export interface AccessRepository {
  get(): RoleAccess;
  update(next: Partial<RoleAccess>): RoleAccess;
}

const ROLES: UserRole[] = ['admin', 'user', 'viewer'];

const writeJson = (filePath: string, value: unknown): void => {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, filePath);
  chmodSync(filePath, 0o600);
};

const normalize = (value: unknown): RoleAccess => {
  const source = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const result = {} as RoleAccess;

  for (const role of ROLES) {
    const raw = Array.isArray(source[role]) ? source[role] : DEFAULT_ROLE_ACCESS[role];
    const pages = raw.filter(isAccessPage);
    result[role] = role === 'admin' ? [...ACCESS_PAGES] : [...new Set(pages)];
  }

  return result;
};

export const createJsonAccessRepository = ({ dataDirectory }: { dataDirectory: string }): AccessRepository => {
  const filePath = path.join(dataDirectory, 'access.json');
  let current: RoleAccess;

  if (existsSync(filePath)) {
    try {
      current = normalize(JSON.parse(readFileSync(filePath, 'utf8')));
    } catch {
      current = normalize(DEFAULT_ROLE_ACCESS);
    }
  } else {
    current = normalize(DEFAULT_ROLE_ACCESS);
    writeJson(filePath, current);
  }

  return {
    get: () => ({ ...current, admin: [...ACCESS_PAGES] } as RoleAccess),
    update: next => {
      current = normalize({ ...current, ...next });
      writeJson(filePath, current);
      return { ...current, admin: [...ACCESS_PAGES] } as RoleAccess;
    },
  };
};

export type { AccessPage, RoleAccess };
