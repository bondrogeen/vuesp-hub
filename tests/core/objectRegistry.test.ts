import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ObjectRegistry, entityFromTile, toEntityId } from '@core/application/objectRegistry.ts';
import type { IResolvedDashboardItem } from 'vuesp-dashboard-core';

const tile = (overrides: Partial<IResolvedDashboardItem> = {}): IResolvedDashboardItem => ({
  id: 'device.temp',
  name: 'Temperature',
  type: 'info',
  entityType: 'sensor',
  args: ['device.temp'],
  get: 'a',
  value: 21.5,
  valueTo: '21.5 °C',
  ...overrides,
});

test('creates an entity from a resolved tile', () => {
  const entity = entityFromTile(tile(), { deviceId: 'uuid-1', online: true }, 100);
  assert.equal(entity.id, 'uuid-1/device.temp');
  assert.equal(toEntityId('uuid-1', 'device.temp'), 'uuid-1/device.temp');
  assert.equal(entity.get?.value, 21.5);
  assert.equal(entity.get?.display, '21.5 °C');
  assert.equal(entity.get?.status, 'live');
  assert.equal(entity.available, false);
});

test('registry syncs entities, preserves lastChanged and marks offline stale', () => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', legacyId: 7, name: 'BMS', ip: '192.0.2.1', online: true });
  registry.syncEntities('uuid-1', [entityFromTile(tile(), { deviceId: 'uuid-1', online: true }, 100)]);

  const first = registry.getEntity('uuid-1', 'device.temp');
  assert.equal(first?.get?.status, 'live');
  assert.equal(first?.get?.lastChanged, 100);

  registry.syncEntities('uuid-1', [entityFromTile(tile(), { deviceId: 'uuid-1', online: true }, 200)]);
  const same = registry.getEntity('uuid-1', 'device.temp');
  assert.equal(same?.get?.lastChanged, 100);

  registry.syncEntities('uuid-1', [entityFromTile(tile({ value: 22, valueTo: '22 °C' }), { deviceId: 'uuid-1', online: true }, 300)]);
  const changed = registry.getEntity('uuid-1', 'device.temp');
  assert.equal(changed?.get?.lastChanged, 300);

  registry.setOnline('uuid-1', false);
  const offline = registry.getEntity('uuid-1', 'device.temp');
  assert.equal(offline?.get?.status, 'stale');
  assert.equal(offline?.get?.value, 22);

  registry.setOnline('uuid-1', true);
  assert.equal(registry.getEntity('uuid-1', 'device.temp')?.get?.status, 'live');
});

test('registry exposes set channels and rejects duplicate entity keys', () => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'Lamp', ip: '192.0.2.2', online: true });
  const button = entityFromTile(
    tile({ id: 'device.power', type: 'button', entityType: 'switch', value: 1, set: '({ ...b, value: v })', opts: { disabled: 0 } }),
    { deviceId: 'uuid-1', online: true },
  );
  assert.equal(button.set?.kind, 'expression');
  assert.equal(button.set?.ack, 'state');
  assert.equal(button.available, true);

  registry.syncEntities('uuid-1', [button]);
  assert.equal(registry.listEntities('uuid-1').length, 1);
  assert.throws(() => registry.syncEntities('uuid-1', [button, button]), /Duplicate entity key/);

  const updated = registry.updateEntity('uuid-1', 'device.power', { name: 'Relay' });
  assert.equal(updated?.name, 'Relay');
  assert.equal(updated?.id, 'uuid-1/device.power');
});

test('registry notifies subscribers and isolates their errors', () => {
  const registry = new ObjectRegistry();
  const changes: string[] = [];
  registry.subscribe(() => {
    throw new Error('bad subscriber');
  });
  registry.subscribe(change => changes.push(change.type));

  registry.upsertDevice({ deviceId: 'uuid-1', name: 'Lamp', ip: '192.0.2.3' });
  assert.deepEqual(changes, ['device']);
});

test('upsertEntities merges dirty entities without dropping others', () => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'BMS', ip: '192.0.2.4', online: true });
  registry.syncEntities('uuid-1', [
    entityFromTile(tile({ id: 'a', value: 1, valueTo: '1' }), { deviceId: 'uuid-1', online: true }, 100),
    entityFromTile(tile({ id: 'b', value: 2, valueTo: '2' }), { deviceId: 'uuid-1', online: true }, 100),
  ]);

  registry.upsertEntities('uuid-1', [
    entityFromTile(tile({ id: 'b', value: 3, valueTo: '3' }), { deviceId: 'uuid-1', online: true }, 200),
  ]);

  assert.equal(registry.listEntities('uuid-1').length, 2);
  assert.equal(registry.getEntity('uuid-1', 'a')?.get?.value, 1);
  assert.equal(registry.getEntity('uuid-1', 'b')?.get?.value, 3);
});

test('changing the device IP keeps the same device and entity identity', () => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'BMS', ip: '192.0.2.10', online: true });
  registry.syncEntities('uuid-1', [entityFromTile(tile(), { deviceId: 'uuid-1', online: true })]);
  const before = registry.getEntity('uuid-1', 'device.temp')?.id;

  registry.upsertDevice({ deviceId: 'uuid-1', name: 'BMS', ip: '192.0.2.11', online: true });
  const device = registry.getDevice('uuid-1');
  assert.equal(device?.ip, '192.0.2.11');
  assert.equal(registry.getEntity('uuid-1', 'device.temp')?.id, before);
  assert.equal(registry.listEntities('uuid-1').length, 1);
});
