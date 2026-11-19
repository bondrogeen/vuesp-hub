import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { afterEach, test } from 'node:test';
import type WebSocket from 'ws';
import VuespStruct from 'vuesp-struct';

import Device from '@server/modules/devices/application/vuespDevice.ts';
import type { IDeviceEventPayload } from '@root/shared/device.ts';

const devices: Device[] = [];

class FakeWebSocket extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  address: string;
  options: WebSocket.ClientOptions | undefined;
  readyState: number;
  binaryType = 'arraybuffer';
  sent: WebSocket.RawData[] = [];

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

  send(data: WebSocket.RawData) {
    this.sent.push(data);
  }
}

const delay = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

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
  const reconnectEvents: number[] = [];
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

test('device transport encodes INFO and forwards declared device state without interpreting it', async () => {
  const definition = {
    enums: { KEY: { INFO: 0, CUSTOM: 1 } },
    structs: {
      Info: [
        { name: 'key', type: 'uint8_t' },
        { name: 'id', type: 'uint32_t' },
        { name: 'firmware', type: 'uint8_t', dimensions: [3] },
      ],
      Custom: [
        { name: 'key', type: 'uint8_t' },
        { name: 'value', type: 'uint16_t' },
      ],
    },
  };
  const device = new Device(
    { ip: '192.0.2.12', reconnectDelay: 10, maxReconnectDelay: 20 },
    {
      WebSocketClass: FakeWebSocket,
      fetchClient: {
        get: async ({ url }) => {
          if (url.endsWith('/protocol.json')) return { data: definition };
          if (url.endsWith('/menu.json')) return { data: [] };
          return { data: [] };
        },
      },
    },
  );
  devices.push(device);
  const events: IDeviceEventPayload[] = [];
  device.on('*', payload => {
    if (payload.event === 'message') events.push(payload);
  });

  device.connect();
  const socket = FakeWebSocket.instances[0];
  socket.emit('open', {});
  await delay(5);

  assert.equal(socket.sent.length, 1);
  assert.ok(socket.sent[0] instanceof ArrayBuffer);
  // Запрос — только ключ: полная структура означала бы запись в устройство.
  assert.deepEqual([...(new Uint8Array(socket.sent[0] as ArrayBuffer))], [0]);

  const encoder = new VuespStruct();
  encoder.init(definition);
  const stateFrame = encoder.set('CUSTOM', { value: 271 });
  assert.ok(stateFrame);
  socket.emit('message', stateFrame);
  assert.equal(events.length, 1);
  assert.equal(events[0].key, 'CUSTOM');
  assert.deepEqual(events[0].data, { key: 1, value: 271 });
});

test('device transport retries after a socket error and ignores later events from the stale socket', async () => {
  const definition = {
    enums: { KEY: { INFO: 0, CUSTOM: 1 } },
    structs: {
      Info: [
        { name: 'key', type: 'uint8_t' },
        { name: 'id', type: 'uint32_t' },
      ],
      Custom: [
        { name: 'key', type: 'uint8_t' },
        { name: 'value', type: 'uint16_t' },
      ],
    },
  };
  let fetchCalls = 0;
  const device = new Device(
    { ip: '192.0.2.13', reconnectDelay: 10, maxReconnectDelay: 20 },
    {
      WebSocketClass: FakeWebSocket,
      fetchClient: {
        get: async ({ url }) => {
          fetchCalls += 1;
          if (url.endsWith('/protocol.json')) return { data: definition };
          if (url.endsWith('/menu.json')) return { data: [] };
          return { data: [] };
        },
      },
    },
  );
  devices.push(device);
  const messages: IDeviceEventPayload[] = [];
  const reconnects: number[] = [];
  device.on('*', payload => {
    if (payload.event === 'message') messages.push(payload);
    if (payload.event === 'reconnect') reconnects.push(payload.delay);
  });

  device.connect();
  const staleSocket = FakeWebSocket.instances[0];
  const originalError = console.error;
  console.error = () => {};
  try {
    staleSocket.emit('error', new Error('socket dropped'));
  } finally {
    console.error = originalError;
  }
  assert.deepEqual(reconnects, [10]);
  await delay(15);
  assert.equal(FakeWebSocket.instances.length, 2);

  const currentSocket = FakeWebSocket.instances[1];
  staleSocket.emit('open', {});
  staleSocket.emit('message', new ArrayBuffer(4));
  assert.equal(fetchCalls, 0);
  assert.equal(messages.length, 0);

  currentSocket.emit('open', {});
  await delay(5);
  assert.equal(fetchCalls, 3);

  const encoder = new VuespStruct();
  encoder.init(definition);
  const currentFrame = encoder.set('CUSTOM', { value: 73 });
  assert.ok(currentFrame);
  currentSocket.emit('message', currentFrame);
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].data, { key: 1, value: 73 });
});

test('device transport does not send INFO when the device protocol definition is malformed', async () => {
  const device = new Device(
    { ip: '192.0.2.14', reconnectDelay: 10, maxReconnectDelay: 20 },
    {
      WebSocketClass: FakeWebSocket,
      fetchClient: {
        get: async ({ url }) => {
          if (url.endsWith('/protocol.json')) {
            return { data: { enums: { KEY: { INFO: 0 } }, structs: { Info: [{ name: 'key' }] } } };
          }
          if (url.endsWith('/menu.json')) return { data: [] };
          return { data: [] };
        },
      },
    },
  );
  devices.push(device);
  const errors: unknown[] = [];
  device.on('error', () => {});
  device.on('*', payload => {
    if (payload.event === 'error') errors.push(payload.error);
  });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    device.connect();
    FakeWebSocket.instances[0].emit('open', {});
    await delay(5);
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(FakeWebSocket.instances[0].sent.length, 0);
  assert.equal(errors.length, 1);
  assert.match(String(errors[0]), /Device protocol struct Info is invalid/);
});

test('loads the device dashboard into tile list and tags events with ip and name', async () => {
  const definition = {
    enums: { KEY: { INFO: 0 } },
    structs: {
      Info: [
        { name: 'key', type: 'uint8_t' },
        { name: 'id', type: 'uint32_t' },
        { name: 'firmware', type: 'uint8_t', dimensions: [3] },
      ],
    },
  };
  const dashboard = [
    {
      id: 'device.output.1',
      name: 'output.1',
      type: 'button',
      icon: 'bulb',
      args: ['device.output', 'device'],
      get: '(a & 1 ? 0 : 1)',
      set: '({...b, output: v, command: 2 })',
    },
  ];
  const device = new Device(
    { ip: '192.0.2.30', name: 'lamp', reconnectDelay: 10, maxReconnectDelay: 20 },
    {
      WebSocketClass: FakeWebSocket,
      fetchClient: {
        get: async ({ url }) => {
          if (url.endsWith('/protocol.json')) return { data: definition };
          if (url.includes('/fs?file=/tmp/dashboard.json')) throw new Error('not found');
          if (url.endsWith('/default.json')) return { data: { dashboard, menu: [] } };
          if (url.endsWith('/menu.json')) return { data: [] };
          return { data: [] };
        },
      },
    },
  );
  devices.push(device);
  const events: IDeviceEventPayload[] = [];
  device.on('*', payload => events.push(payload));

  device.connect();
  FakeWebSocket.instances[0].emit('open', {});
  await delay(10);

  assert.equal(device.list.length, 1);
  assert.equal((device.list[0] as { id: string }).id, 'device.output.1');

  const init = events.find(payload => payload.event === 'init');
  assert.equal(init?.ip, '192.0.2.30');
  assert.equal(init?.name, 'lamp');
});

test('device identity keeps the registry uuid separate from the numeric device id', () => {
  const device = new Device(
    { ip: '192.0.2.13', uuid: 'uuid-13', reconnectDelay: 10, maxReconnectDelay: 20 },
    { WebSocketClass: FakeWebSocket },
  );
  devices.push(device);

  assert.equal(device.uuid, 'uuid-13');
  assert.equal(device.getInfo().uuid, 'uuid-13');
  assert.equal(device.id, -1);
  assert.equal(device.getStatus().uuid, 'uuid-13');
});

test('uses the registry id before INFO and opens without waiting for device files', async () => {
  const device = new Device(
    { ip: '192.0.2.44', deviceId: 777, reconnectDelay: 10, maxReconnectDelay: 20 },
    {
      WebSocketClass: FakeWebSocket,
      // A device that never answers /protocol.json must still be reachable.
      fetchClient: { get: () => new Promise(() => undefined) },
    },
  );
  devices.push(device);
  const events: string[] = [];
  device.on('*', payload => events.push(payload.event));

  assert.equal(device.id, 777);
  device.connect();
  FakeWebSocket.instances[0].emit('open', {});
  await delay(5);

  assert.ok(events.includes('open'));
  assert.equal(device.id, 777);
});
