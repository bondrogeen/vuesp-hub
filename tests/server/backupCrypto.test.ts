import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { STATE_SCHEMA_VERSION } from '@core/application/stateStore.ts';
import { BackupService } from '@server/modules/backup/application/backupService.ts';
import { BACKUP_MAGIC, decryptBackupFile, isEncryptedBackup } from '@server/modules/backup/application/backupCrypto.ts';
import { SqliteStateStore } from '@server/shared/storage/sqliteStateStore.ts';

const setup = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-backup-crypto-'));
  const data = path.join(root, 'data');
  await mkdir(data, { recursive: true });
  await writeFile(path.join(data, 'store.json'), '{"panels":3}\n');
  const store = new SqliteStateStore(path.join(data, 'state.sqlite'));
  await store.save({ schemaVersion: STATE_SCHEMA_VERSION, savedAt: 1, devices: [] });
  await store.close();
  return { root, data };
};

test('encrypted backup round-trips and never contains plaintext data', async () => {
  delete process.env.VUESP_BACKUP_PASSPHRASE;
  const { root, data } = await setup();
  const archive = path.join(root, 'secure.tgz.enc');
  const service = new BackupService({ dataDirectory: data, appVersion: '2.0.0' });

  const manifest = await service.create(archive, { passphrase: 'correct horse battery' });
  assert.equal(manifest.encrypted, true);
  assert.equal(await isEncryptedBackup(archive), true);
  assert.equal((await readFile(archive)).subarray(0, BACKUP_MAGIC.length).equals(BACKUP_MAGIC), true);
  assert.equal((await readFile(archive, 'utf8')).includes('panels'), false);

  const clean = path.join(root, 'clean');
  const restored = await service.restore(archive, clean, { passphrase: 'correct horse battery' });
  assert.equal(restored.encrypted, true);
  assert.equal((await readFile(path.join(clean, 'store.json'), 'utf8')).trim(), '{"panels":3}');

  const rejected = path.join(root, 'rejected');
  await assert.rejects(service.restore(archive, rejected, { passphrase: 'wrong passphrase' }), /unable to authenticate|bad decrypt/i);
  await assert.rejects(service.restore(archive, rejected), /passphrase is required/);

  await rm(root, { recursive: true, force: true });
});

test('passphrase from the environment enables encryption by default', async () => {
  const { root, data } = await setup();
  process.env.VUESP_BACKUP_PASSPHRASE = 'environment-passphrase';
  try {
    const service = new BackupService({ dataDirectory: data, appVersion: '2.0.0' });
    assert.equal(service.encrypts, true);
    const archive = path.join(root, 'env.tgz.enc');
    const manifest = await service.create(archive);
    assert.equal(manifest.encrypted, true);

    const clean = path.join(root, 'clean-env');
    await service.restore(archive, clean);
    assert.equal((await readFile(path.join(clean, 'store.json'), 'utf8')).trim(), '{"panels":3}');
  } finally {
    delete process.env.VUESP_BACKUP_PASSPHRASE;
    await rm(root, { recursive: true, force: true });
  }
});

test('decryptBackupFile rejects a truncated container', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-backup-broken-'));
  try {
    const file = path.join(root, 'broken.enc');
    await writeFile(file, BACKUP_MAGIC);
    await assert.rejects(decryptBackupFile(file, path.join(root, 'out'), 'passphrase'), /not in the encrypted container format/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
