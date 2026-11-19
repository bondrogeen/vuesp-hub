import { createHash } from 'node:crypto';
import { copyFile, cp, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { c as createTar } from 'tar';

import { extractArchive } from '@server/shared/security/archive.ts';
import {
  backupPassphrase,
  decryptBackupFile,
  encryptBackupFile,
  isEncryptedBackup,
} from './backupCrypto.ts';

export interface IBackupManifest {
  schemaVersion: number;
  appVersion: string;
  createdAt: number;
  files: Record<string, { size: number; sha256: string }>;
  encrypted: boolean;
}

export interface IBackupServiceOptions {
  dataDirectory: string;
  appVersion: string;
  /** Defaults to `VUESP_BACKUP_PASSPHRASE` when set. */
  passphrase?: string;
}

export interface IBackupCreateOptions {
  passphrase?: string;
}

export interface IBackupRestoreOptions {
  passphrase?: string;
}

const DB_FILES = ['vuesp.sqlite', 'state.sqlite', 'config.sqlite', 'history.sqlite'];
const JSON_FILES = ['store.json', 'settings.json', 'users.json', 'secret.salt', 'jwt.secret', 'mobile.json'];

const hashFile = async (file: string): Promise<string> =>
  createHash('sha256').update(await readFile(file)).digest('hex');

export class BackupService {
  readonly dataDirectory: string;
  private readonly appVersion: string;
  private readonly passphrase?: string;

  constructor({ dataDirectory, appVersion, passphrase }: IBackupServiceOptions) {
    this.dataDirectory = dataDirectory;
    this.appVersion = appVersion;
    this.passphrase = passphrase;
  }

  /** True when the service will encrypt new backups. */
  get encrypts(): boolean {
    return backupPassphrase(this.passphrase) !== undefined;
  }

  async create(outputPath: string, options: IBackupCreateOptions = {}): Promise<IBackupManifest> {
    const passphrase = backupPassphrase(options.passphrase ?? this.passphrase);
    const staging = path.join(path.dirname(outputPath), `.backup-${Date.now()}`);
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging, { recursive: true, mode: 0o700 });
    const files: IBackupManifest['files'] = {};

    try {
      for (const name of DB_FILES) {
        const source = path.join(this.dataDirectory, name);
        const target = path.join(staging, name);
        try {
          await stat(source);
        } catch {
          continue;
        }
        const database = new DatabaseSync(source);
        try {
          database.exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
        } finally {
          database.close();
        }
      }

      for (const name of JSON_FILES) {
        const source = path.join(this.dataDirectory, name);
        const target = path.join(staging, name);
        try {
          await copyFile(source, target);
        } catch {
          // Optional file is absent.
        }
      }

      const moduleData = path.join(this.dataDirectory, 'module-data');
      try {
        await cp(moduleData, path.join(staging, 'module-data'), { recursive: true });
      } catch {
        // No module data yet.
      }

      await this.collectChecksums(staging, files);
      const manifest: IBackupManifest = {
        schemaVersion: 1,
        appVersion: this.appVersion,
        createdAt: Date.now(),
        files,
        encrypted: Boolean(passphrase),
      };
      await writeFile(path.join(staging, 'backup.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
      const plainArchive = `${outputPath}.${process.pid}.tar`;
      try {
        await createTar({ file: plainArchive, gzip: true, cwd: staging }, ['.']);
        if (passphrase) {
          await encryptBackupFile(plainArchive, outputPath, passphrase);
        } else {
          await rename(plainArchive, outputPath);
        }
      } finally {
        await rm(plainArchive, { force: true });
      }
      return manifest;
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }

  async restore(archivePath: string, targetDirectory = this.dataDirectory, options: IBackupRestoreOptions = {}): Promise<IBackupManifest> {
    const staging = path.join(path.dirname(archivePath), `.restore-${Date.now()}`);
    await rm(staging, { recursive: true, force: true });
    await mkdir(staging, { recursive: true, mode: 0o700 });
    let extracted = archivePath;
    let decrypted: string | undefined;
    try {
      if (await isEncryptedBackup(archivePath)) {
        const passphrase = backupPassphrase(options.passphrase ?? this.passphrase);
        if (!passphrase) throw new Error('Backup is encrypted: passphrase is required');
        decrypted = `${staging}.tar`;
        await decryptBackupFile(archivePath, decrypted, passphrase);
        extracted = decrypted;
      }
      await extractArchive({ file: extracted, cwd: staging, gzip: true });
      const manifest = JSON.parse(await readFile(path.join(staging, 'backup.json'), 'utf8')) as IBackupManifest;
      if (manifest.schemaVersion !== 1) throw new Error(`Unsupported backup schema: ${manifest.schemaVersion}`);
      await this.verifyChecksums(staging, manifest);
      await mkdir(targetDirectory, { recursive: true, mode: 0o700 });
      for (const name of Object.keys(manifest.files)) {
        const source = path.join(staging, name);
        const target = path.join(targetDirectory, name);
        await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
        await copyFile(source, target);
      }
      const moduleData = path.join(staging, 'module-data');
      try {
        await cp(moduleData, path.join(targetDirectory, 'module-data'), { recursive: true });
      } catch {
        // No module data in this backup.
      }
      return manifest;
    } finally {
      await rm(staging, { recursive: true, force: true });
      if (decrypted) await rm(decrypted, { force: true });
    }
  }

  private async collectChecksums(root: string, files: IBackupManifest['files'], prefix = ''): Promise<void> {
    for (const entry of await readdir(path.join(root, prefix), { withFileTypes: true })) {
      const relative = path.posix.join(prefix, entry.name);
      if (entry.name === 'backup.json') continue;
      const full = path.join(root, relative);
      if (entry.isDirectory()) {
        await this.collectChecksums(root, files, relative);
      } else if (entry.isFile()) {
        files[relative] = { size: (await stat(full)).size, sha256: await hashFile(full) };
      }
    }
  }

  private async verifyChecksums(root: string, manifest: IBackupManifest): Promise<void> {
    for (const [name, expected] of Object.entries(manifest.files)) {
      const full = path.join(root, name);
      const info = await stat(full);
      if (info.size !== expected.size) throw new Error(`Backup file size mismatch: ${name}`);
      if ((await hashFile(full)) !== expected.sha256) throw new Error(`Backup checksum mismatch: ${name}`);
    }
  }
}
