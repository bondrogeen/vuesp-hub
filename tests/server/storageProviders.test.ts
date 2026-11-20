import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { createStorageFactories, resolveStorageProvider } from '@server/shared/storage/providers.ts';

test('storage provider selection defaults to sqlite and rejects unknown names', () => {
  assert.equal(resolveStorageProvider({}), 'sqlite');
  assert.equal(resolveStorageProvider({ VUESP_STORAGE_PROVIDER: 'SQLite' }), 'sqlite');
  assert.throws(() => resolveStorageProvider({ VUESP_STORAGE_PROVIDER: 'mysql' }), /Unsupported storage provider: mysql/);
});

test('factories create the three SQLite stores', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-providers-'));
  try {
    const factories = createStorageFactories({ dataDirectory: directory });
    assert.equal(factories.provider, 'sqlite');
    const state = factories.createState();
    const config = factories.createConfig();
    const history = factories.createHistory();
    assert.equal(typeof state.load, 'function');
    assert.equal(typeof config.list, 'function');
    assert.equal(typeof history.query, 'function');
    state.close();
    void config.close();
    void history.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
