import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { HistoryRecorder } from '@server/modules/history/application/historyRecorder.ts';
import { SqliteHistoryStore } from '@server/shared/storage/sqliteHistoryStore.ts';

test('SQLite history store queries ranges, downsamples and retains', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'vuesp-history-'));
  const store = new SqliteHistoryStore(path.join(dir, 'history.sqlite'));
  await store.append([
    { entityId: 'uuid/device.temp', at: 1_000, value: 10, status: 'live' },
    { entityId: 'uuid/device.temp', at: 2_000, value: 20, status: 'live' },
    { entityId: 'uuid/device.temp', at: 3_000, value: 30, status: 'live' },
  ]);
  assert.equal((await store.query({ entityId: 'uuid/device.temp', from: 0, to: 4_000 })).length, 3);
  const buckets = await store.query({ entityId: 'uuid/device.temp', from: 0, to: 4_000, bucketMs: 3_000 });
  assert.equal(buckets.length, 2);
  assert.equal(buckets[0]?.value, 15);
  assert.equal((await store.health()).ok, true);
  assert.equal(await store.retention({ days: 1 }), 3);
  await store.close();
  rmSync(dir, { recursive: true, force: true });
});

test('history recorder writes changed scalar values', async () => {
  const store = new SqliteHistoryStore(':memory:');
  const registry = new ObjectRegistry();
  registry.upsertDevice({ deviceId: 'uuid-1', name: 'BMS', ip: '192.0.2.1', online: true });
  const entity = {
    id: 'uuid-1/device.temp',
    deviceId: 'uuid-1',
    key: 'device.temp',
    name: 'Temp',
    type: 'info',
    entityType: 'sensor',
    available: false,
    get: { value: 10, status: 'live' as const, updatedAt: 1, lastChanged: 1 },
  };
  registry.syncEntities('uuid-1', [entity]);
  const recorder = new HistoryRecorder({ registry, history: store, minIntervalMs: 0, deadband: 0, flushMs: 60_000 });
  recorder.start();
  recorder.record('uuid-1', 'device.temp');
  await recorder.flush();
  const points = await store.query({ entityId: 'uuid-1/device.temp', from: 0, to: Date.now() + 1 });
  assert.equal(points.length, 1);
  assert.equal(points[0]?.value, 10);
  await recorder.stop();
  await store.close();
});
