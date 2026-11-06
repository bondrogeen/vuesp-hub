import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { signJwt, verifyJwt } from '../domain/jwt.ts';

export interface AuthUser {
  username: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface AuthService {
  login(username: string, password: string): AuthSession | null;
  verify(token: string | undefined): AuthUser | null;
  getUser(): AuthUser;
}

interface AuthRecord {
  username: string;
  passwordHash: string;
}

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';
const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60;

const writeJson = (filePath: string, value: unknown) => {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, filePath);
  chmodSync(filePath, 0o600);
};

const readAuthRecord = (filePath: string): AuthRecord | null => {
  if (!existsSync(filePath)) return null;
  const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as AuthRecord).username !== 'string' ||
    typeof (parsed as AuthRecord).passwordHash !== 'string'
  ) {
    throw new Error(`Invalid auth file: ${filePath}`);
  }
  return parsed as AuthRecord;
};

const hashPassword = (password: string): string => {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
};

const verifyPassword = (password: string, encoded: string): boolean => {
  const [algorithm, saltBase64, hashBase64] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltBase64 || !hashBase64) return false;
  const expected = Buffer.from(hashBase64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltBase64, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

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

/**
 * Minimal local auth service: one admin account, scrypt password hash, JWT
 * sessions. The default admin/admin account is created only on first run.
 */
export const createAuthService = ({
  dataDirectory,
  ttlSeconds = DEFAULT_TTL_SECONDS,
}: {
  dataDirectory: string;
  ttlSeconds?: number;
}): AuthService => {
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });

  const authPath = path.join(dataDirectory, 'auth.json');
  let record = readAuthRecord(authPath);
  if (!record) {
    record = { username: DEFAULT_USERNAME, passwordHash: hashPassword(DEFAULT_PASSWORD) };
    writeJson(authPath, record);
  }

  const secret = loadSecret(dataDirectory);
  let current = record;

  return {
    login(username, password) {
      const candidate = typeof password === 'string' ? password : '';
      const validUser = username === current.username;
      const validPassword = verifyPassword(candidate, current.passwordHash);
      if (!validUser || !validPassword) return null;
      return {
        token: signJwt(current.username, secret, ttlSeconds),
        user: { username: current.username },
      };
    },

    verify(token) {
      const payload = verifyJwt(token, secret);
      if (!payload || payload.sub !== current.username) return null;
      return { username: payload.sub };
    },

    getUser() {
      return { username: current.username };
    },
  };
};
