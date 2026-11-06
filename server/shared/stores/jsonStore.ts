import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { StoreEntity, StoreModel, StoreModelFactory } from './types.ts';

type JsonRecord = Record<string, unknown>;

const readJson = (filePath: string): JsonRecord => {
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, 'utf8');
  if (!raw.trim()) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid JSON store: ${filePath}`);
  }
  return parsed as JsonRecord;
};

const writeJson = (filePath: string, value: JsonRecord) => {
  mkdirSync(dirname(filePath), { recursive: true, mode: 0o700 });
  const temporary = `${filePath}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporary, filePath);
  chmodSync(filePath, 0o600);
};

export interface JsonSettingsStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
}

/** File-backed replacement for electron-store used by the headless server. */
export const createJsonStoreModel = (filePath: string): StoreModelFactory => {
  const readList = (key: string): StoreEntity[] => {
    const value = readJson(filePath)[key];
    return Array.isArray(value) ? (value as StoreEntity[]) : [];
  };

  const writeList = (key: string, value: StoreEntity[]) => {
    const data = readJson(filePath);
    data[key] = value;
    writeJson(filePath, data);
  };

  return (key: string): StoreModel => ({
    getAll: async () => readList(key),

    getById: async id => readList(key).find(item => item.id === id),

    create: async data => {
      const items = readList(key);
      const max = items.length ? Math.max(...items.map(item => item.id)) : 0;
      const item = { ...data, id: max + 1 };
      writeList(key, [...items, item]);
      return item;
    },

    update: async (id, data) => {
      const items = readList(key);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      const updated = { ...items[index], ...data };
      items[index] = updated;
      writeList(key, items);
      return updated;
    },

    delete: async id => {
      const items = readList(key);
      const removed = items.find(item => item.id === id);
      if (!removed) return undefined;
      writeList(key, items.filter(item => item.id !== id));
      return removed;
    },
  });
};

export const createJsonSettingsStore = (filePath: string): JsonSettingsStore => ({
  get<T>(key: string, defaultValue?: T): T | undefined {
    const value = readJson(filePath)[key];
    return value === undefined ? defaultValue : (value as T);
  },
  set(key: string, value: unknown) {
    const data = readJson(filePath);
    data[key] = value;
    writeJson(filePath, data);
  },
});
