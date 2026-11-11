import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { createModuleCatalog } from '@server/modules/modules/application/moduleCatalog.ts';

test('loads a local catalog and resolves artifacts relative to it', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vuesp-catalog-'));
  const catalogFile = path.join(directory, 'catalog.json');
  await writeFile(catalogFile, JSON.stringify({
    modules: [{
      id: 'vuesp-hub.test',
      name: 'Test',
      version: '1.0.0',
      artifact: '../dist/vuesp-hub.test-1.0.0.vmod',
      sha256: 'a'.repeat(64),
      size: 10,
    }],
  }));

  try {
    const catalog = createModuleCatalog({ url: catalogFile });
    const modules = await catalog.load();
    assert.equal(modules.length, 1);
    assert.equal(modules[0].id, 'vuesp-hub.test');
    assert.match(modules[0].artifact, /^file:\/\/.*\/dist\/vuesp-hub\.test-1\.0\.0\.vmod$/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
