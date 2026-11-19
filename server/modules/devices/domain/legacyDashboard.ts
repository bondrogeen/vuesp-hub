export interface ILegacyDashboardItem {
  id: string;
  name: string;
  type: string;
  icon?: string;
  args: string[];
  opts?: {
    disabled?: number;
    min?: number;
    max?: number;
    step?: number;
    items?: Array<{ name: string; value: string }>;
  };
  set?: string;
  get?: string;
  getTo?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length <= 256 &&
  value.split('.').every(part => /^[A-Za-z0-9_-]+$/.test(part) && !['__proto__', 'prototype', 'constructor'].includes(part));

const optionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const sanitizeOptions = (value: unknown): ILegacyDashboardItem['opts'] | undefined => {
  if (!isRecord(value)) return undefined;
  const opts: NonNullable<ILegacyDashboardItem['opts']> = {};

  for (const key of ['disabled', 'min', 'max', 'step'] as const) {
    const number = optionalNumber(value[key]);
    if (number !== undefined) opts[key] = number;
  }

  if (Array.isArray(value.items)) {
    const items = value.items.slice(0, 100).flatMap(item => {
      if (!isRecord(item) || typeof item.name !== 'string' || typeof item.value !== 'string') return [];
      return [{ name: item.name.slice(0, 128), value: item.value.slice(0, 128) }];
    });
    opts.items = items;
  }

  return opts;
};

const sanitizeItem = (value: unknown): ILegacyDashboardItem | null => {
  if (!isRecord(value)) return null;
  const { id, name, type, icon, args, set, get, getTo } = value;
  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    id.length > 128 ||
    typeof type !== 'string' ||
    type.length > 32 ||
    !Array.isArray(args) ||
    args.length === 0 ||
    args.length > 4 ||
    !args.every(isPath)
  ) {
    return null;
  }

  for (const expression of [set, get, getTo]) {
    if (expression !== undefined && (typeof expression !== 'string' || expression.length > 512)) return null;
  }

  const opts = sanitizeOptions(value.opts);
  return {
    id,
    name: typeof name === 'string' && name.length <= 128 ? name : id,
    type,
    ...(typeof icon === 'string' && icon.length <= 64 ? { icon } : {}),
    args,
    ...(opts ? { opts } : {}),
    ...(typeof set === 'string' ? { set } : {}),
    ...(typeof get === 'string' ? { get } : {}),
    ...(typeof getTo === 'string' ? { getTo } : {}),
  };
};

export const parseLegacyDashboard = (value: unknown): ILegacyDashboardItem[] | null => {
  if (typeof value === 'string') {
    if (value.length > 256_000) return null;
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (isRecord(value) && value.schemaVersion !== undefined && value.schemaVersion !== 1) return null;
  const entries = Array.isArray(value) ? value : isRecord(value) ? value.dashboard : null;
  if (!Array.isArray(entries) || entries.length > 100) return null;

  const items: ILegacyDashboardItem[] = [];
  const ids = new Set<string>();
  for (const entry of entries) {
    const item = sanitizeItem(entry);
    if (!item) return null;
    // Dashboard ids are entity keys. Keep the first tile and skip a duplicate
    // instead of silently overwriting another entity/history stream.
    if (ids.has(item.id)) continue;
    ids.add(item.id);
    items.push(item);
  }
  return items;
};
