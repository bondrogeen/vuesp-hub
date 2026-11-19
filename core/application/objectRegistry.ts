import type { IResolvedDashboardItem } from 'vuesp-dashboard-core';

import type { IStateSnapshot } from './stateStore.ts';

export type TEntityStatus = 'live' | 'stale' | 'unknown' | 'error';

export interface IEntityError {
  code: string;
  message: string;
  at: number;
}

export interface IGetChannel {
  value?: unknown;
  display?: unknown;
  raw?: unknown;
  status: TEntityStatus;
  updatedAt: number;
  lastChanged: number;
  error?: IEntityError;
}

export interface ISetChannel {
  kind: 'expression' | 'native';
  requested?: unknown;
  requestedAt?: number;
  pending: boolean;
  status: 'idle' | 'pending' | 'error' | 'unavailable';
  ack: 'state' | 'none';
  queue: boolean;
  constraints?: {
    min?: number;
    max?: number;
    step?: number;
    items?: Array<{ name: string; value: string }>;
    disabled?: number;
    unit?: string;
  };
  error?: IEntityError;
}

export interface IEntity {
  id: string;
  deviceId: string;
  key: string;
  name: string;
  type: string;
  entityType: string;
  icon?: string;
  available: boolean;
  get?: IGetChannel;
  set?: ISetChannel;
  meta?: Record<string, unknown>;
}

export interface IRegisteredDevice {
  deviceId: string;
  legacyId?: number;
  name: string;
  ip: string;
  online: boolean;
  lastSeen: number;
  entities: Map<string, IEntity>;
}

export interface IDeviceRegistration {
  deviceId: string;
  legacyId?: number;
  name: string;
  ip: string;
  online?: boolean;
}

export type TRegistryChange =
  | { type: 'device'; deviceId: string }
  | { type: 'entity'; deviceId: string; entityKey: string };

const entityId = (deviceId: string, key: string): string => `${deviceId}/${key}`;

const isEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right) return false;
  if (left === null || right === null) return false;
  if (typeof left !== 'object') return false;
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

const hasValue = (value: unknown): boolean => value !== undefined && value !== '';

const statusOnSync = (online: boolean, present: boolean): TEntityStatus => {
  if (!present) return 'unknown';
  return online ? 'live' : 'stale';
};

export class ObjectRegistry {
  private readonly devices = new Map<string, IRegisteredDevice>();
  private readonly listeners = new Set<(change: TRegistryChange) => void>();

  upsertDevice(input: IDeviceRegistration): IRegisteredDevice {
    const existing = this.devices.get(input.deviceId);
    const now = Date.now();
    const online = input.online ?? existing?.online ?? false;
    const legacyId = input.legacyId ?? existing?.legacyId;
    const device: IRegisteredDevice = {
      deviceId: input.deviceId,
      ...(legacyId === undefined ? {} : { legacyId }),
      name: input.name,
      ip: input.ip,
      online,
      // While online, `lastSeen` tracks the latest successful sync; when
      // offline it keeps the moment the device was last reachable.
      lastSeen: online ? now : existing?.lastSeen ?? now,
      entities: existing?.entities ?? new Map(),
    };
    this.devices.set(input.deviceId, device);
    const changed = !existing
      || existing.name !== device.name
      || existing.ip !== device.ip
      || existing.online !== device.online
      || existing.legacyId !== device.legacyId;
    if (changed) this.emit({ type: 'device', deviceId: input.deviceId });
    return device;
  }

  removeDevice(deviceId: string): boolean {
    const removed = this.devices.delete(deviceId);
    if (removed) this.emit({ type: 'device', deviceId });
    return removed;
  }

  setOnline(deviceId: string, online: boolean): void {
    const device = this.devices.get(deviceId);
    if (!device) return;
    device.online = online;
    device.lastSeen = Date.now();
    for (const entity of device.entities.values()) {
      if (!entity.get) continue;
      entity.get.status = statusOnSync(online, hasValue(entity.get.value));
      entity.available = online && Boolean(entity.set) && !entity.set?.constraints?.disabled;
    }
    this.emit({ type: 'device', deviceId });
  }

  syncEntities(deviceId: string, entities: IEntity[]): void {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Device is not registered: ${deviceId}`);

    const next = new Map<string, IEntity>();
    for (const entity of entities) {
      if (next.has(entity.key)) throw new Error(`Duplicate entity key: ${entity.key}`);
      next.set(entity.key, this.mergeEntity(device, entity));
    }

    device.entities = next;
    for (const key of next.keys()) this.emit({ type: 'entity', deviceId, entityKey: key });
    this.emit({ type: 'device', deviceId });
  }

  /** Merge only changed entities; entities not present keep their state. */
  upsertEntities(deviceId: string, entities: IEntity[]): void {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error(`Device is not registered: ${deviceId}`);

    const seen = new Set<string>();
    for (const entity of entities) {
      if (seen.has(entity.key)) continue;
      seen.add(entity.key);
      device.entities.set(entity.key, this.mergeEntity(device, entity));
      this.emit({ type: 'entity', deviceId, entityKey: entity.key });
    }
    this.emit({ type: 'device', deviceId });
  }

  private mergeEntity(device: IRegisteredDevice, entity: IEntity): IEntity {
    const previous = device.entities.get(entity.key);
    const now = Date.now();
    const valueChanged = !previous?.get || !isEqual(previous.get.value, entity.get?.value);
    const get = entity.get
      ? {
          ...entity.get,
          updatedAt: entity.get.updatedAt ?? now,
          lastChanged: valueChanged ? entity.get.lastChanged ?? now : previous?.get?.lastChanged ?? now,
          status: statusOnSync(device.online, hasValue(entity.get.value)),
        }
      : undefined;

    return {
      ...entity,
      get,
      available: device.online && Boolean(entity.set) && !entity.set?.constraints?.disabled,
    };
  }

  updateEntity(deviceId: string, entityKey: string, patch: Partial<IEntity>): IEntity | null {
    const device = this.devices.get(deviceId);
    const current = device?.entities.get(entityKey);
    if (!device || !current) return null;
    const next: IEntity = { ...current, ...patch, id: current.id, deviceId, key: entityKey };
    device.entities.set(entityKey, next);
    this.emit({ type: 'entity', deviceId, entityKey });
    return next;
  }

  getEntity(deviceId: string, entityKey: string): IEntity | null {
    return this.devices.get(deviceId)?.entities.get(entityKey) ?? null;
  }

  listEntities(deviceId?: string): IEntity[] {
    if (deviceId) return [...(this.devices.get(deviceId)?.entities.values() ?? [])];
    return [...this.devices.values()].flatMap(device => [...device.entities.values()]);
  }

  getDevice(deviceId: string): IRegisteredDevice | null {
    return this.devices.get(deviceId) ?? null;
  }

  snapshot(): IRegisteredDevice[] {
    return [...this.devices.values()];
  }

  /** Restore last known values after restart; everything becomes stale. */
  restore(snapshot: IStateSnapshot): void {
    this.devices.clear();
    for (const stored of snapshot.devices) {
      const entities = new Map<string, IEntity>();
      for (const entity of stored.entities) {
        const get = entity.get
          ? {
              ...entity.get,
              status: hasValue(entity.get.value) ? 'stale' as const : 'unknown' as const,
            }
          : undefined;
        entities.set(entity.key, {
          ...entity,
          get,
          available: false,
          ...(entity.set ? { set: { ...entity.set, pending: false, status: 'idle' as const } } : {}),
        });
      }
      this.devices.set(stored.deviceId, {
        deviceId: stored.deviceId,
        ...(stored.legacyId === undefined ? {} : { legacyId: stored.legacyId }),
        name: stored.name,
        ip: stored.ip,
        online: false,
        lastSeen: stored.lastSeen,
        entities,
      });
    }
    this.emit({ type: 'device', deviceId: '*' });
  }

  /** Plain JSON view for REST/WS; Maps are not serializable. */
  snapshotView(deviceId?: string): { devices: Array<Omit<IRegisteredDevice, 'entities'> & { entities: IEntity[] }> } {
    const devices = deviceId
      ? [this.getDevice(deviceId)].filter((device): device is IRegisteredDevice => device !== null)
      : this.snapshot();
    return {
      devices: devices.map(device => ({
        ...device,
        entities: [...device.entities.values()],
      })),
    };
  }

  subscribe(listener: (change: TRegistryChange) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(change: TRegistryChange): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(change);
      } catch {
        // A bad subscriber must not break the registry.
      }
    }
  }
}

export const toEntityId = entityId;

export const entityFromTile = (
  tile: IResolvedDashboardItem,
  { deviceId, online }: { deviceId: string; online: boolean },
  now = Date.now(),
): IEntity => {
  const present = hasValue(tile.value);
  const get: IGetChannel | undefined = {
    ...(tile.value === undefined ? {} : { value: tile.value }),
    ...(present && tile.valueTo !== undefined ? { display: tile.valueTo } : {}),
    status: statusOnSync(online, present),
    updatedAt: now,
    lastChanged: now,
  };

  const set: ISetChannel | undefined = tile.set
    ? {
        kind: 'expression',
        pending: false,
        status: 'idle',
        ack: tile.get ? 'state' : 'none',
        queue: false,
        constraints: {
          ...(tile.opts?.min === undefined ? {} : { min: tile.opts.min }),
          ...(tile.opts?.max === undefined ? {} : { max: tile.opts.max }),
          ...(tile.opts?.step === undefined ? {} : { step: tile.opts.step }),
          ...(tile.opts?.items === undefined ? {} : { items: tile.opts.items }),
          ...(tile.opts?.disabled === undefined ? {} : { disabled: tile.opts.disabled }),
          ...(tile.opts?.unit === undefined ? {} : { unit: tile.opts.unit }),
        },
      }
    : undefined;

  return {
    id: entityId(deviceId, tile.id),
    deviceId,
    key: tile.id,
    name: tile.name,
    type: tile.type,
    entityType: tile.entityType,
    ...(tile.icon === undefined ? {} : { icon: tile.icon }),
    available: online && Boolean(set) && !tile.opts?.disabled,
    get,
    ...(set ? { set } : {}),
  };
};
