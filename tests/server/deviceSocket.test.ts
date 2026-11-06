import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import type { Server as SocketIOServer } from 'socket.io';

import { DeviceRuntime, type DeviceConnectionManager } from '../../core/application/deviceRuntime.ts';
import { socketDevice } from '../../server/modules/devices/sockets/device.ts';

class FakeDeviceManager extends EventEmitter implements DeviceConnectionManager {
  readonly sent: Array<{ target?: string; command: string; data?: Record<string, unknown> }> = [];

  connection(): void {}
  disconnection(): void {}
  getMenu(): unknown[] {
    return [];
  }
  getList(): unknown[] {
    return [];
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
