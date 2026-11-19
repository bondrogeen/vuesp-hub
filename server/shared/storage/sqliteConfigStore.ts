import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { CONFIG_SCHEMA_VERSION, type IConfigStore } from '@core/application/configStore.ts';

const asString = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : fallback;

export class SqliteConfigStore implements IConfigStore {
  private readonly database: DatabaseSync;
  private closed = false;

  constructor(path: string) {
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
      if (process.platform !== 'win32') chmodSync(dirname(path), 0o700);
    }
    this.database = new DatabaseSync(path);
    if (path !== ':memory:' && process.platform !== 'win32') chmodSync(path, 0o600);
    this.database.exec('PRAGMA journal_mode = WAL');
    this.database.exec('PRAGMA busy_timeout = 5000');
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS config_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS config_entries (
        section TEXT NOT NULL,
        key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (section, key)
      );
    `);
    const version = this.database.prepare('SELECT value FROM config_meta WHERE key = ?').get('schema_version') as { value?: unknown } | undefined;
    if (version === undefined) {
      this.database.prepare('INSERT INTO config_meta (key, value) VALUES (?, ?)').run('schema_version', String(CONFIG_SCHEMA_VERSION));
    } else if (Number(version.value) > CONFIG_SCHEMA_VERSION) {
      throw new Error(`Config schema ${String(version.value)} is newer than this hub supports (${CONFIG_SCHEMA_VERSION})`);
    }
  }

  async get<T>(section: string, key: string): Promise<T | undefined> {
    const row = this.database.prepare('SELECT value_json FROM config_entries WHERE section = ? AND key = ?').get(section, key) as { value_json?: unknown } | undefined;
    if (!row) return undefined;
    try {
      return JSON.parse(asString(row.value_json)) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(section: string, key: string, value: T): Promise<void> {
    if (this.closed) throw new Error('Config store is closed');
    this.database.prepare(`
      INSERT INTO config_entries (section, key, value_json, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(section, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(section, key, JSON.stringify(value), Date.now());
  }

  async delete(section: string, key: string): Promise<boolean> {
    if (this.closed) throw new Error('Config store is closed');
    const result = this.database.prepare('DELETE FROM config_entries WHERE section = ? AND key = ?').run(section, key);
    return Number(result.changes) > 0;
  }

  async list<T>(section: string): Promise<Record<string, T>> {
    const rows = this.database.prepare('SELECT key, value_json FROM config_entries WHERE section = ?').all(section) as Array<{ key?: unknown; value_json?: unknown }>;
    const result: Record<string, T> = {};
    for (const row of rows) {
      try {
        result[asString(row.key)] = JSON.parse(asString(row.value_json)) as T;
      } catch {
        // Skip only the damaged entry.
      }
    }
    return result;
  }

  async health(): Promise<{ ok: boolean; status: 'ok' | 'error'; message?: string }> {
    if (this.closed) return { ok: false, status: 'error', message: 'Config store is closed' };
    try {
      const check = this.database.prepare('PRAGMA quick_check').get() as { quick_check?: unknown } | undefined;
      const result = asString(check?.quick_check, 'unknown');
      return result === 'ok' ? { ok: true, status: 'ok' } : { ok: false, status: 'error', message: result };
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
