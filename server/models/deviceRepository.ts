import { randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isIP } from 'node:net';
import { DatabaseSync } from 'node:sqlite';
import {
  parseDeviceCreateInput,
  parseDeviceUpdateInput,
  type DeviceConnectionRecord,
  type DeviceRecord,
} from '../../shared/device.ts';
import type { SecretProvider } from './secretProvider.ts';

type SqliteInputValue = null | number | bigint | string | NodeJS.ArrayBufferView;
type SqliteOutputValue = null | number | bigint | string | NodeJS.NonSharedUint8Array;

interface LegacyDevice {
  id?: unknown;
  deviceId?: unknown;
  name?: unknown;
  ip?: unknown;
  firmware?: unknown;
  username?: unknown;
  password?: unknown;
}

const parseFirmware = (value: string): number[] => {
  try {
    const firmware = JSON.parse(value);
    return Array.isArray(firmware) &&
      firmware.length <= 3 &&
      firmware.every(part => Number.isInteger(part) && part >= 0 && part <= 255)
      ? firmware
      : [];
  } catch {
    return [];
  }
};

const toDevice = (
  row: Record<string, SqliteOutputValue>,
): DeviceRecord => ({
  id: Number(row.id),
  uuid: String(row.uuid),
  deviceId: Number(row.device_id),
  name: String(row.name),
  ip: String(row.ip),
  firmware: parseFirmware(String(row.firmware)),
  addedAt: String(row.added_at),
});

export interface DeviceRepository {
  getAll(): DeviceRecord[];
  getAll(options: { includeCredentials: true }): DeviceConnectionRecord[];
  getById(id: number | string): DeviceRecord | null;
  getById(id: number | string, options: { includeCredentials: true }): DeviceConnectionRecord | null;
  create(input: unknown): DeviceRecord;
  update(id: number | string, input: unknown): DeviceRecord | null;
  delete(id: number | string): DeviceRecord | null;
  close(): void;
}

export const createDeviceRepository = async ({
  databasePath,
  legacyDevices = [],
  secretProvider,
}: {
  databasePath: string;
  legacyDevices?: LegacyDevice[];
  secretProvider: SecretProvider;
}): Promise<DeviceRepository> => {
  if (!databasePath) throw new TypeError('databasePath is required');
  if (
    typeof secretProvider?.encrypt !== 'function' ||
    typeof secretProvider?.decrypt !== 'function'
  ) {
    throw new TypeError('A secret provider with encrypt and decrypt methods is required');
  }

  if (databasePath !== ':memory:') {
    const databaseDirectory = dirname(databasePath);
    mkdirSync(databaseDirectory, { recursive: true, mode: 0o700 });
    if (process.platform !== 'win32') chmodSync(databaseDirectory, 0o700);
  }
  const database = new DatabaseSync(databasePath);
  if (databasePath !== ':memory:' && process.platform !== 'win32') chmodSync(databasePath, 0o600);

  const rows = (sql: string, params: SqliteInputValue[] = []) => database.prepare(sql).all(...params);
  const run = (sql: string, params: SqliteInputValue[] = []) => database.prepare(sql).run(...params).lastInsertRowid;

  const currentVersion = Number(database.prepare('PRAGMA user_version').get()?.user_version ?? 0);
  const latestVersion = 2;
  if (!Number.isInteger(currentVersion) || currentVersion < 0 || currentVersion > latestVersion) {
    database.close();
    throw new Error(`Unsupported device database schema version: ${currentVersion}`);
  }

  database.exec('BEGIN');
  try {
    if (currentVersion < 1) {
      database.exec(`
        CREATE TABLE IF NOT EXISTS devices (
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
        CREATE TABLE IF NOT EXISTS migrations (
          name TEXT PRIMARY KEY,
          applied_at TEXT NOT NULL
        );
        PRAGMA user_version = 1;
      `);
    }

    if (currentVersion < 2) {
      const migration = rows('SELECT name FROM migrations WHERE name = ?', ['electron-store-devices-v1']);
      if (!migration.length) {
        for (const device of Array.isArray(legacyDevices) ? legacyDevices : []) {
          if (typeof device?.ip !== 'string' || isIP(device.ip) === 0) continue;
          const password = device.password ? secretProvider.encrypt(String(device.password)) : null;
          run(`
            INSERT OR IGNORE INTO devices (id, uuid, device_id, name, ip, firmware, username, password, added_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            Number.isSafeInteger(Number(device.id)) && Number(device.id) > 0 ? Number(device.id) : null,
            randomUUID(),
            Number.isSafeInteger(Number(device.deviceId)) ? Number(device.deviceId) : 0,
            String(device.name || device.ip).trim().slice(0, 64),
            device.ip,
            JSON.stringify(Array.isArray(device.firmware) ? device.firmware : []),
            String(device.username || ''),
            password,
            new Date().toISOString(),
          ]);
        }
        run('INSERT INTO migrations (name, applied_at) VALUES (?, ?)', ['electron-store-devices-v1', new Date().toISOString()]);
      }
      database.exec('PRAGMA user_version = 2');
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    database.close();
    throw error;
  }

  const withCredentials = (row: Record<string, SqliteOutputValue>): DeviceConnectionRecord => ({
    ...toDevice(row),
    username: String(row.username),
    password: row.password ? secretProvider.decrypt(String(row.password)) : '',
  });

  function getAll(): DeviceRecord[];
  function getAll(options: { includeCredentials: true }): DeviceConnectionRecord[];
  function getAll(options?: { includeCredentials?: boolean }): DeviceRecord[] | DeviceConnectionRecord[] {
    const records = rows('SELECT * FROM devices ORDER BY added_at, id');
    return options?.includeCredentials
      ? records.map(withCredentials)
      : records.map(toDevice);
  }

  function getById(id: number | string): DeviceRecord | null;
  function getById(id: number | string, options: { includeCredentials: true }): DeviceConnectionRecord | null;
  function getById(id: number | string, options?: { includeCredentials?: boolean }): DeviceRecord | DeviceConnectionRecord | null {
    const row = rows('SELECT * FROM devices WHERE id = ?', [Number(id)])[0];
    if (!row) return null;
    return options?.includeCredentials ? withCredentials(row) : toDevice(row);
  }

  const validateNameAndAddress = (name: string, ip: string) => {
    if (isIP(ip) === 0) throw new TypeError('A valid IPv4 or IPv6 address is required');
    if (!name || name.length > 64) throw new TypeError('Name must contain 1 to 64 characters');
    return { name, ip };
  };
  const assertUniqueAddress = (ip: string, id: number | string = 0) => {
    const duplicate = rows('SELECT id FROM devices WHERE ip = ? AND id != ?', [ip, Number(id) || 0])[0];
    if (!duplicate) return;
    const error = Object.assign(new Error('A device at this IP address is already registered'), {
      code: 'SQLITE_CONSTRAINT_UNIQUE',
    });
    throw error;
  };

  return {
    getAll,
    getById,

    create(input) {
      const parsed = parseDeviceCreateInput(input);
      const { name, ip } = validateNameAndAddress(parsed.name, parsed.ip);
      assertUniqueAddress(ip);

      const result = run(`
        INSERT INTO devices (uuid, device_id, name, ip, firmware, username, password, added_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        randomUUID(),
        parsed.deviceId,
        name,
        ip,
        JSON.stringify(parsed.firmware ?? []),
        parsed.username ?? '',
        parsed.password ? secretProvider.encrypt(parsed.password) : null,
        new Date().toISOString(),
      ]);
      const device = getById(Number(result));
      if (!device) throw new Error('Created device could not be read back');
      return device;
    },

    update(id, input) {
      const currentRow = rows('SELECT * FROM devices WHERE id = ?', [Number(id)])[0];
      if (!currentRow) return null;
      const current = { ...toDevice(currentRow), username: String(currentRow.username) };
      const parsed = parseDeviceUpdateInput(input);
      const updated = { ...current, ...parsed };
      const { name, ip } = validateNameAndAddress(updated.name, updated.ip);
      assertUniqueAddress(ip, id);
      if (Object.hasOwn(parsed, 'password')) {
        const password = parsed.password ? secretProvider.encrypt(parsed.password) : null;
        run(`
          UPDATE devices
          SET name = ?, ip = ?, username = ?, password = ?
          WHERE id = ?
        `, [name, ip, updated.username, password, Number(id)]);
      } else {
        run(`
          UPDATE devices
          SET name = ?, ip = ?, username = ?
          WHERE id = ?
        `, [name, ip, updated.username, Number(id)]);
      }
      return getById(id);
    },

    delete(id) {
      const device = getById(id);
      if (!device) return null;
      run('DELETE FROM devices WHERE id = ?', [Number(id)]);
      return device;
    },

    close() {
      database.close();
    },
  };
};
