import path from 'node:path';

import { SqliteConfigStore } from './sqliteConfigStore.ts';
import { SqliteHistoryStore } from './sqliteHistoryStore.ts';
import { SqliteStateStore } from './sqliteStateStore.ts';

export type TStorageProvider = 'sqlite';

export const STORAGE_PROVIDERS: TStorageProvider[] = ['sqlite'];

/**
 * Storage backend selection. Today only the built-in SQLite provider ships;
 * the switch is the seam where module-provided backends (JSON, MySQL, Mongo)
 * plug in without touching the composition root.
 */
export const resolveStorageProvider = (env: NodeJS.ProcessEnv = process.env): TStorageProvider => {
  const value = (env.VUESP_STORAGE_PROVIDER ?? 'sqlite').trim().toLowerCase();
  if (!(STORAGE_PROVIDERS as string[]).includes(value)) {
    throw new Error(`Unsupported storage provider: ${value}. Available: ${STORAGE_PROVIDERS.join(', ')}`);
  }
  return value as TStorageProvider;
};

export interface IStorageFactories {
  provider: TStorageProvider;
  createState(): SqliteStateStore;
  createConfig(): SqliteConfigStore;
  createHistory(): SqliteHistoryStore;
}

export const createStorageFactories = ({
  dataDirectory,
  env = process.env,
}: {
  dataDirectory: string;
  env?: NodeJS.ProcessEnv;
}): IStorageFactories => {
  const provider = resolveStorageProvider(env);

  switch (provider) {
    case 'sqlite':
      return {
        provider,
        createState: () => new SqliteStateStore(path.join(dataDirectory, 'state.sqlite')),
        createConfig: () => new SqliteConfigStore(path.join(dataDirectory, 'config.sqlite')),
        createHistory: () => new SqliteHistoryStore(path.join(dataDirectory, 'history.sqlite')),
      };
  }
};
