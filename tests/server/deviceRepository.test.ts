import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import { createDeviceRepository } from '../../server/models/deviceRepository.ts';

const createRepository = (options = {}) => createDeviceRepository({ databasePath: ':memory:', ...options });

test('persists device records and does not expose credentials in registry responses', async () => {
  const repository = await createRepository({
    encryptPassword: password => `encrypted:${password}`,
    decryptPassword: password => password.replace('encrypted:', ''),
  });

  const device = repository.create({
    deviceId: 1234,
    firmware: [1, 2, 3],
    ip: '192.0.2.20',
    name: 'Living room',
    password: 'secret',
    username: 'admin',
  });

  assert.equal(device.name, 'Living room');
  assert.equal(device.uuid.length, 36);
  assert.deepEqual(device.firmware, [1, 2, 3]);
  assert.equal('password' in device, false);
  assert.equal('username' in device, false);
  assert.equal(repository.getById(device.id, { includeCredentials: true }).password, 'secret');
  assert.equal(repository.getAll().length, 1);
  repository.close();
});

test('imports existing registry entries once and supports deletion', async () => {
  const repository = await createRepository({
    legacyDevices: [
      { deviceId: 42, firmware: [1, 0, 0], ip: '192.0.2.21', name: 'Legacy', id: 8, password: 'legacy-secret' },
    ],
    encryptPassword: password => `encrypted:${password}`,
    decryptPassword: password => password.replace('encrypted:', ''),
  });

  const [device] = repository.getAll();
  assert.equal(device.id, 8);
  assert.equal(device.deviceId, 42);
  assert.equal(device.name, 'Legacy');
  assert.equal(repository.getById(device.id, { includeCredentials: true }).password, 'legacy-secret');
  assert.equal(repository.delete(device.id).uuid, device.uuid);
  assert.deepEqual(repository.getAll(), []);
  repository.close();
});

test('persists registry data across database reopen', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'vuesp-device-registry-'));
  const databasePath = join(directory, 'devices.sqlite');
  try {
    const first = await createDeviceRepository({ databasePath });
    const added = first.create({ deviceId: 55, ip: '192.0.2.23', name: 'Persistent' });
    first.close();

    const second = await createDeviceRepository({ databasePath });
    assert.equal(second.getById(added.id).uuid, added.uuid);
    second.close();
  } finally {
    rmSync(databasePath, { force: true });
    rmdirSync(directory);
  }
});

test('opens an existing SQLite registry file without replacing its device UUID', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'vuesp-existing-registry-'));
  const databasePath = join(directory, 'vuesp.sqlite');
  const legacyDatabase = new DatabaseSync(databasePath);
  legacyDatabase.exec(`
    CREATE TABLE devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      device_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      ip TEXT NOT NULL UNIQUE,
      firmware TEXT NOT NULL DEFAULT '[]',
      username TEXT NOT NULL DEFAULT '',
      password TEXT,
      added_at TEXT NOT NULL
    );
    CREATE TABLE migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);
  `);
  legacyDatabase.prepare(`
    INSERT INTO devices (uuid, device_id, name, ip, firmware, added_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('saved-hub-uuid', 17, 'Existing', '192.0.2.24', '[1,2,3]', '2025-01-01T00:00:00.000Z');
  legacyDatabase.close();

  try {
    const repository = await createDeviceRepository({ databasePath });
    assert.deepEqual(repository.getAll(), [{
      id: 1,
      uuid: 'saved-hub-uuid',
      deviceId: 17,
      name: 'Existing',
      ip: '192.0.2.24',
      firmware: [1, 2, 3],
      addedAt: '2025-01-01T00:00:00.000Z',
    }]);
    repository.close();
    assert.equal(readFileSync(databasePath).subarray(0, 15).toString(), 'SQLite format 3');
  } finally {
    rmSync(databasePath, { force: true });
    rmdirSync(directory);
  }
});

test('does not re-import legacy devices after the one-time migration', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'vuesp-device-migration-'));
  const databasePath = join(directory, 'devices.sqlite');
  try {
    const first = await createDeviceRepository({
      databasePath,
      legacyDevices: [{ deviceId: 1, ip: '192.0.2.25', name: 'Imported' }],
    });
    first.close();

    const second = await createDeviceRepository({
      databasePath,
      legacyDevices: [{ deviceId: 2, ip: '192.0.2.26', name: 'Should not import' }],
    });
    assert.deepEqual(second.getAll().map(device => device.name), ['Imported']);
    second.close();
  } finally {
    rmSync(databasePath, { force: true });
    rmdirSync(directory);
  }
});

test('rejects invalid addresses and duplicate registrations', async () => {
  const repository = await createRepository();
  const device = { deviceId: 1, ip: '192.0.2.22', name: 'Test' };

  assert.throws(() => repository.create({ ...device, ip: 'not-an-ip' }), /valid IPv4 or IPv6/);
  repository.create(device);
  assert.throws(() => repository.create(device), error =>
    error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE',
  );
  repository.close();
});
