import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import express from 'express';

import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import type { IDeviceAdapter } from '@core/application/deviceAdapter.ts';
import { AdapterManager } from '@server/modules/adapters/application/adapterManager.ts';
import { createAdapterRouter } from '@server/modules/adapters/api/adapterRoutes.ts';

const adapter: IDeviceAdapter = {
  id: 'demo',
  protocol: 'mqtt',
  mode: 'push',
  async start() {},
  async stop() {},
  async health() { return { status: 'ready', updatedAt: Date.now() }; },
  async listDevices() {
    return [{ deviceId: 'mqtt-1', name: 'Sensor', protocol: 'mqtt', online: true, entities: [] }];
  },
  async execute() { return { ok: true }; },
  onEvent() { return () => undefined; },
};

test('adapter API exposes health, assignments and queue stats', async () => {
  const manager = new AdapterManager(new ObjectRegistry());
  manager.register(adapter);
  await manager.startAll();

  const app = express();
  app.use('/adapters', createAdapterRouter(manager));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/adapters`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ready');
    assert.deepEqual(body.adapters.map((item: { id: string }) => item.id), ['demo']);
    assert.equal(body.adapters[0].protocol, 'mqtt');
    assert.equal(body.adapters[0].devices, 1);
    assert.equal(body.devices['mqtt-1'], 'demo');
    assert.equal(typeof body.queue.pending, 'number');
  } finally {
    await manager.stopAll();
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  }
});
