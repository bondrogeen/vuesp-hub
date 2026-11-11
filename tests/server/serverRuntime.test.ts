import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DeviceRuntime } from '@core/application/deviceRuntime.ts';
import { server } from '@server/app/server.ts';

test('creates the server runtime from injected platform adapters', () => {
  const runtime = server({
    deviceRuntime: new DeviceRuntime({
      loadDevices: async () => [],
      createConnections: () => {
        throw new Error('The manager should not be created by the HTTP adapter');
      },
    }),
    getDeviceModel: async () => {
      throw new Error('The model should not be loaded during composition');
    },
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
