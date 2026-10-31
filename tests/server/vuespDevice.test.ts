import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { afterEach, test } from 'node:test';
import type WebSocket from 'ws';

import Device from '../../server/devices/vuespDevice.ts';

const devices = [];

class FakeWebSocket extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  address: string;
  options: WebSocket.ClientOptions | undefined;
  readyState: number;
  binaryType: string;

  constructor(address: string, options?: WebSocket.ClientOptions) {
    super();
    this.address = address;
    this.options = options;
    this.readyState = FakeWebSocket.CONNECTING;
    FakeWebSocket.instances.push(this);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close', 1000, Buffer.alloc(0));
  }

  terminate() {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close', 1006, Buffer.alloc(0));
  }

  send() {}
}

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

afterEach(() => {
  for (const device of devices.splice(0)) device.disconnect();
  FakeWebSocket.instances = [];
});

test('connect is idempotent and retries a closed connection with backoff', async () => {
  const device = new Device(
    { ip: '192.0.2.10', reconnectDelay: 10, maxReconnectDelay: 20 },
    { WebSocketClass: FakeWebSocket },
  );
  devices.push(device);
  const reconnectEvents = [];
  device.on('*', payload => {
    if (payload.event === 'reconnect') reconnectEvents.push(payload.delay);
  });

  assert.equal(device.connect(), true);
  assert.equal(device.connect(), true);
  assert.equal(FakeWebSocket.instances.length, 1);

  FakeWebSocket.instances[0].emit('close', 1006, Buffer.alloc(0));
  assert.deepEqual(reconnectEvents, [10]);
  await delay(15);
  assert.equal(FakeWebSocket.instances.length, 2);

  FakeWebSocket.instances[1].emit('close', 1006, Buffer.alloc(0));
  assert.deepEqual(reconnectEvents, [10, 20]);
  await delay(25);
  assert.equal(FakeWebSocket.instances.length, 3);
});

test('disconnect cancels pending retries and is safe before a connection exists', async () => {
  const device = new Device(
    { ip: '192.0.2.11', reconnectDelay: 10, maxReconnectDelay: 20 },
    { WebSocketClass: FakeWebSocket },
  );
  devices.push(device);

  assert.equal(device.disconnect(), true);
  device.connect();
  FakeWebSocket.instances[0].emit('close', 1006, Buffer.alloc(0));
  assert.equal(device.disconnect(), true);

  await delay(25);
  assert.equal(FakeWebSocket.instances.length, 1);
});
