import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { createConfigStoreModel } from '@server/shared/storage/configStoreModel.ts';
import { SqliteConfigStore } from '@server/shared/storage/sqliteConfigStore.ts';

test('config store model keeps the numeric store API over SQLite', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'vuesp-config-model-'));
  const store = new SqliteConfigStore(path.join(dir, 'config.sqlite'));
  const model = createConfigStoreModel(store, 'panels');
  const first = await model.create({ name: 'Home', widgets: [] });
  const second = await model.create({ name: 'Kitchen', widgets: [] });
  assert.equal(first.id, 1);
  assert.equal(second.id, 2);
  assert.equal((await model.getAll()).length, 2);
  assert.equal((await model.update(1, { name: 'Main' }))?.name, 'Main');
  assert.equal((await model.delete(2))?.id, 2);
  assert.equal((await model.getAll()).length, 1);
  await store.close();
  rmSync(dir, { recursive: true, force: true });
});
