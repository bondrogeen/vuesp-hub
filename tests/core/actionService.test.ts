import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ActionService, type IActionTarget } from '@core/application/actionService.ts';
import { ObjectRegistry, type IEntity } from '@core/application/objectRegistry.ts';

const entity = (overrides: Partial<IEntity> = {}): IEntity => ({
  id: 'uuid-1/device.power',
  deviceId: 'uuid-1',
  key: 'device.power',
  name: 'Power',
  type: 'button',
  entityType: 'switch',
  available: true,
  get: { value: 0, display: 'OFF', status: 'live', updatedAt: 1, lastChanged: 1 },
  set: { kind: 'expression', pending: false, status: 'idle', ack: 'state', queue: false },
  ...overrides,
});

const setup = (overrides: Partial<IEntity> = {}, online = true) => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'Lamp', ip: '192.0.2.1', online });
  registry.syncEntities('uuid-1', [entity(overrides)]);
  const calls: unknown[] = [];
  const target: IActionTarget = {
    async execute(request) {
      calls.push(request);
      return { commands: [{ comm: 'DEVICE', ok: true }] };
    },
  };
  return { registry, calls, target };
};

test('executes a command and confirms it when the entity changes', async () => {
  const { registry, calls } = setup();
  const target: IActionTarget = {
    async execute(request) {
      calls.push(request);
      registry.updateEntity('uuid-1', 'device.power', { get: { ...entity().get!, value: 1 } });
      return { commands: [{ comm: 'DEVICE', ok: true }] };
    },
  };
  const actions = new ActionService({ registry, target, timeoutMs: 200 });
  const result = await actions.execute({ requestId: 'r1', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  assert.equal(result.status, 'confirmed');
  assert.equal(calls.length, 1);
  assert.equal(registry.getEntity('uuid-1', 'device.power')?.set?.pending, false);
});

test('returns accepted for ack none and rejects offline read-only', async () => {
  const offline = setup({ set: { kind: 'expression', pending: false, status: 'idle', ack: 'none', queue: false } }, false);
  const actions = new ActionService({ registry: offline.registry, target: offline.target });
  const result = await actions.execute({ requestId: 'r2', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  assert.equal(result.status, 'failed');
  assert.equal(result.error?.code, 'offline');

  const online = setup({ set: { kind: 'expression', pending: false, status: 'idle', ack: 'none', queue: false } });
  const service = new ActionService({ registry: online.registry, target: online.target });
  const accepted = await service.execute({ requestId: 'r3', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  assert.equal(accepted.status, 'accepted');
});

test('times out when the device does not confirm', async () => {
  const { registry, target } = setup();
  const actions = new ActionService({ registry, target, timeoutMs: 20 });
  const result = await actions.execute({ requestId: 'r4', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  assert.equal(result.status, 'timeout');
  assert.equal(registry.getEntity('uuid-1', 'device.power')?.set?.status, 'error');
});

test('deduplicates request ids and enforces rate limits', async () => {
  const { registry, calls, target } = setup({ set: { kind: 'expression', pending: false, status: 'idle', ack: 'none', queue: false } });
  const actions = new ActionService({ registry, target, rateLimit: 2 });
  const first = await actions.execute({ requestId: 'same', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  const second = await actions.execute({ requestId: 'same', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  assert.equal(first.requestId, second.requestId);
  assert.equal(calls.length, 1);

  await actions.execute({ requestId: 'rate-2', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  const limited = await actions.execute({ requestId: 'rate-3', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, source: 'ui' });
  assert.equal(limited.error?.code, 'rate_limited');
});
