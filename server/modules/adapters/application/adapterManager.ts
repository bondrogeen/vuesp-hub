import type {
  IAdapterCommand,
  IAdapterHealth,
  IAdapterResult,
  IDeviceAdapter,
  IDeviceDescriptor,
} from '@core/application/deviceAdapter.ts';
import { ObjectRegistry, type IEntity } from '@core/application/objectRegistry.ts';

export interface IAdapterManagerHealth {
  status: 'starting' | 'ready' | 'degraded' | 'stopped' | 'error';
  adapters: Record<string, IAdapterHealth>;
}

export interface IAdapterQueueStats {
  pending: number;
  inFlight: number;
  completed: number;
  failed: number;
  rejected: number;
  timedOut: number;
  maxPending: number;
}

export interface IAdapterManagerOptions {
  /** Waiting commands per device; the in-flight command is not counted. */
  queueLimit?: number;
  executeTimeoutMs?: number;
}

interface IQueuedCommand {
  command: IAdapterCommand;
  resolve: (result: IAdapterResult) => void;
}

interface IDeviceQueue {
  inFlight: boolean;
  items: IQueuedCommand[];
}

class AdapterTimeoutError extends Error {}

const DEFAULT_QUEUE_LIMIT = 32;
const DEFAULT_TIMEOUT_MS = 10_000;

export class AdapterManager {
  private readonly registry: ObjectRegistry;
  private readonly adapters = new Map<string, IDeviceAdapter>();
  private readonly devices = new Map<string, string>();
  private readonly subscriptions = new Map<string, () => void>();
  private readonly queues = new Map<string, IDeviceQueue>();
  private readonly queueLimit: number;
  private readonly executeTimeoutMs: number;
  private readonly stats = {
    completed: 0,
    failed: 0,
    rejected: 0,
    timedOut: 0,
    maxPending: 0,
  };

  constructor(registry: ObjectRegistry, { queueLimit = DEFAULT_QUEUE_LIMIT, executeTimeoutMs = DEFAULT_TIMEOUT_MS }: IAdapterManagerOptions = {}) {
    if (!Number.isInteger(queueLimit) || queueLimit < 0) throw new TypeError('queueLimit must be a non-negative integer');
    if (!Number.isInteger(executeTimeoutMs) || executeTimeoutMs < 1) throw new TypeError('executeTimeoutMs must be positive');
    this.registry = registry;
    this.queueLimit = queueLimit;
    this.executeTimeoutMs = executeTimeoutMs;
  }

  register(adapter: IDeviceAdapter): void {
    if (this.adapters.has(adapter.id)) throw new Error(`Adapter already registered: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }

  async startAll(): Promise<void> {
    for (const [id, adapter] of this.adapters) {
      await adapter.start();
      this.subscriptions.set(id, adapter.onEvent(() => {
        void this.syncAdapter(adapter).catch(() => undefined);
      }));
      await this.syncAdapter(adapter);
    }
  }

  async stopAll(): Promise<void> {
    for (const queue of this.queues.values()) {
      for (const item of queue.items) item.resolve({ ok: false, error: 'Adapter stopped' });
      queue.items = [];
    }
    this.queues.clear();
    for (const [id, adapter] of this.adapters) {
      this.subscriptions.get(id)?.();
      this.subscriptions.delete(id);
      await adapter.stop();
    }
    this.devices.clear();
  }

  list(): IDeviceAdapter[] {
    return [...this.adapters.values()];
  }

  /** Device id → adapter id, for diagnostics and the system page. */
  assignments(): Record<string, string> {
    return Object.fromEntries(this.devices);
  }

  async execute(deviceId: string, entityKey: string, value: unknown, requestId: string): Promise<IAdapterResult> {
    const adapterId = this.devices.get(deviceId);
    const adapter = adapterId ? this.adapters.get(adapterId) : undefined;
    if (!adapter) return { ok: false, error: `No adapter for device ${deviceId}` };
    return this.enqueue(deviceId, adapter, { requestId, deviceId, entityKey, value });
  }

  queueStats(): IAdapterQueueStats {
    let pending = 0;
    let inFlight = 0;
    for (const queue of this.queues.values()) {
      pending += queue.items.length;
      if (queue.inFlight) inFlight += 1;
    }
    return { ...this.stats, pending, inFlight };
  }

  async health(): Promise<IAdapterManagerHealth> {
    const adapters: Record<string, IAdapterHealth> = {};
    for (const [id, adapter] of this.adapters) adapters[id] = await adapter.health();
    const statuses = Object.values(adapters).map(health => health.status);
    if (!statuses.length) return { status: 'stopped', adapters };
    return {
      status: statuses.some(status => status === 'error') ? 'degraded' : statuses.every(status => status === 'ready') ? 'ready' : 'starting',
      adapters,
    };
  }

  private enqueue(deviceId: string, adapter: IDeviceAdapter, command: IAdapterCommand): Promise<IAdapterResult> {
    const queue = this.queues.get(deviceId) ?? { inFlight: false, items: [] };
    this.queues.set(deviceId, queue);

    return new Promise<IAdapterResult>(resolve => {
      const canStartImmediately = !queue.inFlight && queue.items.length === 0;
      if (!canStartImmediately && queue.items.length >= this.queueLimit) {
        this.stats.rejected += 1;
        resolve({ ok: false, error: 'Adapter queue is full' });
        return;
      }
      queue.items.push({ command, resolve });
      this.stats.maxPending = Math.max(this.stats.maxPending, queue.items.length);
      void this.drain(deviceId, adapter, queue);
    });
  }

  private async drain(deviceId: string, adapter: IDeviceAdapter, queue: IDeviceQueue): Promise<void> {
    if (queue.inFlight) return;
    queue.inFlight = true;
    try {
      while (queue.items.length) {
        const item = queue.items.shift()!;
        let result: IAdapterResult;
        try {
          result = await this.withTimeout(adapter.execute(item.command));
        } catch (error) {
          result = { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
        if (result.ok) this.stats.completed += 1;
        else this.stats.failed += 1;
        item.resolve(result);
      }
    } finally {
      queue.inFlight = false;
      if (!queue.items.length) this.queues.delete(deviceId);
    }
  }

  private async withTimeout(execution: Promise<IAdapterResult>): Promise<IAdapterResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        execution,
        new Promise<IAdapterResult>((_, reject) => {
          timer = setTimeout(() => reject(new AdapterTimeoutError(`Adapter command timed out after ${this.executeTimeoutMs}ms`)), this.executeTimeoutMs);
          timer.unref?.();
        }),
      ]);
    } catch (error) {
      if (error instanceof AdapterTimeoutError) {
        this.stats.timedOut += 1;
        return { ok: false, error: error.message };
      }
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async syncAdapter(adapter: IDeviceAdapter): Promise<void> {
    const devices = await adapter.listDevices();
    for (const device of devices) {
      this.devices.set(device.deviceId, adapter.id);
      this.registry.upsertDevice({
        deviceId: device.deviceId,
        ...(device.legacyId === undefined ? {} : { legacyId: device.legacyId }),
        name: device.name,
        ip: device.ip ?? device.deviceId,
        online: device.online,
      });
      this.registry.syncEntities(device.deviceId, device.entities.map(entity => this.toEntity(device, entity)));
    }
  }

  private toEntity(device: IDeviceDescriptor, value: IDeviceDescriptor['entities'][number]): IEntity {
    const now = Date.now();
    const present = value.value !== undefined;
    const get = present
      ? {
          value: value.value,
          ...(value.display === undefined ? {} : { display: value.display }),
          status: device.online ? 'live' as const : 'stale' as const,
          updatedAt: now,
          lastChanged: now,
        }
      : undefined;
    return {
      id: `${device.deviceId}/${value.key}`,
      deviceId: device.deviceId,
      key: value.key,
      name: value.name,
      type: value.type,
      entityType: value.entityType ?? value.type,
      available: device.online && value.available !== false,
      ...(get ? { get } : {}),
      set: {
        kind: 'native',
        pending: false,
        status: 'idle',
        ack: 'none',
        queue: false,
      },
    };
  }
}
