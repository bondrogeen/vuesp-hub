import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { AdapterManager } from '@server/modules/adapters/application/adapterManager.ts';
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
