import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ActionService, type IActionTarget } from '@core/application/actionService.ts';
import { ObjectRegistry, type IEntity } from '@core/application/objectRegistry.ts';

const DEVICES = 50;
const ENTITIES_PER_DEVICE = 20;

const buildEntity = (deviceId: string, index: number): IEntity => {
  const key = `sensor.${index}`;
  return {
    id: `${deviceId}/${key}`,
    deviceId,
    key,
    name: `Sensor ${index}`,
    type: 'info',
    entityType: 'sensor',
    available: true,
    get: { value: index, display: String(index), status: 'live', updatedAt: 1, lastChanged: 1 },
    set: { kind: 'expression', pending: false, status: 'idle', ack: 'none' as const, queue: false },
  } as IEntity;
};

test('registry keeps NFR budgets for 50 devices and 1000 entities', () => {
  const registry = new ObjectRegistry();
  const seedStarted = performance.now();
  for (let device = 0; device < DEVICES; device += 1) {
    const deviceId = `device-${device}`;
    registry.upsertDevice({ deviceId, name: `Device ${device}`, ip: `192.0.2.${device + 1}`, online: true });
    registry.syncEntities(deviceId, Array.from({ length: ENTITIES_PER_DEVICE }, (_, index) => buildEntity(deviceId, index)));
  }
  const seedMs = performance.now() - seedStarted;

  assert.equal(registry.listEntities().length, DEVICES * ENTITIES_PER_DEVICE);
  // Generous ceiling: CI machines are slower than the reference hub.
  assert.ok(seedMs < 2_000, `seeding took ${seedMs.toFixed(0)}ms`);

  const viewStarted = performance.now();
  const view = registry.snapshotView();
  const viewMs = performance.now() - viewStarted;
  assert.equal(view.devices.length, DEVICES);
  assert.ok(viewMs < 500, `snapshot view took ${viewMs.toFixed(0)}ms`);

  const stateStarted = performance.now();
  const snapshot = registry.snapshot();
  const json = JSON.stringify(snapshot);
  const stateMs = performance.now() - stateStarted;
  assert.ok(json.length < 50 * 1024 * 1024, `state snapshot is ${(json.length / 1024 / 1024).toFixed(1)}MB`);
  assert.ok(stateMs < 2_000, `snapshot serialization took ${stateMs.toFixed(0)}ms`);
});

test('registry applies 1000 updates inside the NFR delta budget', () => {
  const registry = new ObjectRegistry();
  for (let device = 0; device < DEVICES; device += 1) {
    const deviceId = `device-${device}`;
    registry.upsertDevice({ deviceId, name: `Device ${device}`, ip: `192.0.2.${device + 1}`, online: true });
    registry.syncEntities(deviceId, Array.from({ length: ENTITIES_PER_DEVICE }, (_, index) => buildEntity(deviceId, index)));
  }

  let notified = 0;
  const unsubscribe = registry.subscribe(() => { notified += 1; });
  const started = performance.now();
  for (let device = 0; device < DEVICES; device += 1) {
    const deviceId = `device-${device}`;
    for (let index = 0; index < ENTITIES_PER_DEVICE; index += 1) {
      registry.updateEntity(deviceId, `sensor.${index}`, { get: { value: index + 1, status: 'live', updatedAt: 2, lastChanged: 2 } });
    }
  }
  const elapsed = performance.now() - started;
  unsubscribe();

  assert.equal(notified, DEVICES * ENTITIES_PER_DEVICE);
  assert.ok(elapsed < 2_000, `1000 updates took ${elapsed.toFixed(0)}ms`);
});

test('action service scales to 1000 entities without a queue backlog', async () => {
  const registry = new ObjectRegistry();
  for (let device = 0; device < DEVICES; device += 1) {
    const deviceId = `device-${device}`;
    registry.upsertDevice({ deviceId, name: `Device ${device}`, ip: `192.0.2.${device + 1}`, online: true });
    registry.syncEntities(deviceId, Array.from({ length: ENTITIES_PER_DEVICE }, (_, index) => buildEntity(deviceId, index)));
  }
  let calls = 0;
  const target: IActionTarget = {
    async execute() {
      calls += 1;
      return { commands: [] };
    },
  };
  const actions = new ActionService({ registry, target });

  const started = performance.now();
  const results = await Promise.all(
    Array.from({ length: 100 }, (_, index) =>
      actions.execute({
        requestId: `load-${index}`,
        deviceId: `device-${index % DEVICES}`,
        entityKey: `sensor.${index % ENTITIES_PER_DEVICE}`,
        value: 1,
        source: 'ui',
      }),
    ),
  );
  const elapsed = performance.now() - started;

  assert.equal(calls, 100);
  assert.ok(results.every(result => result.status === 'accepted' || result.status === 'confirmed'));
  assert.ok(elapsed < 2_000, `100 actions took ${elapsed.toFixed(0)}ms`);
});
