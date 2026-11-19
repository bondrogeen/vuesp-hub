import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, rm, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

/**
 * Encrypted backup container:
 *
 *   "VUESPBAK1" | salt(16) | iv(12) | authTag(16) | AES-256-GCM ciphertext
 *
 * The header is written before the ciphertext so restore can detect the format
 * and derive the key without loading the whole archive into memory.
 */
export const BACKUP_MAGIC = Buffer.from('VUESPBAK1', 'ascii');
export const BACKUP_HEADER_LENGTH = BACKUP_MAGIC.length + 16 + 12 + 16;

const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export const backupPassphrase = (explicit?: string): string | undefined => {
  const value = explicit ?? process.env.VUESP_BACKUP_PASSPHRASE;
  return value && value.length >= 8 ? value : undefined;
};

export const isEncryptedBackup = async (file: string): Promise<boolean> => {
  const handle = await open(file, 'r');
  try {
    const magic = Buffer.alloc(BACKUP_MAGIC.length);
    const { bytesRead } = await handle.read(magic, 0, magic.length, 0);
    return bytesRead === magic.length && magic.equals(BACKUP_MAGIC);
  } finally {
    await handle.close();
  }
};

export const encryptBackupFile = async (source: string, target: string, passphrase: string): Promise<void> => {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = scryptSync(passphrase, salt, KEY_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const cipherPath = `${target}.cipher`;
  try {
    await pipeline(createReadStream(source), cipher, createWriteStream(cipherPath, { mode: 0o600 }));
    const header = Buffer.concat([BACKUP_MAGIC, salt, iv, cipher.getAuthTag()]);
    await writeFile(target, header, { mode: 0o600 });
    await pipeline(createReadStream(cipherPath), createWriteStream(target, { flags: 'a', mode: 0o600 }));
  } finally {
    await rm(cipherPath, { force: true });
  }
};

export const decryptBackupFile = async (source: string, target: string, passphrase: string): Promise<void> => {
  const handle = await open(source, 'r');
  let salt: Buffer;
  let iv: Buffer;
  let tag: Buffer;
  try {
    const header = Buffer.alloc(BACKUP_HEADER_LENGTH);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (bytesRead !== header.length || !header.subarray(0, BACKUP_MAGIC.length).equals(BACKUP_MAGIC)) {
      throw new Error('Backup is not in the encrypted container format');
    }
    let offset = BACKUP_MAGIC.length;
    salt = header.subarray(offset, offset += SALT_LENGTH);
    iv = header.subarray(offset, offset += IV_LENGTH);
    tag = header.subarray(offset, offset += TAG_LENGTH);
  } finally {
    await handle.close();
  }

  const key = scryptSync(passphrase, salt, KEY_LENGTH);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  await pipeline(
    createReadStream(source, { start: BACKUP_HEADER_LENGTH }),
    decipher,
    createWriteStream(target, { mode: 0o600 }),
  );
};

export const backupEncryptionEnabled = async (file: string): Promise<boolean> =>
  (await stat(file).catch(() => null)) !== null && isEncryptedBackup(file);
