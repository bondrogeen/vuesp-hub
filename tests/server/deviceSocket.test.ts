import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import type { Server as SocketIOServer } from 'socket.io';

import { DeviceRuntime, type DeviceConnectionManager } from '../../core/application/deviceRuntime.ts';
import { socketDevice } from '../../server/sockets/device.ts';

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

test('validates socket command requests before dispatching to devices', async () => {
  const manager = new FakeDeviceManager();
  const runtime = new DeviceRuntime({
    loadDevices: async () => [],
    createConnections: () => manager,
  });
  await runtime.start();

  const io = new EventEmitter() as unknown as SocketIOServer;
  const detach = socketDevice(io, runtime);
  const socket = new EventEmitter();
  const receivedEvents: Array<{ event: string; id: number; key: string }> = [];
  socket.on('device:data', payload => receivedEvents.push(payload));
  manager.emit('*', { event: 'message', id: 22, key: 'INFO', data: { id: 22 } });
  (io as unknown as EventEmitter).emit('connection', socket);
  assert.deepEqual(receivedEvents, [{ event: 'message', id: 22, key: 'INFO', data: { id: 22 } }]);

  let response: { status: string; message?: string } | undefined;
  socket.emit('device:send', { comm: 'INFO' }, (value) => {
    response = value;
  });
  assert.equal(response?.status, 'failed');
  assert.equal(manager.sent.length, 0);

  socket.emit('device:send', { ip: '192.0.2.50', comm: 'PORT', data: { command: 2 } }, (value) => {
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

  socket.emit('device:sendAll', { comm: 'INFO', data: [] }, (value) => {
    response = value;
  });
  assert.equal(response?.status, 'failed');
  assert.equal(manager.sent.length, 1);

  detach();
  await runtime.stop();
});
