import assert from 'node:assert/strict';
import { test } from 'node:test';

import { server } from '../../server/server.ts';

test('creates the server runtime from injected platform adapters', () => {
  const runtime = server({
    getDeviceModel: async () => {
      throw new Error('The model should not be loaded during composition');
    },
    closeDeviceModel: async () => {},
    storeModel: () => {
      throw new Error('The store should not be loaded during composition');
    },
    serialSettingsStore: {
      get: () => undefined,
      set: () => {},
    },
  });

  assert.equal(typeof runtime.createExpress, 'function');
  assert.equal(typeof runtime.closeExpress, 'function');
});
