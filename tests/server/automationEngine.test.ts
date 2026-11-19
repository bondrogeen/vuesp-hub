import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ActionService, type IActionTarget } from '@core/application/actionService.ts';
import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { AutomationEngine } from '@server/modules/automations/application/automationEngine.ts';

const setup = () => {
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'Lamp', ip: '192.0.2.1', online: true });
  registry.syncEntities('uuid-1', [{
    id: 'uuid-1/device.power',
    deviceId: 'uuid-1',
    key: 'device.power',
    name: 'Power',
    type: 'button',
    entityType: 'switch',
    available: true,
    get: { value: 0, status: 'live', updatedAt: 1, lastChanged: 1 },
    set: { kind: 'expression', pending: false, status: 'idle', ack: 'none', queue: false },
  }]);
  const calls: unknown[] = [];
  const target: IActionTarget = {
    async execute(request) {
      calls.push(request);
      return { commands: [{ comm: 'DEVICE', ok: true }] };
    },
  };
  const actions = new ActionService({ registry, target });
  const rules = [{
    id: 1,
    name: 'Turn on',
    enabled: true,
    mode: 'single',
    trigger: { type: 'manual' },
    conditions: [{ type: 'compare', entityId: 'uuid-1/device.power', op: '==', value: 0 }],
    actions: [
      { type: 'set', deviceId: 'uuid-1', entityKey: 'device.power', value: 1 },
      { type: 'notify', level: 'info', text: 'Turned on' },
    ],
  }];
  const notifications: Array<Record<string, unknown>> = [];
  const engine = new AutomationEngine({
    registry,
    actions,
    rules: { getAll: async () => rules },
    scenes: { getAll: async () => [] },
    notifications: {
      create: async data => {
        notifications.push(data);
        return { ...data, id: notifications.length };
      },
    },
  });
  return { registry, calls, notifications, engine };
};

test('automation rules evaluate conditions and execute actions', async () => {
  const { calls, notifications, engine } = setup();
  await engine.start();
  const entry = await engine.runRule(1);
  assert.equal(entry.status, 'done');
  assert.equal(calls.length, 1);
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.text, 'Turned on');
  assert.equal(engine.getJournal().at(-1)?.status, 'done');
  await engine.stop();
});

test('dry-run reports matched conditions without actions', async () => {
  const { calls, engine } = setup();
  await engine.start();
  const result = await engine.dryRun(1);
  assert.equal(result.matched, true);
  assert.equal(calls.length, 0);
  await engine.stop();
});
