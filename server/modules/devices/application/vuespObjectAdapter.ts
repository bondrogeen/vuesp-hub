import type { DeviceRuntime } from '@core/application/deviceRuntime.ts';
import { ObjectRegistry, entityFromTile } from '@core/application/objectRegistry.ts';
import type { IDeviceConnectionRecord } from '@root/shared/device.ts';
import { resolveTilesSafe } from '@root/shared/dashboardTiles.ts';
import type { IDashboardItem, IResolvedDashboardItem } from 'vuesp-dashboard-core';

interface IListEntry {
  id?: number;
  uuid?: string;
  ip: string;
  name: string;
  list?: unknown[];
  enums?: Record<string, Record<string, number>>;
}

interface IDeviceEvent {
  event?: string;
  id?: string | number;
  uuid?: string;
  ip?: string;
}

const COALESCE_MS = 100;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const dallasAddress = (data: Record<string, unknown>): string => {
  const address = data.address;
  if (!Array.isArray(address)) return String(address ?? '');
  return address
    .map(value => typeof value === 'number' && value < 16 ? `0${value.toString(16)}` : Number(value).toString(16))
    .join('');
};

/** Mirrors the web store: dashboard args use lower-case collections. */
export const normalizeState = (state: Record<string, unknown>): Record<string, unknown> => {
  const main: Record<string, unknown> = { ports: {}, dallas: {}, slots: {}, ...state };
  const ports = main.ports as Record<string, unknown>;
  const dallas = main.dallas as Record<string, unknown>;
  const slots = main.slots as Record<string, unknown>;

  for (const [key, value] of Object.entries(state)) {
    const name = key.toLowerCase();
    if (name === 'port' && isRecord(value)) {
      ports[String(value.gpio ?? 0)] = value;
    } else if (name === 'dallas' && isRecord(value)) {
      dallas[dallasAddress(value)] = value;
    } else if (name === 'message' && isRecord(value)) {
      slots[String(value.index ?? 0)] = value;
    } else {
      main[name] = value;
    }
  }
  return main;
};

/**
 * Bridges device transport events into the normalized ObjectRegistry.
 * Coalescing is intentionally local and bounded; a full ingest pipeline will
 * replace it in the next step.
 */
export interface IVuespObjectAdapterOptions {
  onChange?: (entityId: string) => void;
}

export const attachVuespObjects = (
  runtime: DeviceRuntime<IDeviceConnectionRecord>,
  registry = new ObjectRegistry(),
  { onChange }: IVuespObjectAdapterOptions = {},
): { registry: ObjectRegistry; detach: () => void } => {
  const online = new Map<string, boolean>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const dirtyPaths = new Map<string, Set<string>>();

  const changedPath = (payload: IDeviceEvent): string | null => {
    const key = String((payload as IDeviceEvent & { key?: unknown }).key ?? '').toUpperCase();
    const data = (payload as IDeviceEvent & { data?: Record<string, unknown> }).data;
    if (!data) return null;
    if (key === 'DEVICE') return 'device';
    if (key === 'INFO') return 'info';
    if (key === 'PORT' && Number.isInteger(data.gpio)) return `ports.${String(data.gpio)}`;
    if (key === 'DALLAS' && Array.isArray(data.address)) {
      const address = data.address
        .map(value => typeof value === 'number' && value < 16 ? `0${value.toString(16)}` : Number(value).toString(16))
        .join('');
      return `dallas.${address}`;
    }
    return null;
  };

  const pathMatches = (arg: string, path: string): boolean =>
    arg === path || arg.startsWith(`${path}.`) || path.startsWith(`${arg}.`);

  const dirtyTiles = (items: IDashboardItem[], paths: Set<string>): IDashboardItem[] =>
    items.filter(item => item.args.some(arg => [...paths].some(path => pathMatches(arg, path))));

  const findEntry = (payload: IDeviceEvent): IListEntry | null => {
    const list = runtime.getList() as IListEntry[];
    return list.find(entry =>
      (payload.uuid && entry.uuid === payload.uuid)
      || (payload.ip && entry.ip === payload.ip)
      || (payload.id !== undefined && entry.id === Number(payload.id)),
    ) ?? null;
  };

  const sync = (deviceId: string, entry: IListEntry, isOnline: boolean, paths?: Set<string>): void => {
    try {
      const state = normalizeState(runtime.getState(entry.ip) ?? {});
      const items = (entry.list ?? []) as IDashboardItem[];
      const source = paths?.size ? dirtyTiles(items, paths) : items;
      const tiles = resolveTilesSafe(source, state, entry.enums);
      const seen = new Set<string>();
      const entities = tiles
        .filter((tile: IResolvedDashboardItem) => {
          if (seen.has(tile.id)) return false;
          seen.add(tile.id);
          return true;
        })
        .map((tile: IResolvedDashboardItem) => entityFromTile(tile, { deviceId, online: isOnline }));
      registry.upsertDevice({
        deviceId,
        ...(entry.id === undefined ? {} : { legacyId: entry.id }),
        name: entry.name,
        ip: entry.ip,
        online: isOnline,
      });
      if (paths?.size) registry.upsertEntities(deviceId, entities);
      else registry.syncEntities(deviceId, entities);
    } catch {
      // A broken dashboard must not take down the device transport.
    }
  };

  const schedule = (payload: IDeviceEvent, immediate = false): void => {
    const entry = findEntry(payload);
    if (!entry) return;
    const deviceId = String(entry.uuid ?? entry.id ?? entry.ip);
    const isOnline = online.get(deviceId) ?? false;
    const existing = timers.get(deviceId);
    if (existing) clearTimeout(existing);
    if (payload.event === 'open') dirtyPaths.delete(deviceId);
    const path = changedPath(payload);
    if (path) {
      const set = dirtyPaths.get(deviceId) ?? new Set<string>();
      set.add(path);
      dirtyPaths.set(deviceId, set);
    }
    if (immediate) {
      timers.delete(deviceId);
      sync(deviceId, entry, isOnline);
      dirtyPaths.delete(deviceId);
      return;
    }
    timers.set(deviceId, setTimeout(() => {
      timers.delete(deviceId);
      const paths = dirtyPaths.get(deviceId);
      dirtyPaths.delete(deviceId);
      sync(deviceId, entry, online.get(deviceId) ?? false, paths);
    }, COALESCE_MS));
  };

  const onData = (payload: IDeviceEvent): void => {
    const entry = findEntry(payload);
    if (!entry) return;
    const deviceId = String(entry.uuid ?? entry.id ?? entry.ip);

    if (payload.event === 'open') online.set(deviceId, true);
    if (payload.event === 'close' || payload.event === 'error') online.set(deviceId, false);
    if (payload.event === 'message') online.set(deviceId, true);

    if (payload.event === 'open' || payload.event === 'message') schedule(payload);
    if (payload.event === 'close' || payload.event === 'error') schedule(payload, true);
  };

  runtime.on('data', onData);
  const unsubscribe = registry.subscribe(change => {
    if (change.type === 'entity') onChange?.(`${change.deviceId}/${change.entityKey}`);
  });

  return {
    registry,
    detach: () => {
      runtime.off('data', onData);
      unsubscribe();
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      dirtyPaths.clear();
    },
  };
};
