import { appendFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface IAuditEntry {
  at: number;
  actor: string;
  role?: string;
  action: string;
  target?: string;
  result: 'ok' | 'denied' | 'failed';
  details?: Record<string, unknown>;
}

export interface IAuditLogOptions {
  directory: string;
  maxBytes?: number;
  keep?: number;
  now?: () => number;
}

const SECRET_KEYS = /^(password|token|authorization|secret|apiKey|privateKey|masterKey)$/i;
const REDACTED = '[redacted]';

/** Drops credentials from anything that is about to be persisted. */
export const redactSecrets = (value: unknown, depth = 0): unknown => {
  if (depth > 6) return '[deep]';
  if (Array.isArray(value)) return value.map(item => redactSecrets(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SECRET_KEYS.test(key) ? REDACTED : redactSecrets(item, depth + 1),
      ]),
    );
  }
  return value;
};

/**
 * Append-only audit trail. Entries are newline-delimited JSON so the file can
 * be tailed and parsed without loading it into memory. Rotation keeps the most
 * recent files next to the active one.
 */
export class AuditLog {
  private readonly directory: string;
  private readonly file: string;
  private readonly maxBytes: number;
  private readonly keep: number;
  private readonly now: () => number;

  constructor({ directory, maxBytes = 5 * 1024 * 1024, keep = 5, now = Date.now }: IAuditLogOptions) {
    this.directory = directory;
    this.file = path.join(directory, 'audit.jsonl');
    this.maxBytes = Math.max(maxBytes, 1024);
    this.keep = Math.max(keep, 1);
    this.now = now;
  }

  async record(entry: Omit<IAuditEntry, 'at'> & { at?: number }): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await this.rotateIfNeeded();
    const line = JSON.stringify({
      at: entry.at ?? this.now(),
      actor: entry.actor,
      ...(entry.role ? { role: entry.role } : {}),
      action: entry.action,
      ...(entry.target ? { target: entry.target } : {}),
      result: entry.result,
      ...(entry.details ? { details: redactSecrets(entry.details) as Record<string, unknown> } : {}),
    });
    await appendFile(this.file, `${line}\n`, { mode: 0o600 });
  }

  async list(limit = 100): Promise<IAuditEntry[]> {
    const raw = await readFile(this.file, 'utf8').catch(() => '');
    return raw
      .split('\n')
      .filter(Boolean)
      .slice(-Math.max(limit, 1))
      .map(line => {
        try {
          return JSON.parse(line) as IAuditEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is IAuditEntry => entry !== null);
  }

  private async rotateIfNeeded(): Promise<void> {
    const info = await stat(this.file).catch(() => null);
    if (!info || info.size < this.maxBytes) return;
    const stamp = new Date(this.now()).toISOString().replace(/[:.]/g, '-');
    await rename(this.file, path.join(this.directory, `audit-${stamp}.jsonl`)).catch(() => undefined);
    await writeFile(this.file, '', { mode: 0o600 });
    await this.prune();
  }

  private async prune(): Promise<void> {
    const archived = (await readdir(this.directory).catch(() => []))
      .filter(name => /^audit-.*\.jsonl$/.test(name))
      .sort();
    for (const name of archived.slice(0, Math.max(archived.length - this.keep, 0))) {
      await rm(path.join(this.directory, name), { force: true });
    }
  }
}
