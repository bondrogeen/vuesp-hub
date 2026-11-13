import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { WebSocketServer, type WebSocket } from 'ws';
import type { DashboardItem } from 'vuesp-dashboard-core';

import { createCloudService, type CloudRuntime } from '@server/modules/cloud/application/cloudService.ts';
import type { DeviceRecord } from '@root/shared/device.ts';

const records: DeviceRecord[] = [
  { id: 1, uuid: 'uuid-1', deviceId: 1, name: 'Lamp', ip: '192.0.2.5', firmware: [], addedAt: '' },
];

const button = (id: string): DashboardItem => ({
  id,
  name: id,
  type: 'button',
  args: ['device.output', 'device'],
  get: '(a & 1 ? 1 : 0)',
  getTo: "v ? 'ON' : 'OFF'",
  set: '({...b, output: v ? 1 : 0, command: 2 })',
});

class FakeRuntime extends EventEmitter {
  readonly sent: Array<{ target: string; comm: string; data?: Record<string, unknown> }> = [];

  constructor(private readonly list: DashboardItem[]) {
    super();
  }

  getList() {
    return [{ id: 1, ip: '192.0.2.5', name: 'Lamp', list: this.list }];
  }

  send(target: string, comm: string, data?: Record<string, unknown>): boolean {
    this.sent.push({ target, comm, data });
    return true;
  }

  sendAll(): boolean {
    return true;
  }
}

const waitFor = async <T>(fn: () => T | undefined, label: string, timeout = 8000): Promise<T> => {
  const started = Date.now();
  for (;;) {
    const value = fn();
    if (value !== undefined) return value;
    if (Date.now() - started > timeout) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
};

test('publishes safe resolved tiles and applies an action on the hub', async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  const snapshots: Array<Record<string, any>> = [];
  let socket: WebSocket | undefined;
  server.on('connection', (ws) => {
    socket = ws;
    ws.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as Record<string, any>;
      if (message.type === 'hello') ws.send(JSON.stringify({ type: 'hello_ack' }));
      if (message.type === 'snapshot') snapshots.push(message);
      if (message.type === 'heartbeat') ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
    });
  });

  const dataDirectory = mkdtempSync(path.join(tmpdir(), 'vuesp-cloud-'));
  const charge: DashboardItem = {
    ...button('device.status3'),
    name: 'Charge MOSFET',
    set: '({ ...b, output: 2, command: 2 })',
  };
  const discharge: DashboardItem = {
    ...button('device.status3'),
    name: 'Discharge MOSFET',
    set: '({ ...b, output: 4, command: 2 })',
  };
  const runtime = new FakeRuntime([
    ...Array.from({ length: 25 }, (_, index) => button(`device.output.${index}`)),
    charge,
    discharge,
  ]);
  const cloud = createCloudService({
    dataDirectory,
    secretProvider: {
      encrypt: (value) => Buffer.from(value).toString('base64'),
      decrypt: (value) => Buffer.from(value).toString('base64').toString(),
    },
    runtime: runtime as unknown as CloudRuntime,
    getDeviceModel: async () => ({ getAll: () => records }),
    bootstrap: { url: `http://127.0.0.1:${port}`, token: 'hub-token', hubName: 'Home' },
  });

  try {
    cloud.start();
    await waitFor(() => (cloud.status().connected ? true : undefined), 'cloud connection');
    await waitFor(() => socket, 'hub socket');

    runtime.emit('data', {
      event: 'message',
      id: 1,
      ip: '192.0.2.5',
      name: 'Lamp',
      key: 'DEVICE',
      data: { key: 6, output: 1, command: 0 },
    });

    const snapshot = await waitFor(() => snapshots[0], 'snapshot');
    const device = snapshot.devices[0] as Record<string, any>;
    assert.equal(device.deviceId, 'uuid-1');
    assert.equal('state' in device, false, 'raw device state must not leave the hub');
    assert.equal(device.tiles.length, 20, 'MVP cap keeps the cloud payload bounded');

    const first = device.tiles[0] as Record<string, unknown>;
    assert.equal(first.id, 'device.output.0');
    assert.equal(first.key, 'uuid-1:0');
    assert.equal(first.viewIcon, 'box');
    assert.equal(first.type, 'button');
    assert.equal(first.value, 1);
    assert.equal(first.valueTo, 'ON');
    for (const forbidden of ['args', 'get', 'getTo', 'set', 'meta']) {
      assert.equal(forbidden in first, false, `${forbidden} must never leave the hub`);
    }

    const allTiles = await cloud.listTiles();
    assert.equal(allTiles.devices[0].tiles.length, 27);
    assert.equal(allTiles.selected.length, 20);
    assert.equal(allTiles.selected[0], 'uuid-1:0');
    assert.equal(allTiles.max, 20);

    const results: Array<Record<string, unknown>> = [];
    socket?.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as Record<string, unknown>;
      if (message.type === 'action_result') results.push(message);
    });
    socket?.send(
      JSON.stringify({
        type: 'action',
        requestId: 'req-1',
        deviceId: 'uuid-1',
        tileId: 'device.output.0',
        value: 0,
      })
    );

    const result = await waitFor(() => results[0], 'action result');
    assert.equal(result.requestId, 'req-1');
    assert.equal(result.ok, true);
    assert.deepEqual(runtime.sent[0], { target: '192.0.2.5', comm: 'DEVICE', data: { output: 0, command: 2 } });
    assert.deepEqual(runtime.sent.slice(1).map((item) => item.comm), ['INFO', 'DEVICE', 'PORT']);

    // Two dashboard rows share `device.status3`; the unique key must pick the second one.
    runtime.sent.length = 0;
    socket?.send(
      JSON.stringify({
        type: 'action',
        requestId: 'req-2',
        deviceId: 'uuid-1',
        tileId: 'device.status3',
        tileKey: 'uuid-1:26',
        value: 1,
      })
    );

    const duplicateResult = await waitFor(() => results[1], 'duplicate action result');
    assert.equal(duplicateResult.ok, true);
    assert.deepEqual(runtime.sent[0], { target: '192.0.2.5', comm: 'DEVICE', data: { output: 4, command: 2 } });
    assert.deepEqual(runtime.sent.slice(1).map((item) => item.comm), ['INFO', 'DEVICE', 'PORT']);

    const status = await cloud.setPublishedTiles(['uuid-1:1', 'uuid-1:3']);
    assert.equal(status.state, 'connected');

    const selectionSnapshot = await waitFor(
      () =>
        snapshots.find(
          snapshot => (snapshot.devices[0] as Record<string, any> | undefined)?.tiles?.length === 2
        ),
      'selection snapshot'
    );
    const selectedKeys = (selectionSnapshot.devices[0] as Record<string, any>).tiles.map(
      (tile: Record<string, unknown>) => tile.key
    );
    assert.deepEqual(selectedKeys, ['uuid-1:1', 'uuid-1:3']);
    assert.deepEqual((await cloud.listTiles()).selected, ['uuid-1:1', 'uuid-1:3']);
  } finally {
    socket?.close();
    await cloud.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
