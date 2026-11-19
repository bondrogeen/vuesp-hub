import { chmodSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type {
  IHistoryHealth,
  IHistoryPoint,
  IHistoryQuery,
  IHistoryRetention,
  IHistoryStore,
} from '@core/application/historyStore.ts';
import { errorMessage } from '@root/shared/errors.ts';

type TDbValue = null | number | bigint | string | Uint8Array;
type TDbRow = Record<string, TDbValue>;

const asString = (value: TDbValue | undefined, fallback = ''): string => typeof value === 'string' ? value : fallback;
const asNumber = (value: TDbValue | undefined, fallback = 0): number => typeof value === 'number' ? value : Number(value ?? fallback);

export class SqliteHistoryStore implements IHistoryStore {
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
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS history_points (
        entity_id TEXT NOT NULL,
        at INTEGER NOT NULL,
        value_json TEXT NOT NULL,
        status TEXT NOT NULL,
        PRIMARY KEY (entity_id, at)
      );
      CREATE INDEX IF NOT EXISTS history_points_at ON history_points (at);
    `);
  }

  async append(points: IHistoryPoint[]): Promise<void> {
    if (this.closed) throw new Error('History store is closed');
    if (!points.length) return;
    const statement = this.database.prepare(`
      INSERT OR REPLACE INTO history_points (entity_id, at, value_json, status) VALUES (?, ?, ?, ?)
    `);
    this.database.exec('BEGIN');
    try {
      for (const point of points) {
        if (!point.entityId || !Number.isFinite(point.at)) continue;
        statement.run(point.entityId, Math.trunc(point.at), JSON.stringify(point.value), point.status);
      }
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  async query(query: IHistoryQuery): Promise<IHistoryPoint[]> {
    if (this.closed) throw new Error('History store is closed');
    if (!query.entityId || !Number.isFinite(query.from) || !Number.isFinite(query.to)) return [];
    const limit = Math.min(Math.max(query.limit ?? 5_000, 1), 20_000);
    const rows = this.database.prepare(`
      SELECT at, value_json, status FROM history_points
      WHERE entity_id = ? AND at >= ? AND at <= ?
      ORDER BY at ASC
      LIMIT ?
    `).all(query.entityId, Math.trunc(query.from), Math.trunc(query.to), limit) as TDbRow[];

    const points = rows.map(row => ({
      entityId: query.entityId,
      at: asNumber(row.at),
      value: this.parseValue(row.value_json),
      status: asString(row.status) === 'stale' ? 'stale' as const : 'live' as const,
    }));

    if (!query.bucketMs || query.bucketMs <= 0) return points;
    return this.downsample(points, query.bucketMs);
  }

  async retention({ days }: IHistoryRetention): Promise<number> {
    if (this.closed) throw new Error('History store is closed');
    if (!Number.isFinite(days) || days <= 0) return 0;
    const cutoff = Date.now() - days * 86_400_000;
    const result = this.database.prepare('DELETE FROM history_points WHERE at < ?').run(Math.trunc(cutoff));
    return Number(result.changes);
  }

  async health(): Promise<IHistoryHealth> {
    if (this.closed) return { ok: false, status: 'error', message: 'History store is closed' };
    try {
      const check = this.database.prepare('PRAGMA quick_check').get() as TDbRow | undefined;
      const result = asString(check?.quick_check, 'unknown');
      if (result !== 'ok') return { ok: false, status: 'error', message: result };
      const sizeBytes = this.path === ':memory:' || !existsSync(this.path) ? undefined : statSync(this.path).size;
      return { ok: true, status: 'ok', ...(sizeBytes === undefined ? {} : { sizeBytes }) };
    } catch (error) {
      return { ok: false, status: 'error', message: errorMessage(error) };
    }
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.database.close();
  }

  private parseValue(value: TDbValue | undefined): unknown {
    try {
      return JSON.parse(asString(value));
    } catch {
      return undefined;
    }
  }

  private downsample(points: IHistoryPoint[], bucketMs: number): IHistoryPoint[] {
    const buckets = new Map<number, { sum: number; count: number; last: IHistoryPoint }>();
    for (const point of points) {
      const bucket = Math.floor(point.at / bucketMs) * bucketMs;
      const current = buckets.get(bucket);
      const number = typeof point.value === 'number' ? point.value : Number(point.value);
      if (current) {
        if (Number.isFinite(number)) {
          current.sum += number;
          current.count += 1;
        }
        current.last = point;
      } else {
        buckets.set(bucket, {
          sum: Number.isFinite(number) ? number : 0,
          count: Number.isFinite(number) ? 1 : 0,
          last: point,
        });
      }
    }

    return [...buckets.entries()].map(([at, bucket]) => ({
      entityId: bucket.last.entityId,
      at,
      value: bucket.count ? bucket.sum / bucket.count : bucket.last.value,
      status: bucket.last.status,
    }));
  }
}
