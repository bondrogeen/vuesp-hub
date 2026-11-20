import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { AdapterManager } from '@server/modules/adapters/application/adapterManager.ts';
import type { IDeviceAdapter } from '@core/application/deviceAdapter.ts';
import { MqttAdapter, type IMqttTransport } from '@server/modules/adapters/application/mqttAdapter.ts';
import { ModbusAdapter, type IModbusTransport } from '@server/modules/adapters/application/modbusAdapter.ts';

class FakeMqtt implements IMqttTransport {
  handler: ((topic: string, payload: string) => void) | undefined;
  published: Array<{ topic: string; payload: string }> = [];
  connected = false;

  async connect() { this.connected = true; }
  async subscribe() {}
  async publish(topic: string, payload: string) { this.published.push({ topic, payload }); }
  onMessage(handler: (topic: string, payload: string) => void) { this.handler = handler; return () => { this.handler = undefined; }; }
  async close() { this.connected = false; }
}

class FakeModbus implements IModbusTransport {
  written: Array<{ unit: number; address: number; values: number[] }> = [];
  async read() { return [42]; }
  async write(unit: number, address: number, values: number[]) { this.written.push({ unit, address, values }); }
}

test('MQTT adapter normalizes state and publishes commands', async () => {
  const transport = new FakeMqtt();
  const adapter = new MqttAdapter(transport, {
    devices: [{
      deviceId: 'mqtt-1',
      name: 'MQTT sensor',
      stateTopic: 'home/sensor',
      commandTopic: 'home/sensor/set',
      entities: [{ key: 'temp', name: 'Temperature', type: 'info', entityType: 'sensor', statePath: 'temp' }],
    }],
  });
  const registry = new ObjectRegistry();
  const manager = new AdapterManager(registry);
  manager.register(adapter);
  await manager.startAll();
  transport.handler?.('home/sensor', JSON.stringify({ temp: 21.5 }));
  await new Promise(resolve => setTimeout(resolve, 0));

  const entity = registry.getEntity('mqtt-1', 'temp');
  assert.equal(entity?.get?.value, 21.5);
  assert.equal(entity?.get?.status, 'live');
  assert.equal(await manager.execute('mqtt-1', 'temp', 22, 'r1').then(result => result.ok), true);
  assert.deepEqual(JSON.parse(transport.published[0]!.payload), { entity: 'temp', value: 22 });
  await manager.stopAll();
});

test('Modbus adapter polls scaled registers and writes them back', async () => {
  const transport = new FakeModbus();
  const adapter = new ModbusAdapter(transport, {
    pollIntervalMs: 60_000,
    devices: [{
      deviceId: 'modbus-1',
      name: 'Modbus sensor',
      unit: 1,
      registers: [{ key: 'temp', name: 'Temperature', type: 'info', entityType: 'sensor', address: 10, scale: 0.1 }],
    }],
  });
  const registry = new ObjectRegistry();
  const manager = new AdapterManager(registry);
  manager.register(adapter);
  await manager.startAll();
  assert.equal(registry.getEntity('modbus-1', 'temp')?.get?.value, 4.2);
  assert.equal(await manager.execute('modbus-1', 'temp', 5, 'r2').then(result => result.ok), true);
  assert.deepEqual(transport.written[0], { unit: 1, address: 10, values: [50] });
  await manager.stopAll();
});

class QueuedAdapter implements IDeviceAdapter {
  readonly id = 'queued';
  readonly protocol = 'test';
  readonly mode = 'push' as const;
  calls: string[] = [];
  active = 0;
  maxActive = 0;
  hang = false;

  async start() {}
  async stop() {}
  async health() { return { status: 'ready' as const, updatedAt: Date.now() }; }
  async listDevices() {
    return [{
      deviceId: 'queue-device',
      name: 'Queued device',
      protocol: 'test',
      online: true,
      entities: [{ key: 'power', name: 'Power', type: 'button', value: 0 }],
    }];
  }
  async execute(command: { requestId: string }) {
    this.calls.push(command.requestId);
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);
    try {
      if (this.hang) return await new Promise<never>(() => undefined);
      await new Promise(resolve => setTimeout(resolve, 15));
      return { ok: true };
    } finally {
      this.active -= 1;
    }
  }
  onEvent() { return () => undefined; }
}

test('adapter queue serializes commands and rejects overflow', async () => {
  const adapter = new QueuedAdapter();
  const manager = new AdapterManager(new ObjectRegistry(), { queueLimit: 1, executeTimeoutMs: 200 });
  manager.register(adapter);
  await manager.startAll();

  const first = manager.execute('queue-device', 'power', 1, 'r1');
  const second = manager.execute('queue-device', 'power', 1, 'r2');
  const third = await manager.execute('queue-device', 'power', 1, 'r3');
  assert.equal(third.ok, false);
  assert.match(third.error ?? '', /queue is full/i);

  const results = await Promise.all([first, second]);
  assert.deepEqual(results.map(result => result.ok), [true, true]);
  assert.equal(adapter.maxActive, 1);
  assert.deepEqual(adapter.calls, ['r1', 'r2']);

  const stats = manager.queueStats();
  assert.equal(stats.completed, 2);
  assert.equal(stats.rejected, 1);
  assert.equal(stats.pending, 0);
  assert.equal(stats.inFlight, 0);
  await manager.stopAll();
});

test('adapter commands time out instead of hanging the queue', async () => {
  const adapter = new QueuedAdapter();
  adapter.hang = true;
  const manager = new AdapterManager(new ObjectRegistry(), { queueLimit: 4, executeTimeoutMs: 20 });
  manager.register(adapter);
  await manager.startAll();

  const result = await manager.execute('queue-device', 'power', 1, 'slow');
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /timed out/);
  assert.equal(manager.queueStats().timedOut, 1);
  await manager.stopAll();
});
