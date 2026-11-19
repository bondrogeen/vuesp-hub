import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import { ObjectRegistry, entityFromTile } from '@core/application/objectRegistry.ts';
import { createObjectRouter } from '@server/modules/objects/api/objectRoutes.ts';
import type { IResolvedDashboardItem } from 'vuesp-dashboard-core';

const startApi = async (registry: ObjectRegistry) => {
  const app = express();
  app.use('/api/v1/objects', createObjectRouter(registry));
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}/api/v1/objects`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

test('object API exposes normalized devices and entities', async () => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', legacyId: 7, name: 'BMS', ip: '192.0.2.1', online: true });
  const tile: IResolvedDashboardItem = {
    id: 'device.temp',
    name: 'Temperature',
    type: 'info',
    entityType: 'sensor',
    args: ['device.temp'],
    get: 'a',
    value: 21.5,
    valueTo: '21.5 °C',
  };
  registry.syncEntities('uuid-1', [entityFromTile(tile, { deviceId: 'uuid-1', online: true })]);

  const api = await startApi(registry);
  try {
    const list = await fetch(api.url);
    assert.equal(list.status, 200);
    const body = await list.json();
    assert.equal(body.devices.length, 1);
    assert.equal(body.devices[0].deviceId, 'uuid-1');
    assert.equal(body.devices[0].legacyId, 7);
    assert.equal(body.devices[0].entities[0].id, 'uuid-1/device.temp');
    assert.equal(body.devices[0].entities[0].get.value, 21.5);

    const entity = await fetch(`${api.url}/uuid-1/device.temp`);
    assert.equal(entity.status, 200);
    assert.equal((await entity.json()).entity.key, 'device.temp');

    const missing = await fetch(`${api.url}/uuid-1/missing`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: 'Entity not found' });
  } finally {
    await api.close();
  }
});
