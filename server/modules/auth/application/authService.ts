import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { signJwt, verifyJwt } from '@server/modules/auth/domain/jwt.ts';
import { hashPassword, verifyPassword } from '@server/modules/users/domain/password.ts';
import type { UserRepository } from '@server/modules/users/domain/user.repository.ts';
import type { UserRole } from '@server/modules/users/domain/user.ts';
import { createJsonUserRepository } from '@server/modules/users/infrastructure/jsonUserRepository.ts';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthService {
  login(username: string, password: string): AuthSession | null;
  verify(token: string | undefined): AuthUser | null;
  changePassword(id: number, currentPassword: string, newPassword: string): AuthSession | null;
  isDefaultAdminPassword(): boolean;
  users: UserRepository;
}

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

const loadSecret = (dataDirectory: string): Buffer => {
  if (process.env.VUESP_JWT_SECRET) return Buffer.from(process.env.VUESP_JWT_SECRET, 'utf8');

  const secretPath = path.join(dataDirectory, 'jwt.secret');
  if (existsSync(secretPath)) {
    chmodSync(secretPath, 0o600);
    return Buffer.from(readFileSync(secretPath, 'utf8').trim(), 'utf8');
  }

  const secret = randomBytes(32).toString('hex');
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  writeFileSync(secretPath, `${secret}\n`, { mode: 0o600 });
  chmodSync(secretPath, 0o600);
  return Buffer.from(secret, 'utf8');
};

const toAuthUser = (user: { id: number; username: string; role: UserRole; mustChangePassword: boolean }): AuthUser => ({
  id: user.id,
  username: user.username,
  role: user.role,
  mustChangePassword: user.mustChangePassword,
});

/**
 * Local auth service backed by a users repository. The first run creates
 * admin/admin (or imports the legacy single-user auth.json) as an administrator.
 */
export const createAuthService = ({
  dataDirectory,
  ttlSeconds = DEFAULT_TTL_SECONDS,
}: {
  dataDirectory: string;
  ttlSeconds?: number;
}): AuthService => {
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });

  const users = createJsonUserRepository({ dataDirectory });
  const secret = loadSecret(dataDirectory);

  const sessionFor = (user: { id: number; username: string; role: UserRole; mustChangePassword: boolean }): AuthSession => ({
    token: signJwt(user.username, secret, ttlSeconds, {
      role: user.role,
      uid: user.id,
      mustChange: user.mustChangePassword,
    }),
    user: toAuthUser(user),
  });

  return {
    users,

    login(username, password) {
      const user = users.findWithPassword(username);
      if (!user) return null;
      if (!verifyPassword(typeof password === 'string' ? password : '', user.passwordHash)) return null;
      return sessionFor(user);
    },

    verify(token) {
      const payload = verifyJwt(token, secret);
      if (!payload) return null;
      // `uid` survives a username change; fall back to the subject for legacy tokens.
      const user = (typeof payload.uid === 'number' ? users.findById(payload.uid) : null) ?? users.findByUsername(payload.sub);
      return user ? toAuthUser(user) : null;
    },

    changePassword(id, currentPassword, newPassword) {
      const current = users.findById(id);
      if (!current) return null;
      const withPassword = users.findWithPassword(current.username);
      if (!withPassword || !verifyPassword(currentPassword, withPassword.passwordHash)) return null;
      const updated = users.update(id, { passwordHash: hashPassword(newPassword), mustChangePassword: false });
      return updated ? sessionFor(updated) : null;
    },

    isDefaultAdminPassword() {
      const admin = users.findByUsername('admin');
      if (!admin?.mustChangePassword) return false;
      const withPassword = users.findWithPassword('admin');
      return Boolean(withPassword && verifyPassword('admin', withPassword.passwordHash));
    },
  };
};
