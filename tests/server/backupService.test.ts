import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { c as createTar, x as extractTar } from 'tar';

import { STATE_SCHEMA_VERSION } from '@core/application/stateStore.ts';
import { BackupService } from '@server/modules/backup/application/backupService.ts';
import { SqliteStateStore } from '@server/shared/storage/sqliteStateStore.ts';

test('creates and restores a checksummed backup', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-backup-'));
  const data = path.join(root, 'data');
  const restore = path.join(root, 'restore');
  const archive = path.join(root, 'backup.tgz');
  await mkdir(data, { recursive: true });
  await writeFile(path.join(data, 'store.json'), '{"panels":1}\n');
  await mkdir(path.join(data, 'module-data', 'demo'), { recursive: true });
  await writeFile(path.join(data, 'module-data', 'demo', 'storage.json'), '{"ok":true}\n');

  const store = new SqliteStateStore(path.join(data, 'state.sqlite'));
  await store.save({ schemaVersion: STATE_SCHEMA_VERSION, savedAt: 1, devices: [] });
  await store.close();

  const service = new BackupService({ dataDirectory: data, appVersion: '1.2.0' });
  const manifest = await service.create(archive);
  assert.equal(manifest.appVersion, '1.2.0');
  assert.ok(manifest.files['store.json']);
  assert.ok(manifest.files['state.sqlite']);

  await service.restore(archive, restore);
  assert.equal((await readFile(path.join(restore, 'store.json'), 'utf8')).trim(), '{"panels":1}');
  assert.equal((await stat(path.join(restore, 'state.sqlite'))).isFile(), true);
  assert.equal((await readFile(path.join(restore, 'module-data', 'demo', 'storage.json'), 'utf8')).trim(), '{"ok":true}');

  await rm(root, { recursive: true, force: true });
});

test('restores into a clean directory and rejects a tampered archive', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-backup-clean-'));
  const data = path.join(root, 'data');
  await mkdir(data, { recursive: true });
  await writeFile(path.join(data, 'store.json'), '{"panels":2}\n');
  const store = new SqliteStateStore(path.join(data, 'state.sqlite'));
  await store.save({ schemaVersion: STATE_SCHEMA_VERSION, savedAt: 1, devices: [] });
  await store.close();

  const service = new BackupService({ dataDirectory: data, appVersion: '1.2.0' });
  const archive = path.join(root, 'clean.tgz');
  await service.create(archive);

  // Simulate a fresh installation: the target directory does not exist yet.
  const clean = path.join(root, 'fresh', 'nested', 'data');
  const manifest = await service.restore(archive, clean);
  assert.equal(manifest.appVersion, '1.2.0');
  assert.equal((await readFile(path.join(clean, 'store.json'), 'utf8')).trim(), '{"panels":2}');

  const reopened = new SqliteStateStore(path.join(clean, 'state.sqlite'));
  assert.equal((await reopened.load())?.schemaVersion, STATE_SCHEMA_VERSION);
  await reopened.close();

  // Repack the same files with a modified payload but the original manifest.
  const staging = path.join(root, 'tampered');
  await mkdir(staging, { recursive: true });
  await extractTar({ file: archive, cwd: staging, gzip: true });
  await writeFile(path.join(staging, 'store.json'), '{"panels":999}\n');
  const tamperedArchive = path.join(root, 'tampered.tgz');
  await createTar({ file: tamperedArchive, gzip: true, cwd: staging }, ['.']);
  await assert.rejects(service.restore(tamperedArchive, path.join(root, 'rejected')), /mismatch/);

  await rm(root, { recursive: true, force: true });
});
