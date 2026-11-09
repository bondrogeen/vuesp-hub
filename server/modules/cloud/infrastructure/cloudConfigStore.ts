import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { SecretProvider } from '@shared/secrets/secretProvider.ts';

export interface CloudConfig {
  url: string;
  hubId: string;
  name: string;
  token: string;
  pairedAt: string;
  /** Tile keys (`<deviceUuid>:<index>`) chosen for publication. */
  publishedTiles?: string[];
}

interface StoredCloudConfig {
  url: string;
  hubId: string;
  name: string;
  token: string;
  pairedAt: string;
  publishedTiles?: string[];
}

export interface CloudConfigStore {
  read(): CloudConfig | null;
  write(config: CloudConfig): void;
  clear(): void;
}

const FILE_NAME = 'cloud.json';

export const createCloudConfigStore = ({
  dataDirectory,
  secretProvider,
}: {
  dataDirectory: string;
  secretProvider: SecretProvider;
}): CloudConfigStore => {
  const file = path.join(dataDirectory, FILE_NAME);
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });

  return {
    read() {
      if (!existsSync(file)) return null;
      try {
        const stored = JSON.parse(readFileSync(file, 'utf8')) as StoredCloudConfig;
        if (!stored.url || !stored.token || !stored.hubId) return null;
        return {
          url: stored.url,
          hubId: stored.hubId,
          name: stored.name || 'Vuesp Hub',
          token: secretProvider.decrypt(stored.token),
          pairedAt: stored.pairedAt || new Date().toISOString(),
          ...(Array.isArray(stored.publishedTiles)
            ? { publishedTiles: stored.publishedTiles.filter((key): key is string => typeof key === 'string') }
            : {}),
        };
      } catch {
        return null;
      }
    },

    write(config) {
      const stored: StoredCloudConfig = {
        ...config,
        token: secretProvider.encrypt(config.token),
      };
      writeFileSync(file, `${JSON.stringify(stored, null, 2)}\n`, { mode: 0o600 });
      chmodSync(file, 0o600);
    },

    clear() {
      if (existsSync(file)) rmSync(file, { force: true });
    },
  };
};
