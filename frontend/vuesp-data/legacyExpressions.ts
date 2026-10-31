type Setter = (source: unknown, value: unknown) => Record<string, unknown>;
type Transform = (value: unknown) => unknown;

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? Object.fromEntries(Object.entries(value)) : {};

const identity: Transform = value => value;
const setExpressions = new Map<string, Setter>([
  ['({ ...a, value: v, command: 2})', (source, value) => ({ ...asRecord(source), value, command: 2 })],
  ['({ ...a, now: v, command: 1})', (source, value) => ({ ...asRecord(source), now: value, command: 1 })],
  ['({ ...a, list: v, command: 1})', (source, value) => ({ ...asRecord(source), list: value, command: 1 })],
  ['({ ...a, message: `${v}`, command: 1})', (source, value) => ({ ...asRecord(source), message: String(value), command: 1 })],
]);
const formatterExpressions = new Map<string, Transform>([
  ['v', identity],
  ["v ? 'ON' : 'OFF'", value => value ? 'ON' : 'OFF'],
  ['`${v} ℃`', value => `${value} ℃`],
  [
    'new Date(v * 1000).toLocaleDateString()',
    value => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return value;
      const date = new Date(value * 1000);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
    },
  ],
]);

const settersByFunction = new Map<Setter, string>([...setExpressions].map(([expression, transform]) => [transform, expression]));
const formattersByFunction = new Map<Transform, string>([...formatterExpressions].map(([expression, transform]) => [transform, expression]));

export const legacySetterFromString = (expression: string): Setter | undefined => setExpressions.get(expression.trim());
export const legacySetterToString = (transform: Setter): string | undefined => settersByFunction.get(transform);

export const legacyGetterFromString = (expression: string): Transform | undefined =>
  expression.trim() === 'a' ? identity : undefined;
export const legacyGetterToString = (transform: Transform): string | undefined =>
  transform === identity ? 'a' : undefined;

export const legacyFormatterFromString = (expression: string): Transform | undefined =>
  formatterExpressions.get(expression.trim());
export const legacyFormatterToString = (transform: Transform): string | undefined =>
  formattersByFunction.get(transform);

export const applyLegacyFormatter = (expression: string | undefined, value: unknown): unknown => {
  if (expression === undefined) return value;
  const transform = legacyFormatterFromString(expression);
  return transform ? transform(value) : value;
};
