import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { SecretProvider } from './secretProvider.ts';

const FORMAT_PREFIX = 'v1:';
const SALT_BYTES = 16;
const KEY_BYTES = 32;

const loadSalt = (saltPath: string): Buffer => {
  mkdirSync(dirname(saltPath), { recursive: true, mode: 0o700 });
  if (!existsSync(saltPath)) {
    writeFileSync(saltPath, randomBytes(SALT_BYTES), { mode: 0o600 });
  }
  chmodSync(saltPath, 0o600);
  const salt = readFileSync(saltPath);
  if (salt.length < SALT_BYTES) throw new Error(`Invalid secret salt file: ${saltPath}`);
  return salt;
};

/**
 * Headless secret provider. The master key/passphrase comes from the user
 * (VUESP_SECRET_KEY or --secret-key) and is never written to disk; only the
 * random salt is persisted. Without a key the provider refuses to encrypt or
 * decrypt instead of falling back to plaintext.
 */
export const createAesSecretProvider = ({ passphrase, saltPath }: { passphrase?: string; saltPath: string }): SecretProvider => {
  if (!passphrase) {
    const message = 'Secure credential storage is unavailable. Set VUESP_SECRET_KEY or pass --secret-key.';
    return {
      encrypt() {
        throw new Error(message);
      },
      decrypt() {
        throw new Error(message);
      },
    };
  }

  const key = scryptSync(passphrase, loadSalt(saltPath), KEY_BYTES);

  return {
    encrypt(value) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
      return FORMAT_PREFIX + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
    },
    decrypt(value) {
      if (!value.startsWith(FORMAT_PREFIX)) throw new Error('Unsupported credential format');
      const payload = Buffer.from(value.slice(FORMAT_PREFIX.length), 'base64');
      if (payload.length < 28) throw new Error('Invalid encrypted credential');
      const decipher = createDecipheriv('aes-256-gcm', key, payload.subarray(0, 12));
      decipher.setAuthTag(payload.subarray(12, 28));
      return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8');
    },
  };
};
