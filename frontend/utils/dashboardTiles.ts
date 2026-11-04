import { buildDashboardCommands, resolveDashboardItem } from 'vuesp-dashboard-core';
import type { DashboardEvaluator, DashboardItem, ResolvedDashboardItem } from 'vuesp-dashboard-core';

import { isRecordValue } from '../../shared/device.ts';

export interface DashboardCommand {
  comm: string;
  data: Record<string, unknown>;
}

const evaluate: DashboardEvaluator = (body, v, a, b, c) => new Function('v', 'a', 'b', 'c', body)(v, a, b, c);

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

export const resolveTiles = (items: DashboardItem[], main: unknown): ResolvedDashboardItem[] =>
  items.map(item => resolveDashboardItem(item, main, evaluate));

const isMessageKey = (value: unknown): value is string =>
  typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,64}$/.test(value);

/**
 * Decoded device state contains a numeric `key` field (the protocol message
 * id). `set` expressions spread that state, so a numeric key in the result is
 * device state, not a message name: it must be ignored.
 */
const commandKey = (item: DashboardItem, result: Record<string, unknown>): string => {
  if (isMessageKey(result.key)) return result.key;
  const root = (item.args?.[0] ?? '').split('.')[0]?.toLowerCase() ?? '';
  return messageKeys[root] ?? (root ? root.toUpperCase() : '');
};

/**
 * Turns a tile interaction into device messages. The `set` expression of a
 * dashboard item may return either a plain payload or a `{ key, object }`
 * pair; when the key is absent it is derived from the item `args` path.
 */
export const buildTileCommands = (item: DashboardItem, value: unknown, main: unknown): DashboardCommand[] => {
  const result = buildDashboardCommands(item, value, main, evaluate);
  const results = Array.isArray(result) ? result : [result];
  const commands: DashboardCommand[] = [];

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
