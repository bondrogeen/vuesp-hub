import type {
  IAutomationRule,
  TAutomationAction,
  TAutomationCondition,
  TAutomationMode,
  TAutomationTrigger,
} from '@server/modules/automations/application/automationEngine.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const string = (value: unknown, field: string, max = 256): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new TypeError(`${field} is invalid`);
  return value.trim();
};

const trigger = (value: unknown): TAutomationTrigger => {
  if (!isRecord(value)) throw new TypeError('trigger must be an object');
  if (value.type === 'state') return { type: 'state', entityId: string(value.entityId, 'trigger.entityId'), ...(value.to === undefined ? {} : { to: value.to }), ...(value.from === undefined ? {} : { from: value.from }) };
  if (value.type === 'time') {
    if (typeof value.everyMs !== 'number' && typeof value.at !== 'string') throw new TypeError('time trigger needs everyMs or at');
    return { type: 'time', ...(typeof value.everyMs === 'number' ? { everyMs: value.everyMs } : {}), ...(typeof value.at === 'string' ? { at: value.at } : {}) };
  }
  if (value.type === 'event') return { type: 'event', ...(typeof value.event === 'string' ? { event: value.event } : {}) };
  if (value.type === 'manual') return { type: 'manual' };
  throw new TypeError('trigger.type is invalid');
};

const condition = (value: unknown): TAutomationCondition => {
  if (!isRecord(value)) throw new TypeError('condition must be an object');
  if (value.type === 'and' || value.type === 'or') {
    if (!Array.isArray(value.items)) throw new TypeError('condition.items must be an array');
    return { type: value.type, items: value.items.map(condition) };
  }
  if (value.type === 'compare') {
    const op = value.op;
    if (!['==', '!=', '>', '>=', '<', '<='].includes(String(op))) throw new TypeError('condition.op is invalid');
    return { type: 'compare', entityId: string(value.entityId, 'condition.entityId'), op: op as '==' | '!=' | '>' | '>=' | '<' | '<=' , value: value.value };
  }
  if (value.type === 'history') {
    return { type: 'history', entityId: string(value.entityId, 'condition.entityId'), op: String(value.op ?? '=='), value: value.value, windowMs: typeof value.windowMs === 'number' ? value.windowMs : 3_600_000 };
  }
  throw new TypeError('condition.type is invalid');
};

const action = (value: unknown): TAutomationAction => {
  if (!isRecord(value)) throw new TypeError('action must be an object');
  if (value.type === 'set') return { type: 'set', deviceId: string(value.deviceId, 'action.deviceId'), entityKey: string(value.entityKey, 'action.entityKey'), value: value.value };
  if (value.type === 'scene') return { type: 'scene', sceneId: Number(value.sceneId) };
  if (value.type === 'notify') return { type: 'notify', level: value.level === 'warn' || value.level === 'error' ? value.level : 'info', text: string(value.text, 'action.text', 512) };
  if (value.type === 'delay') return { type: 'delay', ms: typeof value.ms === 'number' ? value.ms : 0 };
  if (value.type === 'script') return { type: 'script', scriptId: string(value.scriptId, 'action.scriptId') };
  throw new TypeError('action.type is invalid');
};

export const parseRuleInput = (value: unknown): Omit<IAutomationRule, 'id'> => {
  if (!isRecord(value)) throw new TypeError('Rule must be an object');
  const name = string(value.name, 'name', 64);
  const mode = value.mode;
  if (!['single', 'restart', 'queued'].includes(String(mode))) throw new TypeError('mode is invalid');
  if (!Array.isArray(value.conditions) || !Array.isArray(value.actions)) throw new TypeError('conditions and actions must be arrays');
  return {
    name,
    enabled: value.enabled !== false,
    mode: mode as TAutomationMode,
    trigger: trigger(value.trigger),
    conditions: value.conditions.map(condition),
    actions: value.actions.map(action),
    updatedAt: new Date().toISOString(),
  };
};

export const parseSceneInput = (value: unknown): { name: string; actions: TAutomationAction[] } => {
  if (!isRecord(value)) throw new TypeError('Scene must be an object');
  if (!Array.isArray(value.actions)) throw new TypeError('Scene actions must be an array');
  return { name: string(value.name, 'name', 64), actions: value.actions.map(action) };
};
