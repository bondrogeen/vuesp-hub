import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MODULE_STORAGE_LIMIT_BYTES, serializeModuleStorage } from '@server/module-host/storage.ts';

test('module storage is serialized and capped', () => {
  assert.equal(serializeModuleStorage({ key: 'value' }, 1_024).includes('"key": "value"'), true);
  assert.throws(
    () => serializeModuleStorage({ blob: 'x'.repeat(2_000) }, 1_024),
    /storage limit exceeded/i,
  );
  // A few small keys stay well below the default 10 MB limit.
  assert.ok(MODULE_STORAGE_LIMIT_BYTES >= 10 * 1024 * 1024);
});
