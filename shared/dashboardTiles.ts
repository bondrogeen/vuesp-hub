import { buildDashboardCommands, resolveDashboardItem } from 'vuesp-dashboard-core';
import type {
  TDashboardEvaluator,
  IDashboardItem,
  IDashboardItemOptions,
  IResolvedDashboardItem,
} from 'vuesp-dashboard-core';

import { isRecordValue } from './device.ts';

export interface IDashboardCommand {
  comm: string;
  data: Record<string, unknown>;
}

/**
 * The only tile shape that is allowed to leave the hub. Expressions (`get`,
 * `set`, `args`) and raw device state stay on the hub; the cloud and LK receive
 * a resolved presentation value plus the metadata needed to render a card.
 *
 * `key` is unique across the hub: dashboard item ids are not unique inside a
 * device dashboard (`device.status3` appears twice on the BMS), so the hub
 * derives a stable key from the device id and the item index.
 */
export interface IPublicDashboardTile {
  key: string;
  id: string;
  name: string;
  type: string;
  entityType: string;
  icon?: string;
  /** Icon name from the shared VisionIcon set, used identically by hub and LK. */
  viewIcon: string;
  opts?: IDashboardItemOptions;
  value?: unknown;
  valueTo?: unknown;
}

export interface ICloudTileGroup {
  deviceId: string;
  name: string;
  ip: string;
  online: boolean;
  tiles: IPublicDashboardTile[];
}

export interface ICloudTilesResult {
  devices: ICloudTileGroup[];
  selected: string[];
  max: number;
}

/**
 * Single source of truth for tile icons. The hub renders this mapping through
 * `VisionIcon`, and the same value is published as `viewIcon` so LK (and any
 * other client) renders exactly the same glyph.
 */
export const tileViewIcon = (icon?: string): string => icon || 'box';

const evaluate: TDashboardEvaluator = (body, scope) => {
  const fn = new Function(...Object.keys(scope), body);

  return fn(...Object.values(scope));
};

/** Maps the first path segment of dashboard `args` to the device message key. */
const messageKeys: Record<string, string> = {
  device: 'DEVICE',
  ports: 'PORT',
  info: 'INFO',
  dallas: 'DALLAS',
  discovery: 'DISCOVERY',
  settings: 'SETTINGS',
  buffer: 'BUFFER',
  progress: 'PROGRESS',
  message: 'MESSAGE',
  slots: 'MESSAGE',
};

export const resolveTiles = (items: IDashboardItem[], main: unknown): IResolvedDashboardItem[] =>
  items.map(item => resolveDashboardItem(item, main, evaluate));

/**
 * Resolves dashboard items for publication. A single broken expression must
 * not hide the whole device dashboard, so bad tiles are skipped individually.
 */
export const resolvePublicTiles = (items: unknown, main: unknown, deviceId = ''): IPublicDashboardTile[] => {
  if (!Array.isArray(items)) return [];

  const tiles: IPublicDashboardTile[] = [];
  items.forEach((item, index) => {
    if (!isRecordValue(item)) return;
    try {
      const key = `${deviceId}:${index}`;
      tiles.push(toPublicTile(resolveDashboardItem(item as unknown as IDashboardItem, main, evaluate), key));
    } catch {
      // Skip a tile that cannot be resolved against the current state.
    }
  });
  return tiles;
};

export const toPublicTile = (tile: IResolvedDashboardItem, key?: string): IPublicDashboardTile => {
  const result: IPublicDashboardTile = {
    key: key ?? tile.id,
    id: tile.id,
    name: tile.name,
    type: tile.type,
    entityType: tile.entityType,
    viewIcon: tileViewIcon(tile.icon),
  };
  if (tile.icon !== undefined) result.icon = tile.icon;
  if (tile.opts !== undefined) result.opts = tile.opts;
  if (tile.value !== undefined) result.value = tile.value;
  if (tile.valueTo !== undefined) result.valueTo = tile.valueTo;
  return result;
};

const isMessageKey = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,64}$/.test(value);

/**
 * Decoded device state contains a numeric `key` field (the protocol message
 * id). `set` expressions spread that state, so a numeric key in the result is
 * device state, not a message name: it must be ignored.
 */
const commandKey = (item: IDashboardItem, result: Record<string, unknown>): string => {
  if (isMessageKey(result.key)) return result.key;
  const root = (item.args?.[0] ?? '').split('.')[0]?.toLowerCase() ?? '';
  return messageKeys[root] ?? (root ? root.toUpperCase() : '');
};

/**
 * Turns a tile interaction into device messages. The `set` expression of a
 * dashboard item may return either a plain payload or a `{ key, object }`
 * pair; when the key is absent it is derived from the item `args` path.
 */
export const buildTileCommands = (item: IDashboardItem, value: unknown, main: unknown): IDashboardCommand[] => {
  const result = buildDashboardCommands(item, value, main, evaluate);
  const results = Array.isArray(result) ? result : [result];
  const commands: IDashboardCommand[] = [];

  for (const entry of results) {
    if (!isRecordValue(entry)) continue;

    const nested = isRecordValue(entry.object) && entry.key !== undefined ? entry.object : undefined;
    const comm = commandKey(item, entry);
    if (!comm) continue;

    const data: Record<string, unknown> = { ...(nested ?? entry) };
    delete data.key;
    delete data.object;
    commands.push({ comm, data });
  }

  return commands;
};
