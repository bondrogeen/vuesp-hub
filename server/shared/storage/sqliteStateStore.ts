import { chmodSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { IEntity } from '@core/application/objectRegistry.ts';
import {
  STATE_SCHEMA_VERSION,
  type IStateSnapshot,
  type IStateStore,
  type IStoreHealth,
  type IStoredStateDevice,
} from '@core/application/stateStore.ts';

type TDbValue = null | number | bigint | string | Uint8Array;
type TDbRow = Record<string, TDbValue>;

const asString = (value: TDbValue | undefined, fallback = ''): string => typeof value === 'string' ? value : fallback;
const asNumber = (value: TDbValue | undefined, fallback = 0): number => typeof value === 'number' ? value : Number(value ?? fallback);
const asBoolean = (value: TDbValue | undefined): boolean => asNumber(value) !== 0;

export class SqliteStateStore implements IStateStore {
  private readonly database: DatabaseSync;
  private readonly path: string;
  private closed = false;

  constructor(path: string) {
    this.path = path;
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
      if (process.platform !== 'win32') chmodSync(dirname(path), 0o700);
    }

    this.database = new DatabaseSync(path);
    if (path !== ':memory:' && process.platform !== 'win32') chmodSync(path, 0o600);
    this.database.exec('PRAGMA journal_mode = WAL');
    this.database.exec('PRAGMA synchronous = NORMAL');
    this.database.exec('PRAGMA busy_timeout = 5000');
    this.migrate();
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS state_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS state_devices (
        device_id TEXT PRIMARY KEY,
        legacy_id INTEGER,
        name TEXT NOT NULL,
        ip TEXT NOT NULL,
        online INTEGER NOT NULL,
        last_seen INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS state_entities (
        device_id TEXT NOT NULL,
        entity_key TEXT NOT NULL,
        payload TEXT NOT NULL,
        PRIMARY KEY (device_id, entity_key)
      );
    `);

    const version = this.database.prepare('SELECT value FROM state_meta WHERE key = ?').get('schema_version') as TDbRow | undefined;
    if (version === undefined) {
      this.database.prepare('INSERT INTO state_meta (key, value) VALUES (?, ?)').run('schema_version', String(STATE_SCHEMA_VERSION));
      this.database.prepare('INSERT INTO state_meta (key, value) VALUES (?, ?)').run('saved_at', '0');
      return;
    }
    const current = asNumber(version.value, 0);
    if (current > STATE_SCHEMA_VERSION) {
      throw new Error(`State schema ${current} is newer than this hub supports (${STATE_SCHEMA_VERSION})`);
    }
  }

  async load(): Promise<IStateSnapshot> {
    if (this.closed) throw new Error('State store is closed');
    const metaRows = this.database.prepare('SELECT key, value FROM state_meta').all() as TDbRow[];
    const meta = new Map(metaRows.map(row => [asString(row.key), asString(row.value)]));
    const schemaVersion = Number(meta.get('schema_version') ?? STATE_SCHEMA_VERSION);
    const savedAt = Number(meta.get('saved_at') ?? 0);

    const deviceRows = this.database.prepare('SELECT * FROM state_devices').all() as TDbRow[];
    const devices: IStoredStateDevice[] = deviceRows.map(row => {
      const deviceId = asString(row.device_id);
      const entityRows = this.database.prepare('SELECT payload FROM state_entities WHERE device_id = ?').all(deviceId) as TDbRow[];
      const entities: IEntity[] = [];
      for (const entityRow of entityRows) {
        try {
          entities.push(JSON.parse(asString(entityRow.payload)) as IEntity);
        } catch {
          // Skip only the damaged entity.
        }
      }
      const legacyId = typeof row.legacy_id === 'number' ? row.legacy_id : undefined;
      return {
        deviceId,
        ...(legacyId === undefined ? {} : { legacyId }),
        name: asString(row.name),
        ip: asString(row.ip),
        online: asBoolean(row.online),
        lastSeen: asNumber(row.last_seen),
        entities,
      };
    });

    return { schemaVersion, savedAt, devices };
  }

  async save(snapshot: IStateSnapshot): Promise<void> {
    if (this.closed) throw new Error('State store is closed');
    if (snapshot.schemaVersion > STATE_SCHEMA_VERSION) {
      throw new Error(`Cannot save state schema ${snapshot.schemaVersion}`);
    }

    const deviceStatement = this.database.prepare(`
      INSERT INTO state_devices (device_id, legacy_id, name, ip, online, last_seen)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const entityStatement = this.database.prepare(`
      INSERT INTO state_entities (device_id, entity_key, payload) VALUES (?, ?, ?)
    `);

    this.database.exec('BEGIN');
    try {
      this.database.exec('DELETE FROM state_entities; DELETE FROM state_devices');
      for (const device of snapshot.devices) {
        deviceStatement.run(
          device.deviceId,
          device.legacyId ?? null,
          device.name,
          device.ip,
          device.online ? 1 : 0,
          device.lastSeen,
        );
        for (const entity of device.entities) {
          entityStatement.run(device.deviceId, entity.key, JSON.stringify(entity));
        }
      }
      this.database.prepare('INSERT OR REPLACE INTO state_meta (key, value) VALUES (?, ?)').run('schema_version', String(snapshot.schemaVersion));
      this.database.prepare('INSERT OR REPLACE INTO state_meta (key, value) VALUES (?, ?)').run('saved_at', String(snapshot.savedAt));
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  async exportJson(): Promise<string> {
    return JSON.stringify(await this.load(), null, 2);
  }

  async importJson(value: string): Promise<void> {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') throw new TypeError('State JSON must be an object');
    const snapshot = parsed as IStateSnapshot;
    if (!Array.isArray(snapshot.devices) || typeof snapshot.schemaVersion !== 'number') {
      throw new TypeError('State JSON has an invalid shape');
    }
    await this.save({ ...snapshot, savedAt: snapshot.savedAt || Date.now() });
  }

  async health(): Promise<IStoreHealth> {
    if (this.closed) return { ok: false, status: 'error', message: 'State store is closed' };
    try {
      const check = this.database.prepare('PRAGMA quick_check').get() as TDbRow | undefined;
      const result = asString(check?.quick_check, 'unknown');
      if (result !== 'ok') return { ok: false, status: 'error', message: result };
      const sizeBytes = this.path === ':memory:' || !existsSync(this.path) ? undefined : statSync(this.path).size;
      return { ok: true, status: 'ok', ...(sizeBytes === undefined ? {} : { sizeBytes }) };
    } catch (error) {
      return { ok: false, status: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.database.close();
  }
}
