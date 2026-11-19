export interface IArea {
  id: number;
  name: string;
  icon?: string;
  order?: number;
}

export interface IAreaInput {
  name: string;
  icon?: string;
  order?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseAreaInput = (value: unknown): IAreaInput => {
  if (!isRecord(value)) throw new TypeError('Area must be an object');
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name || name.length > 64) throw new TypeError('Area name must contain 1 to 64 characters');
  const icon = typeof value.icon === 'string' && value.icon.length <= 64 ? value.icon : undefined;
  const order = typeof value.order === 'number' && Number.isInteger(value.order) ? value.order : undefined;
  return { name, ...(icon ? { icon } : {}), ...(order === undefined ? {} : { order }) };
};
