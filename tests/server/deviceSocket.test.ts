import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import type { Server as SocketIOServer } from 'socket.io';

import { DeviceRuntime, type IDeviceConnectionManager } from '@core/application/deviceRuntime.ts';
import { socketDevice } from '@server/modules/devices/sockets/device.ts';

class FakeDeviceManager extends EventEmitter implements IDeviceConnectionManager {
  readonly sent: Array<{ target?: string; command: string; data?: Record<string, unknown> }> = [];

  connection(): void {}
  disconnection(): void {}
  getMenu(): unknown[] {
    return [];
  }
  getList(): unknown[] {
    return [];
  }

  getEnums(_target: string): Record<string, Record<string, number>> | null {
    return null;
  }

  getState(_target: string): Record<string, unknown> | null {
    return null;
  }

  onSend(target: string, command: string, data?: Record<string, unknown>): boolean {
    this.sent.push({ target, command, data });
    return true;
  }

  onSendAll(command: string, data?: Record<string, unknown>): boolean {
    this.sent.push({ command, data });
    return true;
  }
}

class FakeSocketIO extends EventEmitter {
  readonly sockets: EventEmitter[] = [];

  emit(event: string, ...args: unknown[]): boolean {
    if (event === 'connection') this.sockets.push(args[0] as EventEmitter);
    const handled = super.emit(event, ...args);
    if (event !== 'connection') {
      for (const socket of this.sockets) socket.emit(event, ...args);
    }
    return handled;
  }
}

test('validates socket command requests before dispatching to devices', async () => {
  const manager = new FakeDeviceManager();
  const runtime = new DeviceRuntime({
    loadDevices: async () => [],
    createConnections: () => manager,
  });
  await runtime.start();

  const io = new FakeSocketIO();
  const detach = socketDevice(io as unknown as SocketIOServer, runtime);
  const socket = new EventEmitter();
  const receivedEvents: Array<{ event: string; id: number; key: string }> = [];
  const statusEvents: unknown[] = [];
  socket.on('device:data', payload => receivedEvents.push(payload));
  socket.on('service:status', payload => statusEvents.push(payload));
  manager.emit('*', { event: 'message', id: 22, key: 'INFO', data: { id: 22 } });
  io.emit('connection', socket);
  assert.deepEqual(statusEvents, [{ running: true }]);
  assert.deepEqual(receivedEvents, [{ event: 'message', id: 22, key: 'INFO', data: { id: 22 } }]);

  let response: { status: string; message?: string } | undefined;
  socket.emit('device:send', { comm: 'INFO' }, (value: { status: string; message?: string }) => {
    response = value;
  });
  assert.equal(response?.status, 'failed');
  assert.equal(manager.sent.length, 0);

  socket.emit('device:send', { ip: '192.0.2.50', comm: 'PORT', data: { command: 2 } }, (value: { status: string; message?: string }) => {
    response = value;
  });
  assert.equal(response?.status, 'success');
  assert.deepEqual(manager.sent, [
    {
      target: '192.0.2.50',
      command: 'PORT',
      data: { command: 2 },
    },
  ]);

  socket.emit('device:sendAll', { comm: 'INFO', data: [] }, (value: { status: string; message?: string }) => {
    response = value;
  });
  assert.equal(response?.status, 'failed');
  assert.equal(manager.sent.length, 1);

  await runtime.stop();
  assert.deepEqual(statusEvents, [{ running: true }, { running: false }]);

  detach();
});

test('reports the current stopped service status to a new socket', () => {
  const runtime = new DeviceRuntime({
    loadDevices: async () => [],
    createConnections: () => new FakeDeviceManager(),
  });

  const io = new FakeSocketIO();
  const detach = socketDevice(io as unknown as SocketIOServer, runtime);
  const socket = new EventEmitter();
  const statusEvents: unknown[] = [];
  socket.on('service:status', payload => statusEvents.push(payload));

  io.emit('connection', socket);

  assert.deepEqual(statusEvents, [{ running: false }]);
  detach();
});

test('pushes object snapshots and entity deltas to a new socket', async () => {
  const manager = new FakeDeviceManager();
  const runtime = new DeviceRuntime({
    loadDevices: async () => [],
    createConnections: () => manager,
  });
  await runtime.start();

  const { ObjectRegistry } = await import('@core/application/objectRegistry.ts');
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'BMS', ip: '192.0.2.7', online: true });
  registry.syncEntities('uuid-1', [{
    id: 'uuid-1/device.temp',
    deviceId: 'uuid-1',
    key: 'device.temp',
    name: 'Temperature',
    type: 'info',
    entityType: 'sensor',
    available: false,
    get: { value: 21, display: '21 °C', status: 'live', updatedAt: 1, lastChanged: 1 },
  }]);

  const io = new FakeSocketIO();
  const detach = socketDevice(io as unknown as SocketIOServer, runtime, registry);
  const socket = new EventEmitter();
  const snapshots: unknown[] = [];
  const deltas: unknown[] = [];
  socket.on('objects:snapshot', payload => snapshots.push(payload));
  socket.on('objects:entity', payload => deltas.push(payload));

  io.emit('connection', socket);
  assert.equal((snapshots[0] as { devices: unknown[] }).devices.length, 1);

  registry.updateEntity('uuid-1', 'device.temp', { name: 'Temp' });
  assert.equal(deltas.length, 1);
  assert.equal((deltas[0] as { entity: { name: string } }).entity.name, 'Temp');

  detach();
  await runtime.stop();
});
