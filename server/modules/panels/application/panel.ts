export const PANEL_WIDGET_TYPES = ['info', 'button', 'dimmer', 'list', 'input', 'chart', 'custom'] as const;

export type TPanelWidgetType = (typeof PANEL_WIDGET_TYPES)[number];

export interface IPanelWidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IPanelWidget {
  id: string;
  type: TPanelWidgetType;
  entityId: string;
  pos: IPanelWidgetPosition;
  options?: Record<string, unknown>;
}

export interface IPanel {
  schemaVersion: number;
  id: number;
  name: string;
  areaId?: string;
  icon?: string;
  widgets: IPanelWidget[];
  updatedAt: string;
}

export interface IPanelInput {
  name: string;
  areaId?: string;
  icon?: string;
  widgets: IPanelWidget[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const optionalString = (value: unknown, field: string, max: number): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || value.length > max) throw new TypeError(`${field} is invalid`);
  return value;
};

const integer = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isInteger(value) ? value : fallback;

const parseWidget = (value: unknown, index: number): IPanelWidget => {
  if (!isRecord(value)) throw new TypeError(`widgets[${index}] must be an object`);
  const id = optionalString(value.id, 'widget id', 128);
  const entityId = optionalString(value.entityId, 'entityId', 256);
  const type = value.type;
  if (!id) throw new TypeError(`widgets[${index}].id is required`);
  if (!entityId || !entityId.includes('/')) throw new TypeError(`widgets[${index}].entityId is invalid`);
  if (typeof type !== 'string' || !PANEL_WIDGET_TYPES.includes(type as TPanelWidgetType)) {
    throw new TypeError(`widgets[${index}].type is invalid`);
  }

  const pos = isRecord(value.pos) ? value.pos : {};
  const x = Math.max(0, Math.min(11, integer(pos.x, 0)));
  const y = Math.max(0, Math.min(1_000, integer(pos.y, 0)));
  const w = Math.max(1, Math.min(12, integer(pos.w, 3)));
  const h = Math.max(1, Math.min(40, integer(pos.h, 2)));

  return {
    id,
    type: type as TPanelWidgetType,
    entityId,
    pos: { x, y, w, h },
    ...(isRecord(value.options) ? { options: value.options } : {}),
  };
};

export const parsePanelInput = (value: unknown): IPanelInput => {
  if (!isRecord(value)) throw new TypeError('Panel must be an object');
  const name = optionalString(value.name, 'name', 64);
  if (!name) throw new TypeError('Panel name is required');
  if (!Array.isArray(value.widgets)) throw new TypeError('Panel widgets must be an array');
  if (value.widgets.length > 100) throw new TypeError('A panel may contain at most 100 widgets');

  const widgets = value.widgets.map(parseWidget);
  const ids = new Set<string>();
  for (const widget of widgets) {
    if (ids.has(widget.id)) throw new TypeError(`Duplicate widget id: ${widget.id}`);
    ids.add(widget.id);
  }

  return {
    name,
    ...(optionalString(value.areaId, 'areaId', 128) ? { areaId: optionalString(value.areaId, 'areaId', 128) } : {}),
    ...(optionalString(value.icon, 'icon', 64) ? { icon: optionalString(value.icon, 'icon', 64) } : {}),
    widgets,
  };
};
