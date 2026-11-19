import type { IHistoryPoint, IHistoryStore } from '@core/application/historyStore.ts';
import type { IEntity, ObjectRegistry } from '@core/application/objectRegistry.ts';

export interface IHistoryRecorderOptions {
  registry: ObjectRegistry;
  history: IHistoryStore;
  minIntervalMs?: number;
  deadband?: number;
  flushMs?: number;
  maxBuffer?: number;
  onError?: (error: unknown) => void;
}

const isScalar = (value: unknown): value is number | boolean | string =>
  typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && value.length <= 256);

const statusOf = (entity: IEntity): 'live' | 'stale' | null => {
  if (entity.get?.status === 'live') return 'live';
  if (entity.get?.status === 'stale') return 'stale';
  return null;
};

export class HistoryRecorder {
  private readonly registry: ObjectRegistry;
  private readonly history: IHistoryStore;
  private readonly minIntervalMs: number;
  private readonly deadband: number;
  private readonly flushMs: number;
  private readonly maxBuffer: number;
  private readonly onError?: (error: unknown) => void;
  private readonly last = new Map<string, { at: number; value: unknown }>();
  private readonly buffer: IHistoryPoint[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private unsubscribe: (() => void) | undefined;

  constructor({ registry, history, minIntervalMs = 60_000, deadband = 0.1, flushMs = 2_000, maxBuffer = 200, onError }: IHistoryRecorderOptions) {
    this.registry = registry;
    this.history = history;
    this.minIntervalMs = minIntervalMs;
    this.deadband = deadband;
    this.flushMs = flushMs;
    this.maxBuffer = maxBuffer;
    this.onError = onError;
  }

  start(): void {
    this.unsubscribe = this.registry.subscribe(change => {
      if (change.type === 'entity') this.record(change.deviceId, change.entityKey);
    });
    this.timer = setInterval(() => void this.flush(), this.flushMs);
    this.timer.unref?.();
  }

  record(deviceId: string, entityKey: string): void {
    const entity = this.registry.getEntity(deviceId, entityKey);
    if (!entity?.get || !isScalar(entity.get.value)) return;
    const status = statusOf(entity);
    if (!status) return;

    const now = Date.now();
    const previous = this.last.get(entity.id);
    if (previous) {
      if (now - previous.at < this.minIntervalMs) return;
      if (typeof entity.get.value === 'number' && typeof previous.value === 'number' && Math.abs(entity.get.value - previous.value) < this.deadband) {
        return;
      }
      if (entity.get.value === previous.value) return;
    }

    this.last.set(entity.id, { at: now, value: entity.get.value });
    this.buffer.push({ entityId: entity.id, at: now, value: entity.get.value, status });
    if (this.buffer.length >= this.maxBuffer) void this.flush();
  }

  async flush(): Promise<void> {
    if (!this.buffer.length) return;
    const points = this.buffer.splice(0, this.buffer.length);
    try {
      await this.history.append(points);
    } catch (error) {
      this.buffer.unshift(...points);
      this.onError?.(error);
    }
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    await this.flush();
  }
}
