import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { hashPassword } from '@server/modules/users/domain/password.ts';
import type {
  CreateUserData,
  UpdateUserData,
  UserRepository,
} from '@server/modules/users/domain/user.repository.ts';
import { toPublicUser, type UserWithPassword } from '@server/modules/users/domain/user.ts';

interface UsersFile {
  users: UserWithPassword[];
}

interface LegacyAuthRecord {
  username: string;
  passwordHash: string;
}

const writeJson = (filePath: string, value: unknown): void => {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, filePath);
  chmodSync(filePath, 0o600);
};

const readUsers = (filePath: string): UserWithPassword[] | null => {
  if (!existsSync(filePath)) return null;
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as UsersFile).users)) {
    throw new Error(`Invalid users file: ${filePath}`);
  }
  return (parsed as UsersFile).users.map(user => ({
    ...user,
    mustChangePassword: typeof user.mustChangePassword === 'boolean' ? user.mustChangePassword : true,
  }));
};

const readLegacyAdmin = (filePath: string): LegacyAuthRecord | null => {
  if (!existsSync(filePath)) return null;
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as LegacyAuthRecord).username === 'string' &&
      typeof (parsed as LegacyAuthRecord).passwordHash === 'string'
    ) {
      return parsed as LegacyAuthRecord;
    }
  } catch {
    // Ignore a broken legacy file and fall back to the default admin.
  }
  return null;
};

const normalizeUsername = (username: string): string => username.trim().toLowerCase();

export const createJsonUserRepository = ({
  dataDirectory,
}: {
  dataDirectory: string;
}): UserRepository => {
  const filePath = path.join(dataDirectory, 'users.json');
  let users: UserWithPassword[] = readUsers(filePath) ?? [];

  if (!users.length) {
    const legacy = readLegacyAdmin(path.join(dataDirectory, 'auth.json'));
    const admin: UserWithPassword = {
      id: 1,
      username: normalizeUsername(legacy?.username ?? 'admin'),
      passwordHash: legacy?.passwordHash ?? hashPassword('admin'),
      role: 'admin',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    };
    users = [admin];
    writeJson(filePath, { users });
  }

  const save = (next: UserWithPassword[]): void => writeJson(filePath, { users: next });

  return {
    list: () => users.map(toPublicUser),
    findById: id => {
      const user = users.find(item => item.id === id);
      return user ? toPublicUser(user) : null;
    },
    findByUsername: username => {
      const user = users.find(item => item.username === normalizeUsername(username));
      return user ? toPublicUser(user) : null;
    },
    existsByUsername: username => users.some(item => item.username === normalizeUsername(username)),
    count: () => users.length,
    countByRole: role => users.filter(item => item.role === role).length,
    create: (data: CreateUserData) => {
      const user: UserWithPassword = {
        id: users.length ? Math.max(...users.map(item => item.id)) + 1 : 1,
        username: normalizeUsername(data.username),
        passwordHash: data.passwordHash,
        role: data.role,
        mustChangePassword: data.mustChangePassword ?? true,
        createdAt: new Date().toISOString(),
      };
      users = [...users, user];
      save(users);
      return toPublicUser(user);
    },
    update: (id: number, data: UpdateUserData) => {
      const index = users.findIndex(item => item.id === id);
      if (index === -1) return null;
      const updated: UserWithPassword = {
        ...users[index],
        ...data,
        username: data.username ? normalizeUsername(data.username) : users[index].username,
      };
      users = users.map(item => (item.id === id ? updated : item));
      save(users);
      return toPublicUser(updated);
    },
    remove: (id: number) => {
      const removed = users.find(item => item.id === id);
      if (!removed) return false;
      users = users.filter(item => item.id !== id);
      save(users);
      return true;
    },
    findWithPassword: username => {
      const user = users.find(item => item.username === normalizeUsername(username));
      return user ? { ...user } : null;
    },
  };
};

