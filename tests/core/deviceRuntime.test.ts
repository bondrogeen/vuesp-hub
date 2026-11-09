import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';

import { DeviceRuntime, type DeviceConnectionManager } from '@core/application/deviceRuntime.ts';

class FakeDeviceManager extends EventEmitter implements DeviceConnectionManager {
  connected = false;
  disconnected = false;

  async connection(): Promise<void> {
    this.connected = true;
  }

  disconnection(): void {
    this.disconnected = true;
  }

  getMenu(): unknown[] {
    return [];
  }

  getList(): unknown[] {
    return [];
  }

  onSend(): boolean {
    return true;
  }

  onSendAll(): boolean {
    return true;
  }
}

test('owns connection lifecycle and forwards device events independently of sockets', async () => {
  const manager = new FakeDeviceManager();
  const runtime = new DeviceRuntime({
    loadDevices: async () => [{ ip: '192.0.2.1' }],
    createConnections: () => manager,
  });
  const dataEvents: unknown[] = [];
  const statusEvents: boolean[] = [];
  runtime.on('data', payload => dataEvents.push(payload));
  runtime.on('status', running => statusEvents.push(running));

  assert.equal(await runtime.start(), true);
  assert.equal(runtime.isRunning, true);
  assert.equal(await runtime.start(), false);
  manager.emit('*', { event: 'message' });
  assert.deepEqual(dataEvents, [{ event: 'message' }]);
  assert.deepEqual(runtime.getMenu(), []);
  assert.equal(runtime.send('192.0.2.1', 'INFO', {}), true);

  manager.emit('*', { event: 'message', id: 123, key: 'INFO', data: { id: 123 } });
  assert.deepEqual(runtime.getSnapshot(), [
    { event: 'message', id: 123, key: 'INFO', data: { id: 123 } },
  ]);
  manager.emit('*', { event: 'raw', id: 123, key: 'INFO', data: 'binary' });
  assert.equal(runtime.getSnapshot().length, 1);

  assert.equal(await runtime.stop(), true);
  assert.equal(runtime.isRunning, false);
  assert.equal(manager.disconnected, true);
  assert.deepEqual(statusEvents, [true, false]);
  assert.equal(await runtime.stop(), false);
});

test('coalesces concurrent starts', async () => {
  let releaseLoad!: (devices: string[]) => void;
  let connectionCount = 0;
  const runtime = new DeviceRuntime<string>({
    loadDevices: () => new Promise(resolve => {
      releaseLoad = resolve;
    }),
    createConnections: () => {
      connectionCount += 1;
      return new FakeDeviceManager();
    },
  });

  const firstStart = runtime.start();
  const secondStart = runtime.start();
  releaseLoad(['device']);
  assert.deepEqual(await Promise.all([firstStart, secondStart]), [true, true]);
  assert.equal(connectionCount, 1);
});

test('disconnects and detaches a manager when startup fails', async () => {
  const manager = new FakeDeviceManager();
  manager.connection = async () => {
    throw new Error('connection failed');
  };
  const runtime = new DeviceRuntime({
    loadDevices: async () => [],
    createConnections: () => manager,
  });

  await assert.rejects(runtime.start(), /connection failed/);
  assert.equal(runtime.isRunning, false);
  assert.equal(manager.disconnected, true);
  assert.equal(manager.listenerCount('*'), 0);
});
