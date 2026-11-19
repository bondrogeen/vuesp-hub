import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { STATE_SCHEMA_VERSION } from '@core/application/stateStore.ts';
import { openWithRecovery, isSqliteCorruption, quarantineSqlite } from '@server/shared/storage/recovery.ts';
import { SqliteStateStore } from '@server/shared/storage/sqliteStateStore.ts';

test('detects sqlite corruption messages', () => {
  assert.equal(isSqliteCorruption(new Error('file is not a database')), true);
  assert.equal(isSqliteCorruption(new Error('database disk image is malformed')), true);
  assert.equal(isSqliteCorruption(new Error('SQLITE_READONLY')), false);
});

test('a power-loss-truncated state database is quarantined and recreated', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-recovery-'));
  const file = path.join(directory, 'state.sqlite');
  writeFileSync(file, 'this is definitely not sqlite data');
  writeFileSync(`${file}-wal`, 'partial wal');

  const events: string[][] = [];
  try {
    const store = openWithRecovery(
      file,
      () => new SqliteStateStore(file),
      moved => events.push(moved),
    );
    const snapshot = await store.load();
    assert.equal(snapshot?.schemaVersion, STATE_SCHEMA_VERSION);
    await store.close();

    assert.equal(events.length, 1);
    assert.ok(events[0]!.includes(file));
    const names = readdirSync(directory);
    assert.ok(names.some(name => name.includes('state.sqlite.corrupt-')));
    assert.ok(names.some(name => name.includes('state.sqlite-wal.corrupt-')));

    // The recreated database is healthy after a restart.
    const reopened = new SqliteStateStore(file);
    assert.equal((await reopened.load())?.schemaVersion, STATE_SCHEMA_VERSION);
    await reopened.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('non-corruption errors are not swallowed', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-recovery-strict-'));
  try {
    assert.throws(
      () => openWithRecovery(path.join(directory, 'x.sqlite'), () => { throw new Error('permission denied'); }),
      /permission denied/,
    );
    assert.deepEqual(quarantineSqlite(path.join(directory, 'missing.sqlite')), []);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
