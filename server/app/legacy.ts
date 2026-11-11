import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createAesSecretProvider } from '@server/shared/secrets/aesSecretProvider.ts';
import type { SecretProvider } from '@server/shared/secrets/secretProvider.ts';

const CAMERA_MODULE_ID = 'vuesp-hub.video.cameras';
const LEGACY_MODULE_IDS = ['vuesp.cameras'];

/**
 * Cameras used to live in the core and then in `vuesp.cameras`. On upgrade,
 * move the registry into `vuesp-hub.video.cameras` once, keeping the old file
 * as a backup.
 */
export const migrateLegacyCameraData = (dataDirectory: string): void => {
  const moduleData = path.join(dataDirectory, 'module-data');
  const destination = path.join(moduleData, CAMERA_MODULE_ID, 'storage.json');

  // Rename storage from the old module id before considering the core file.
  for (const legacyId of LEGACY_MODULE_IDS) {
    const oldDirectory = path.join(moduleData, legacyId);
    const oldStorage = path.join(oldDirectory, 'storage.json');
    if (!existsSync(oldStorage) || existsSync(destination)) continue;
    try {
      mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
      renameSync(oldStorage, destination);
      console.log(`Migrated module data: ${legacyId} -> ${CAMERA_MODULE_ID}`);
    } catch (error) {
      console.warn(`Could not migrate module data ${legacyId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (existsSync(destination)) return;

  const legacy = path.join(dataDirectory, 'cameras.json');
  if (!existsSync(legacy)) return;

  try {
    const parsed: unknown = JSON.parse(readFileSync(legacy, 'utf8'));
    if (!Array.isArray(parsed)) return;

    mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
    writeFileSync(destination, `${JSON.stringify({ cameras: parsed }, null, 2)}\n`, { mode: 0o600 });
    renameSync(legacy, `${legacy}.migrated`);
    console.log(`Migrated ${parsed.length} camera(s) to the ${CAMERA_MODULE_ID} module`);
  } catch (error) {
    console.warn(`Could not migrate legacy cameras: ${error instanceof Error ? error.message : String(error)}`);
  }
};


const YANDEX_MODULE_ID = 'vuesp-hub.yandex';

const moduleSecret = (dataDirectory: string): string => {
  const directory = path.join(dataDirectory, 'module-data', YANDEX_MODULE_ID);
  const file = path.join(directory, 'secret.key');
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (existsSync(file)) {
    const value = readFileSync(file, 'utf8').trim();
    if (/^[a-f0-9]{64}$/i.test(value)) return value;
  }
  const value = randomBytes(32).toString('hex');
  writeFileSync(file, `${value}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
  return value;
};

/** Move the old core Alisa token store into the Yandex module, re-encrypting tokens. */
export const migrateLegacyAlisaData = (dataDirectory: string, source?: SecretProvider): void => {
  const legacy = path.join(dataDirectory, 'alisa.json');
  const destination = path.join(dataDirectory, 'module-data', YANDEX_MODULE_ID, 'alisa.json');
  if (!source || !existsSync(legacy) || existsSync(destination)) return;

  try {
    const raw: unknown = JSON.parse(readFileSync(legacy, 'utf8'));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;

    const target = createAesSecretProvider({
      passphrase: moduleSecret(dataDirectory),
      saltPath: path.join(dataDirectory, 'module-data', YANDEX_MODULE_ID, 'secret.salt'),
    });
    const migrateAccount = (account: unknown): unknown => {
      if (!account || typeof account !== 'object') return account;
      const copy = { ...(account as Record<string, unknown>) };
      for (const key of ['accessToken', 'smartHomeToken'] as const) {
        const value = copy[key];
        if (typeof value !== 'string' || !value) continue;
        try {
          copy[key] = target.encrypt(source.decrypt(value));
        } catch {
          // Keep the old value only if it was stored unencrypted.
          if (value.startsWith('v1:')) delete copy[key];
        }
      }
      return copy;
    };

    const sourceData = raw as { accounts?: Record<string, unknown>; deviceId?: string };
    const accounts: Record<string, unknown> = {};
    for (const [userId, value] of Object.entries(sourceData.accounts ?? {})) {
      accounts[userId] = Array.isArray(value) ? value.map(migrateAccount) : migrateAccount(value);
    }
    const next = { ...sourceData, accounts };
    mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
    writeFileSync(destination, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
    chmodSync(destination, 0o600);
    renameSync(legacy, `${legacy}.migrated`);
    console.log('Migrated Alisa accounts to the Yandex module');
  } catch (error) {
    console.warn(`Could not migrate legacy Alisa data: ${error instanceof Error ? error.message : String(error)}`);
  }
};
