import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { SqliteConfigStore } from '@server/shared/storage/sqliteConfigStore.ts';

test('SQLite config store persists sections and keys', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'vuesp-config-'));
  const file = path.join(dir, 'config.sqlite');
  const store = new SqliteConfigStore(file);
  await store.set('areas', 'living', { name: 'Living room' });
  await store.set('panels', 'home', { name: 'Home' });
  assert.deepEqual(await store.get('areas', 'living'), { name: 'Living room' });
  assert.deepEqual(await store.list('areas'), { living: { name: 'Living room' } });
  assert.equal(await store.delete('areas', 'living'), true);
  assert.equal(await store.get('areas', 'living'), undefined);
  assert.equal((await store.health()).ok, true);
  await store.close();

  const reopened = new SqliteConfigStore(file);
  assert.deepEqual(await reopened.get('panels', 'home'), { name: 'Home' });
  await reopened.close();
  rmSync(dir, { recursive: true, force: true });
});
