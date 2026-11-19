import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ActionService, type IActionTarget } from '@core/application/actionService.ts';
import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { CloudBridge, type ICloudBridgeTransport } from '@server/modules/cloud/application/cloudBridge.ts';

const setup = (patchMs = 5) => {
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
  const target: IActionTarget = { async execute(request) { calls.push(request); return { commands: [{ comm: 'DEVICE', ok: true }] }; } };
  const actions = new ActionService({ registry, target });
  const sent: Array<Record<string, unknown>> = [];
  let handler: ((message: unknown) => void) | undefined;
  let closed = false;
  const transport: ICloudBridgeTransport = {
    async send(message) { sent.push(message); },
    onMessage(next) { handler = next; return () => { handler = undefined; }; },
    async close() { closed = true; },
  };
  const bridge = new CloudBridge({ hubId: 'hub-1', registry, actions, transport, patchMs });
  return { registry, actions, sent, bridge, emit: (message: unknown) => handler?.(message), isClosed: () => closed };
};

test('cloud bridge registers, publishes snapshot and patches', async () => {
  const { registry, sent, bridge } = setup();
  await bridge.start();
  assert.equal(sent[0]?.type, 'register');
  assert.equal(sent[1]?.type, 'snapshot');
  assert.equal(sent[1]?.hubId, 'hub-1');

  registry.updateEntity('uuid-1', 'device.power', { name: 'Relay' });
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.ok(sent.some(message => message.type === 'patch'));
  await bridge.stop();
});

test('cloud bridge executes commands, rejects expired ones and handles revoke', async () => {
  const { sent, bridge, emit, isClosed } = setup();
  await bridge.start();
  emit({ type: 'command', requestId: 'r1', deviceId: 'uuid-1', entityKey: 'device.power', value: 1 });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(sent.some(message => message.type === 'commandAck' && message.requestId === 'r1'));

  emit({ type: 'command', requestId: 'r2', deviceId: 'uuid-1', entityKey: 'device.power', value: 1, expiresAt: 1 });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(sent.some(message => message.type === 'commandAck' && message.requestId === 'r2' && message.status === 'failed'));

  emit({ type: 'revoke' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(isClosed(), true);
});
