import { randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface AlisaStoredAccount {
  id: string;
  login: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  updatedAt: string;
}

interface AlisaFile {
  deviceId?: string;
  accounts?: Record<string, unknown>;
}

export interface AlisaTokenStore {
  list(userId: number): AlisaStoredAccount[];
  save(userId: number, account: AlisaStoredAccount): void;
  remove(userId: number, accountId: string): void;
  removeAll(userId: number): void;
  deviceId(): string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeAccount = (value: unknown, fallbackId: string): AlisaStoredAccount | null => {
  if (!isRecord(value) || typeof value.accessToken !== 'string') return null;
  return {
    id: typeof value.id === 'string' && value.id ? value.id : fallbackId,
    login: typeof value.login === 'string' ? value.login : null,
    accessToken: value.accessToken,
    refreshToken: typeof value.refreshToken === 'string' ? value.refreshToken : null,
    expiresAt: typeof value.expiresAt === 'string' ? value.expiresAt : null,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date(0).toISOString(),
  };
};

/**
 * Reads both the legacy per-user object and the new per-user list. The first
 * single-account version stored `accounts[userId] = { accessToken, ... }`;
 * it is migrated to a list on the next save without losing the token.
 */
const normalizeAccounts = (value: unknown): AlisaStoredAccount[] => {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => normalizeAccount(item, `account-${index + 1}`))
      .filter((item): item is AlisaStoredAccount => item !== null);
  }
  if (!isRecord(value)) return [];
  if (typeof value.accessToken === 'string') {
    const account = normalizeAccount(value, 'legacy');
    return account ? [account] : [];
  }
  return Object.entries(value)
    .map(([id, item]) => normalizeAccount(item, id))
    .filter((item): item is AlisaStoredAccount => item !== null);
};

const readFile = (filePath: string): AlisaFile => {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, 'utf8');
  if (!raw.trim()) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid Alisa token store: ${filePath}`);
  }
  return parsed as AlisaFile;
};

const writeFile = (filePath: string, value: AlisaFile) => {
  mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, filePath);
  chmodSync(filePath, 0o600);
};

export const createAlisaTokenStore = ({ dataDirectory }: { dataDirectory: string }): AlisaTokenStore => {
  const filePath = path.join(dataDirectory, 'alisa.json');
  const read = () => readFile(filePath);
  const write = (value: AlisaFile) => writeFile(filePath, value);

  const list = (userId: number): AlisaStoredAccount[] => normalizeAccounts(read().accounts?.[String(userId)]);

  const saveList = (userId: number, accounts: AlisaStoredAccount[]) => {
    const data = read();
    data.accounts = { ...(data.accounts ?? {}), [String(userId)]: accounts };
    write(data);
  };

  return {
    list,

    save(userId, account) {
      const accounts = list(userId);
      const index = accounts.findIndex((item) => item.id === account.id);
      if (index >= 0) accounts[index] = account;
      else accounts.push(account);
      saveList(userId, accounts);
    },

    remove(userId, accountId) {
      saveList(
        userId,
        list(userId).filter((account) => account.id !== accountId)
      );
    },

    removeAll(userId) {
      const data = read();
      if (!data.accounts?.[String(userId)]) return;
      delete data.accounts[String(userId)];
      write(data);
    },

    deviceId() {
      const data = read();
      if (typeof data.deviceId === 'string' && data.deviceId.trim()) return data.deviceId;
      const deviceId = randomUUID();
      write({ ...data, deviceId });
      return deviceId;
    },
  };
};
