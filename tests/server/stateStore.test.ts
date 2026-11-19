import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { STATE_SCHEMA_VERSION, type IStateSnapshot } from '@core/application/stateStore.ts';
import { SqliteStateStore } from '@server/shared/storage/sqliteStateStore.ts';

const snapshot = (): IStateSnapshot => ({
  schemaVersion: STATE_SCHEMA_VERSION,
  savedAt: 100,
  devices: [{
    deviceId: 'uuid-1',
    legacyId: 7,
    name: 'BMS',
    ip: '192.0.2.1',
    online: true,
    lastSeen: 99,
    entities: [{
      id: 'uuid-1/device.temp',
      deviceId: 'uuid-1',
      key: 'device.temp',
      name: 'Temperature',
      type: 'info',
      entityType: 'sensor',
      available: false,
      get: { value: 21.5, display: '21.5 °C', status: 'live', updatedAt: 90, lastChanged: 90 },
    }],
  }],
});

test('SQLite state store persists and restores a snapshot', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'vuesp-state-'));
  const file = path.join(dir, 'state.sqlite');
  const store = new SqliteStateStore(file);
  await store.save(snapshot());
  assert.equal((await store.health()).ok, true);
  await store.close();

  const reopened = new SqliteStateStore(file);
  const loaded = await reopened.load();
  assert.equal(loaded.schemaVersion, STATE_SCHEMA_VERSION);
  assert.equal(loaded.devices[0]?.legacyId, 7);
  assert.equal(loaded.devices[0]?.entities[0]?.get?.value, 21.5);
  assert.equal(JSON.parse(await reopened.exportJson()).devices.length, 1);
  const imported = new SqliteStateStore(':memory:');
  await imported.importJson(JSON.stringify(snapshot()));
  assert.equal((await imported.load()).devices[0]?.entities[0]?.key, 'device.temp');
  await imported.close();
  await reopened.close();
  rmSync(dir, { recursive: true, force: true });
});

test('ObjectRegistry restores snapshot as stale and offline', () => {
  const registry = new ObjectRegistry();
  registry.restore(snapshot());
  const device = registry.getDevice('uuid-1');
  assert.equal(device?.online, false);
  assert.equal(registry.getEntity('uuid-1', 'device.temp')?.get?.status, 'stale');
  assert.equal(registry.getEntity('uuid-1', 'device.temp')?.get?.value, 21.5);
});
