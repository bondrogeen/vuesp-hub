import type {
  IAdapterHealth,
  IDeviceAdapter,
  IDeviceDescriptor,
} from '@core/application/deviceAdapter.ts';
import { ObjectRegistry, type IEntity } from '@core/application/objectRegistry.ts';

export interface IAdapterManagerHealth {
  status: 'starting' | 'ready' | 'degraded' | 'stopped' | 'error';
  adapters: Record<string, IAdapterHealth>;
}

export class AdapterManager {
  private readonly registry: ObjectRegistry;
  private readonly adapters = new Map<string, IDeviceAdapter>();
  private readonly devices = new Map<string, string>();
  private readonly subscriptions = new Map<string, () => void>();

  constructor(registry: ObjectRegistry) {
    this.registry = registry;
  }

  register(adapter: IDeviceAdapter): void {
    if (this.adapters.has(adapter.id)) throw new Error(`Adapter already registered: ${adapter.id}`);
    this.adapters.set(adapter.id, adapter);
  }

  async startAll(): Promise<void> {
    for (const [id, adapter] of this.adapters) {
      await adapter.start();
      this.subscriptions.set(id, adapter.onEvent(event => {
        void this.syncAdapter(adapter).catch(() => undefined);
      }));
      await this.syncAdapter(adapter);
    }
  }

  async stopAll(): Promise<void> {
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

  async execute(deviceId: string, entityKey: string, value: unknown, requestId: string): Promise<{ ok: boolean; error?: string }> {
    const adapterId = this.devices.get(deviceId);
    const adapter = adapterId ? this.adapters.get(adapterId) : undefined;
    if (!adapter) return { ok: false, error: `No adapter for device ${deviceId}` };
    return adapter.execute({ requestId, deviceId, entityKey, value });
  }

  async health(): Promise<IAdapterManagerHealth> {
    const adapters: Record<string, IAdapterHealth> = {};
    for (const [id, adapter] of this.adapters) adapters[id] = await adapter.health();
    const statuses = Object.values(adapters).map(health => health.status);
    return {
      status: statuses.some(status => status === 'error') ? 'degraded' : statuses.every(status => status === 'ready') ? 'ready' : 'starting',
      adapters,
    };
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
