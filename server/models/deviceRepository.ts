import { randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isIP } from 'node:net';
import { DatabaseSync } from 'node:sqlite';

type SqliteInputValue = null | number | bigint | string | NodeJS.ArrayBufferView;
type SqliteOutputValue = null | number | bigint | string | NodeJS.NonSharedUint8Array;

export interface DeviceRecord {
  id: number;
  uuid: string;
  deviceId: number;
  name: string;
  ip: string;
  firmware: unknown[];
  addedAt: string;
  username?: string;
  password?: string;
}

interface LegacyDevice {
  id?: unknown;
  deviceId?: unknown;
  name?: unknown;
  ip?: unknown;
  firmware?: unknown;
  username?: unknown;
  password?: unknown;
}

const parseFirmware = (value: string): unknown[] => {
  try {
    const firmware = JSON.parse(value);
    return Array.isArray(firmware) ? firmware : [];
  } catch {
    return [];
  }
};

const toDevice = (
  row: Record<string, SqliteOutputValue>,
  decryptPassword: (value: string) => string,
  includeCredentials: boolean,
): DeviceRecord => ({
  id: Number(row.id),
  uuid: String(row.uuid),
  deviceId: Number(row.device_id),
  name: String(row.name),
  ip: String(row.ip),
  firmware: parseFirmware(String(row.firmware)),
  addedAt: String(row.added_at),
  ...(includeCredentials ? {
    username: String(row.username),
    password: row.password ? decryptPassword(String(row.password)) : '',
  } : {}),
});

export interface DeviceRepository {
  getAll(options?: { includeCredentials?: boolean }): DeviceRecord[];
  getById(id: number | string, options?: { includeCredentials?: boolean }): DeviceRecord | null;
  create(input: Record<string, unknown>): DeviceRecord;
  update(id: number | string, input: Record<string, unknown>): DeviceRecord | null;
  delete(id: number | string): DeviceRecord | null;
  close(): void;
}

export const createDeviceRepository = async ({
  databasePath,
  legacyDevices = [],
  encryptPassword = value => value,
  decryptPassword = value => value,
}: {
  databasePath: string;
  legacyDevices?: LegacyDevice[];
  encryptPassword?: (value: string) => string;
  decryptPassword?: (value: string) => string;
}): Promise<DeviceRepository> => {
  if (!databasePath) throw new TypeError('databasePath is required');

  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true });
  }
  const database = new DatabaseSync(databasePath);
  if (databasePath !== ':memory:') chmodSync(databasePath, 0o600);

  const rows = (sql: string, params: SqliteInputValue[] = []) => database.prepare(sql).all(...params);
  const run = (sql: string, params: SqliteInputValue[] = []) => database.prepare(sql).run(...params).lastInsertRowid;

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
  `);

  database.exec('BEGIN');
  let migrationCommitted = false;
  try {
    const migration = rows('SELECT name FROM migrations WHERE name = ?', ['electron-store-devices-v1']);
    if (!migration.length) {
      for (const device of Array.isArray(legacyDevices) ? legacyDevices : []) {
        if (typeof device?.ip !== 'string' || isIP(device.ip) === 0) continue;
        const password = device.password ? encryptPassword(String(device.password)) : null;
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
    database.exec('COMMIT');
    migrationCommitted = true;
  } catch (error) {
    if (!migrationCommitted) database.exec('ROLLBACK');
    database.close();
    throw error;
  }

  const getAll = ({ includeCredentials = false } = {}) => rows('SELECT * FROM devices ORDER BY added_at, id')
    .map(row => toDevice(row, decryptPassword, includeCredentials));

  const getById = (id, { includeCredentials = false } = {}) => {
    const row = rows('SELECT * FROM devices WHERE id = ?', [Number(id)])[0];
    return row ? toDevice(row, decryptPassword, includeCredentials) : null;
  };

  const validateNameAndAddress = (nameInput: unknown, ipInput: unknown) => {
    const name = String(nameInput || '').trim();
    const ip = String(ipInput || '').trim();
    if (isIP(ip) === 0) throw new TypeError('A valid IPv4 or IPv6 address is required');
    if (!name || name.length > 64) throw new TypeError('Name must contain 1 to 64 characters');
    return { name, ip };
  };

  const validateCredentials = (username: unknown, password: unknown) => {
    if (username != null && typeof username !== 'string') throw new TypeError('Username must be a string');
    if (password != null && typeof password !== 'string') throw new TypeError('Password must be a string');
    const usernameValue = typeof username === 'string' ? username : '';
    const passwordValue = typeof password === 'string' ? password : '';
    if (usernameValue.length > 128 || passwordValue.length > 256) {
      throw new TypeError('Device credentials exceed the allowed length');
    }
    return {
      username: usernameValue,
      password: passwordValue,
    };
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
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new TypeError('Device data must be an object');
      }
      const { name, ip } = validateNameAndAddress(input.name, input.ip);
      const credentials = validateCredentials(input.username, input.password);
      assertUniqueAddress(ip);
      const deviceId = Number(input.deviceId);
      if (!Number.isSafeInteger(deviceId) || deviceId < 0 || deviceId > 0xffffffff) {
        throw new TypeError('Device ID must be an unsigned 32-bit integer');
      }
      const firmware = Array.isArray(input.firmware) ? input.firmware : [];
      if (firmware.length > 3 || firmware.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
        throw new TypeError('Firmware version must contain up to three byte values');
      }

      const result = run(`
        INSERT INTO devices (uuid, device_id, name, ip, firmware, username, password, added_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        randomUUID(),
        deviceId,
        name,
        ip,
        JSON.stringify(firmware),
        credentials.username,
        credentials.password ? encryptPassword(credentials.password) : null,
        new Date().toISOString(),
      ]);
      return getById(Number(result));
    },

    update(id, input) {
      const current = getById(id, { includeCredentials: true });
      if (!current) return null;
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new TypeError('Device data must be an object');
      }
      const updated = { ...current, ...input };
      const { name, ip } = validateNameAndAddress(updated.name, updated.ip);
      const credentials = validateCredentials(updated.username, input.password);
      assertUniqueAddress(ip, id);
      const password = Object.hasOwn(input, 'password')
        ? credentials.password ? encryptPassword(credentials.password) : null
        : current.password ? encryptPassword(current.password) : null;
      run(`
        UPDATE devices
        SET name = ?, ip = ?, username = ?, password = ?
        WHERE id = ?
      `, [name, ip, String(updated.username || ''), password, Number(id)]);
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
