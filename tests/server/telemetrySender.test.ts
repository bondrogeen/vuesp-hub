import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { TelemetrySender, readOrCreateHubId } from '../../server/modules/telemetry/application/telemetrySender.ts';
import type { DeviceRecord } from '../../shared/device.ts';

const records: DeviceRecord[] = [
  { id: 1, uuid: 'uuid-1', deviceId: 1, name: 'Lamp', ip: '192.0.2.5', firmware: [], addedAt: '' },
];

const createSender = (options: { fetchImpl?: typeof fetch; timeSync?: () => Promise<boolean | null>; now?: () => number } = {}) => {
  const runtime = new EventEmitter();
  const dataDirectory = mkdtempSync(path.join(tmpdir(), 'vuesp-telemetry-'));
  const calls: Array<{ url: string; init: RequestInit }> = [];

  const fetchImpl =
    options.fetchImpl ??
    ((async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response('{}', { status: 200 });
    }) as typeof fetch);

  const sender = new TelemetrySender({
    runtime,
    getDeviceModel: async () => ({ getAll: () => records }),
    dataDirectory,
    url: 'http://cloud.test/api/',
    token: 'secret',
    hubName: 'Home',
    fetchImpl,
    now: options.now ?? (() => 1_700_000_000_000),
    timeSyncCheck: options.timeSync ?? (async () => true),
  });

  return { sender, runtime, dataDirectory, calls };
};

const emitMessage = (runtime: EventEmitter, key: string, data: unknown, ip = '192.0.2.5') => {
  runtime.emit('data', { event: 'message', id: 1, ip, name: 'Lamp', key, data });
};

test('pushes the aggregated dashboard state and clears dirty devices', async () => {
  const { sender, runtime, calls } = createSender();
  sender.start();

  emitMessage(runtime, 'DEVICE', { key: 6, command: 0, output: 1 });
  emitMessage(runtime, 'PORT', { key: 4, gpio: 25, value: 1 });
  emitMessage(runtime, 'PORT', { key: 4, gpio: 26, value: 0 });
  emitMessage(runtime, 'DALLAS', { address: [40, 1, 2], temp: 21.5 });
  runtime.emit('data', { event: 'message', id: 1, key: 'INFO', data: { id: 1 } });

  const result = await sender.flush();
  sender.stop();

  assert.equal(result.sent, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://cloud.test/api/telemetry/snapshots');
  assert.equal((calls[0].init.headers as Record<string, string>).authorization, 'Bearer secret');

  const body = JSON.parse(String(calls[0].init.body)) as {
    hubId: string;
    hubName: string;
    observedAt: number;
    devices: Array<{ deviceId: string; name: string; ip: string; observedAt: number; state: Record<string, any> }>;
  };
  assert.ok(body.hubId);
  assert.equal(body.hubName, 'Home');
  assert.equal(body.observedAt, 1_700_000_000_000);
  assert.equal(body.devices.length, 1);
  assert.equal(body.devices[0].deviceId, 'uuid-1');
  assert.equal(body.devices[0].ip, '192.0.2.5');
  assert.equal(body.devices[0].observedAt, 1_700_000_000_000);
  assert.deepEqual(body.devices[0].state.device, { key: 6, command: 0, output: 1 });
  assert.deepEqual(body.devices[0].state.ports['25'], { key: 4, gpio: 25, value: 1 });
  assert.deepEqual(body.devices[0].state.ports['26'], { key: 4, gpio: 26, value: 0 });
  assert.deepEqual(body.devices[0].state.dallas['280102'], { address: [40, 1, 2], temp: 21.5 });

  assert.equal((await sender.flush()).sent, 0);
  assert.equal(calls.length, 1);
});

test('keeps devices dirty when the cloud rejects a push and retries', async () => {
  let attempt = 0;
  const fetchImpl = (async () => {
    attempt += 1;
    return new Response('{}', { status: attempt === 1 ? 500 : 200 });
  }) as typeof fetch;

  const { sender, runtime } = createSender({ fetchImpl });
  const warnings: unknown[] = [];
  const originalWarn = console.warn;
  console.warn = (message: unknown) => warnings.push(message);

  try {
    sender.start();
    emitMessage(runtime, 'DEVICE', { output: 1 });
    assert.equal((await sender.flush()).sent, 0);
    assert.equal(warnings.length, 1);
    assert.equal((await sender.flush()).sent, 1);
  } finally {
    console.warn = originalWarn;
    sender.stop();
  }
});

test('does not push while the OS clock is not synchronized', async () => {
  let synced = false;
  let clock = 1_700_000_000_000;
  const { sender, runtime, calls } = createSender({ timeSync: async () => synced, now: () => clock });
  sender.start();

  emitMessage(runtime, 'DEVICE', { output: 1 });
  assert.equal((await sender.flush()).sent, 0);
  assert.equal(calls.length, 0);

  synced = true;
  clock += 61_000;
  assert.equal((await sender.flush()).sent, 1);
  sender.stop();
});

test('keeps a stable hub id per data directory', () => {
  const dataDirectory = mkdtempSync(path.join(tmpdir(), 'vuesp-hub-id-'));
  const first = readOrCreateHubId(dataDirectory);
  const second = readOrCreateHubId(dataDirectory);

  assert.equal(first, second);
  assert.equal((statSync(path.join(dataDirectory, 'hub-id')).mode & 0o777).toString(8), '600');
});
