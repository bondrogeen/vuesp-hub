import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { DeviceRecord } from '@root/shared/device.ts';
import { isDeviceEventPayload, isRecordValue } from '@root/shared/device.ts';
import type { PublicDashboardTile } from '@root/shared/dashboardTiles.ts';

const execFileAsync = promisify(execFile);

const HUB_ID_FILE = 'hub-id';
const DEFAULT_DEBOUNCE_MS = 1500;
const DEFAULT_MAX_BACKOFF_MS = 60_000;
const TIME_SYNC_CACHE_MS = 60_000;

export interface TelemetryEventSource {
  on(event: 'data', listener: (payload: unknown) => void): unknown;
  off(event: 'data', listener: (payload: unknown) => void): unknown;
}

export interface TelemetryDeviceModel {
  getAll(): DeviceRecord[];
}

export interface TelemetrySenderOptions {
  runtime: TelemetryEventSource;
  getDeviceModel: () => Promise<TelemetryDeviceModel>;
  dataDirectory: string;
  url: string;
  token: string;
  hubName?: string;
  debounceMs?: number;
  maxBackoffMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
  /** `null` means the platform cannot prove time sync; the sender then proceeds. */
  timeSyncCheck?: () => Promise<boolean | null>;
  /** Optional transport (WebSocket). When omitted, the sender posts to `url`. */
  transport?: (payload: TelemetryPayload) => Promise<void>;
}

export interface TelemetryDevicePayload {
  deviceId: string;
  name: string;
  ip: string;
  observedAt: number;
  state: TelemetryDeviceState;
  /** Resolved, safe dashboard tiles for the cloud. Raw expressions never leave the hub. */
  tiles?: PublicDashboardTile[];
}

export interface TelemetryPayload {
  hubId: string;
  hubName: string;
  observedAt: number;
  devices: TelemetryDevicePayload[];
}

export interface TelemetryDeviceState {
  ports: Record<string, unknown>;
  dallas: Record<string, unknown>;
  slots: Record<string, unknown>;
  [key: string]: unknown;
}

interface PendingSnapshot {
  state: TelemetryDeviceState;
  updatedAt: number;
}

const emptyState = (): TelemetryDeviceState => ({ ports: {}, dallas: {}, slots: {} });

const dallasAddress = (data: Record<string, unknown>): string => {
  const { address } = data;
  if (!Array.isArray(address)) return String(address ?? '');
  return address.map(value => (typeof value === 'number' && value < 16 ? `0${value.toString(16)}` : Number(value).toString(16))).join('');
};

const defaultTimeSyncCheck = async (): Promise<boolean | null> => {
  if (process.platform !== 'linux') return null;
  try {
    const { stdout } = await execFileAsync('timedatectl', ['show', '-p', 'NTPSynchronized', '--value'], { timeout: 2000 });
    const value = stdout.trim();
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return null;
  } catch {
    return null;
  }
};

/** Stable installation id, shared by all snapshot pushes from this hub data directory. */
export const readOrCreateHubId = (dataDirectory: string): string => {
  const file = path.join(dataDirectory, HUB_ID_FILE);
  if (existsSync(file)) {
    const value = readFileSync(file, 'utf8').trim();
    if (value) return value;
  }

  const id = randomUUID();
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  writeFileSync(file, `${id}\n`, { mode: 0o600 });
  chmodSync(file, 0o600);
  return id;
};

/**
 * Pushes the latest dashboard state of every device to the Vuesp cloud.
 * Only the current snapshot is kept locally: no history and no queue of
 * measurements. Failures keep the dirty devices and retry with backoff.
 */
export class TelemetrySender {
  readonly hubId: string;
  readonly hubName: string;

  readonly #getDeviceModel: TelemetrySenderOptions['getDeviceModel'];
  readonly #url: string;
  readonly #token: string;
  readonly #debounceMs: number;
  readonly #maxBackoffMs: number;
  readonly #fetch: typeof fetch;
  readonly #now: () => number;
  readonly #timeSyncCheck: () => Promise<boolean | null>;
  readonly #transport: TelemetrySenderOptions['transport'];

  readonly #states = new Map<string, PendingSnapshot>();
  readonly #dirty = new Set<string>();

  #timer: ReturnType<typeof setTimeout> | undefined;
  #sending = false;
  #stopped = true;
  #backoff = 0;
  #timeSync: { value: boolean | null; at: number } | undefined;

  constructor({
    runtime,
    getDeviceModel,
    dataDirectory,
    url,
    token,
    hubName,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    maxBackoffMs = DEFAULT_MAX_BACKOFF_MS,
    fetchImpl = fetch,
    now = Date.now,
    timeSyncCheck = defaultTimeSyncCheck,
    transport,
  }: TelemetrySenderOptions) {
    this.#runtime = runtime;
    this.#getDeviceModel = getDeviceModel;
    this.#url = url.replace(/\/+$/, '');
    this.#token = token;
    this.#debounceMs = debounceMs;
    this.#maxBackoffMs = maxBackoffMs;
    this.#fetch = fetchImpl;
    this.#now = now;
    this.#timeSyncCheck = timeSyncCheck;
    this.#transport = transport;
    this.hubId = readOrCreateHubId(dataDirectory);
    this.hubName = hubName?.trim() || hostname();
  }

  readonly #runtime: TelemetryEventSource;

  start(): void {
    if (!this.#stopped) return;
    this.#stopped = false;
    this.#runtime.on('data', this.#onData);
  }

  stop(): void {
    this.#stopped = true;
    this.#runtime.off('data', this.#onData);
    if (this.#timer) {
      clearTimeout(this.#timer);
      this.#timer = undefined;
    }
  }

  /** Latest aggregated state for a device; used to resolve an action on the hub. */
  getState(ip: string): TelemetryDeviceState | undefined {
    return this.#states.get(ip)?.state;
  }

  /** Republish every known device, e.g. after a reconnect or a dashboard config change. */
  resend(): void {
    if (this.#stopped) return;
    for (const ip of this.#states.keys()) this.#dirty.add(ip);
    this.#schedule(this.#debounceMs);
  }

  readonly #onData = (payload: unknown): void => {
    if (!isDeviceEventPayload(payload) || payload.event !== 'message' || !payload.key) return;
    if (typeof payload.ip !== 'string' || !payload.ip) return;

    const pending = this.#states.get(payload.ip) ?? { state: emptyState(), updatedAt: 0 };
    const name = payload.key.toLowerCase();
    const data = payload.data;

    if (isRecordValue(data)) {
      if (name === 'port') pending.state.ports[String(data.gpio)] = data;
      else if (name === 'dallas') pending.state.dallas[dallasAddress(data)] = data;
      else if (name === 'message') pending.state.slots[String(data.index ?? 0)] = data;
      else pending.state[name] = data;
    } else if (data !== undefined) {
      pending.state[name] = data;
    }

    pending.updatedAt = this.#now();
    this.#states.set(payload.ip, pending);
    this.#dirty.add(payload.ip);
    this.#schedule(this.#debounceMs);
  };

  #schedule(delay: number): void {
    if (this.#stopped || this.#timer) return;
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      void this.flush();
    }, delay);
    this.#timer.unref?.();
  }

  async #checkTimeSync(): Promise<boolean | null> {
    const cached = this.#timeSync;
    if (cached && this.#now() - cached.at < TIME_SYNC_CACHE_MS) return cached.value;

    let value: boolean | null = null;
    try {
      value = await this.#timeSyncCheck();
    } catch {
      value = null;
    }
    this.#timeSync = { value, at: this.#now() };
    return value;
  }

  async #collect(pending: Map<string, number>): Promise<TelemetryDevicePayload[]> {
    const model = await this.#getDeviceModel();
    const registry = new Map(model.getAll().map(device => [device.ip, device]));
    const devices: TelemetryDevicePayload[] = [];

    for (const [ip, updatedAt] of pending) {
      const record = registry.get(ip);
      const snapshot = this.#states.get(ip);
      if (!record || !snapshot) continue;

      devices.push({
        deviceId: record.uuid,
        name: record.name || ip,
        ip,
        observedAt: updatedAt,
        state: snapshot.state,
      });
    }

    return devices;
  }

  /** Sends the dirty devices now; used by the debounce timer and by tests. */
  async flush(): Promise<{ sent: number }> {
    if (this.#stopped || this.#sending || this.#dirty.size === 0) return { sent: 0 };

    const timeSync = await this.#checkTimeSync();
    if (timeSync === false) {
      // Never upload values observed while the OS clock is not synchronized.
      this.#schedule(this.#maxBackoffMs);
      return { sent: 0 };
    }

    const pending = new Map([...this.#dirty].map(ip => [ip, this.#states.get(ip)?.updatedAt ?? 0]));
    this.#sending = true;

    try {
      const devices = await this.#collect(pending);
      if (!devices.length) {
        for (const ip of pending.keys()) this.#dirty.delete(ip);
        return { sent: 0 };
      }

      const payload: TelemetryPayload = {
        hubId: this.hubId,
        hubName: this.hubName,
        observedAt: Math.max(...devices.map(device => device.observedAt)),
        devices,
      };

      if (this.#transport) {
        await this.#transport(payload);
      } else {
        const response = await this.#fetch(`${this.#url}/telemetry/snapshots`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${this.#token}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }

      for (const [ip, updatedAt] of pending) {
        if (this.#states.get(ip)?.updatedAt === updatedAt) this.#dirty.delete(ip);
      }
      this.#backoff = 0;
      return { sent: devices.length };
    } catch (error) {
      this.#backoff = this.#backoff ? Math.min(this.#backoff * 2, this.#maxBackoffMs) : 2000;
      console.warn(`Cloud telemetry push failed: ${error instanceof Error ? error.message : String(error)}`);
      this.#schedule(this.#backoff);
      return { sent: 0 };
    } finally {
      this.#sending = false;
    }
  }
}
