import { randomUUID } from 'node:crypto';

import type { ActionService } from '@core/application/actionService.ts';
import type { IHistoryStore } from '@core/application/historyStore.ts';
import type { ObjectRegistry } from '@core/application/objectRegistry.ts';

export type TAutomationMode = 'single' | 'restart' | 'queued';
export type TAutomationLevel = 'info' | 'warn' | 'error';

export type TAutomationTrigger =
  | { type: 'state'; entityId: string; to?: unknown; from?: unknown }
  | { type: 'time'; everyMs?: number; at?: string }
  | { type: 'event'; event?: string }
  | { type: 'manual' };

export type TAutomationCondition =
  | { type: 'compare'; entityId: string; op: '==' | '!=' | '>' | '>=' | '<' | '<='; value: unknown }
  | { type: 'history'; entityId: string; op: string; value: unknown; windowMs: number }
  | { type: 'and' | 'or'; items: TAutomationCondition[] };

export type TAutomationAction =
  | { type: 'set'; deviceId: string; entityKey: string; value: unknown }
  | { type: 'scene'; sceneId: number }
  | { type: 'notify'; level: TAutomationLevel; text: string }
  | { type: 'delay'; ms: number }
  | { type: 'script'; scriptId: string };

export interface IAutomationRule {
  id: number;
  name: string;
  enabled: boolean;
  mode: TAutomationMode;
  trigger: TAutomationTrigger;
  conditions: TAutomationCondition[];
  actions: TAutomationAction[];
  updatedAt?: string;
}

export interface IAutomationScene {
  id: number;
  name: string;
  actions: TAutomationAction[];
  updatedAt?: string;
}

export interface IAutomationJournalEntry {
  at: number;
  ruleId: number;
  ruleName: string;
  status: 'started' | 'skipped' | 'done' | 'error';
  reason: string;
  error?: string;
}

export interface IAutomationEngineOptions {
  registry: ObjectRegistry;
  actions: ActionService;
  history?: IHistoryStore;
  rules: { getAll(): Promise<Array<Record<string, unknown>>> };
  scenes: { getAll(): Promise<Array<Record<string, unknown>>> };
  notifications: { create(data: Record<string, unknown>): Promise<Record<string, unknown>> };
  now?: () => number;
}

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

const isRule = (value: Record<string, unknown>): value is Record<string, unknown> & IAutomationRule =>
  typeof value.id === 'number'
  && typeof value.name === 'string'
  && typeof value.enabled === 'boolean'
  && typeof value.trigger === 'object'
  && value.trigger !== null
  && Array.isArray(value.conditions)
  && Array.isArray(value.actions);

export class AutomationEngine {
  private readonly registry: ObjectRegistry;
  private readonly actions: ActionService;
  private readonly history?: IHistoryStore;
  private readonly ruleStore: IAutomationEngineOptions['rules'];
  private readonly sceneStore: IAutomationEngineOptions['scenes'];
  private readonly notificationStore: IAutomationEngineOptions['notifications'];
  private readonly now: () => number;
  private readonly rules = new Map<number, IAutomationRule>();
  private readonly scenes = new Map<number, IAutomationScene>();
  private readonly running = new Set<number>();
  private readonly queued = new Set<number>();
  private readonly restart = new Set<number>();
  private readonly cooldown = new Map<number, number>();
  private readonly lastTime = new Map<number, number>();
  private readonly journal: IAutomationJournalEntry[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private unsubscribe: (() => void) | undefined;

  constructor({ registry, actions, history, rules, scenes, notifications, now = Date.now }: IAutomationEngineOptions) {
    this.registry = registry;
    this.actions = actions;
    this.history = history;
    this.ruleStore = rules;
    this.sceneStore = scenes;
    this.notificationStore = notifications;
    this.now = now;
  }

  async start(): Promise<void> {
    await this.reload();
    this.unsubscribe = this.registry.subscribe(change => {
      if (change.type !== 'entity') return;
      for (const rule of this.rules.values()) {
        if (rule.enabled && rule.trigger.type === 'state' && rule.trigger.entityId === change.deviceId + '/' + change.entityKey) {
          this.onState(rule, change.deviceId, change.entityKey);
        }
      }
    });
    this.timer = setInterval(() => void this.checkTimeRules(), 1_000);
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  async reload(): Promise<void> {
    this.rules.clear();
    this.scenes.clear();
    for (const value of await this.ruleStore.getAll()) {
      if (isRule(value)) this.rules.set(value.id, value);
    }
    for (const value of await this.sceneStore.getAll()) {
      if (typeof value.id === 'number' && typeof value.name === 'string' && Array.isArray(value.actions)) {
        this.scenes.set(value.id, value as unknown as IAutomationScene);
      }
    }
  }

  listRules(): IAutomationRule[] {
    return [...this.rules.values()];
  }

  listScenes(): IAutomationScene[] {
    return [...this.scenes.values()];
  }

  getJournal(): IAutomationJournalEntry[] {
    return [...this.journal];
  }

  async runRule(id: number): Promise<IAutomationJournalEntry> {
    const rule = this.rules.get(id);
    if (!rule) throw new Error(`Automation rule not found: ${id}`);
    return this.executeRule(rule, 'manual');
  }

  async dryRun(id: number): Promise<{ matched: boolean; reason: string }> {
    const rule = this.rules.get(id);
    if (!rule) throw new Error(`Automation rule not found: ${id}`);
    const matched = await this.conditionsMatch(rule.conditions);
    return { matched, reason: matched ? 'conditions matched' : 'conditions did not match' };
  }

  async runScene(id: number): Promise<void> {
    const scene = this.scenes.get(id);
    if (!scene) throw new Error(`Scene not found: ${id}`);
    await this.runActions(scene.actions, 0);
  }

  private async onState(rule: IAutomationRule, deviceId: string, entityKey: string): Promise<void> {
    const cooldown = this.cooldown.get(rule.id) ?? 0;
    if (cooldown > this.now()) return;
    const entity = this.registry.getEntity(deviceId, entityKey);
    if (!entity?.get) return;
    const trigger = rule.trigger;
    if (trigger.type !== 'state') return;
    if (trigger.to !== undefined && entity.get.value !== trigger.to) return;
    if (trigger.from !== undefined && entity.get.value === trigger.from) return;
    await this.executeRule(rule, `state ${entity.id}`);
  }

  private async checkTimeRules(): Promise<void> {
    const now = new Date(this.now());
    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.trigger.type !== 'time') continue;
      const trigger = rule.trigger;
      if (trigger.everyMs) {
        const last = this.lastTime.get(rule.id) ?? 0;
        if (now.getTime() - last < trigger.everyMs) continue;
        this.lastTime.set(rule.id, now.getTime());
      } else if (trigger.at) {
        const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (current !== trigger.at) continue;
        const dayKey = now.toDateString();
        if ((this.lastTime.get(rule.id) ?? 0) >= now.getTime() - 60_000) continue;
        this.lastTime.set(rule.id, now.getTime());
      } else continue;
      await this.executeRule(rule, 'time');
    }
  }

  private async executeRule(rule: IAutomationRule, reason: string): Promise<IAutomationJournalEntry> {
    if (!rule.enabled && reason !== 'manual') return this.log(rule, 'skipped', 'disabled');
    if (this.running.has(rule.id)) {
      if (rule.mode === 'queued') this.queued.add(rule.id);
      if (rule.mode === 'restart') this.restart.add(rule.id);
      return this.log(rule, 'skipped', 'already running');
    }

    this.running.add(rule.id);
    this.log(rule, 'started', reason);
    try {
      const matched = await this.conditionsMatch(rule.conditions);
      if (!matched) return this.log(rule, 'skipped', 'conditions did not match');
      await this.runActions(rule.actions, 0);
      this.cooldown.set(rule.id, this.now() + 300);
      return this.log(rule, 'done', reason);
    } catch (error) {
      return this.log(rule, 'error', reason, errorMessage(error));
    } finally {
      this.running.delete(rule.id);
      if (this.restart.delete(rule.id)) void this.executeRule(rule, 'restart');
      else if (this.queued.delete(rule.id)) void this.executeRule(rule, 'queued');
    }
  }

  private async conditionsMatch(conditions: TAutomationCondition[]): Promise<boolean> {
    for (const condition of conditions) {
      if (!(await this.conditionMatches(condition))) return false;
    }
    return true;
  }

  private async conditionMatches(condition: TAutomationCondition): Promise<boolean> {
    if (condition.type === 'and' || condition.type === 'or') {
      const values = await Promise.all(condition.items.map(item => this.conditionMatches(item)));
      return condition.type === 'and' ? values.every(Boolean) : values.some(Boolean);
    }

    if (condition.type === 'compare') {
      const [deviceId, ...keys] = condition.entityId.split('/');
      const entity = this.registry.getEntity(deviceId, keys.join('/'));
      const value = entity?.get?.value;
      switch (condition.op) {
        case '==': return value === condition.value;
        case '!=': return value !== condition.value;
        case '>': return Number(value) > Number(condition.value);
        case '>=': return Number(value) >= Number(condition.value);
        case '<': return Number(value) < Number(condition.value);
        case '<=': return Number(value) <= Number(condition.value);
        default: return false;
      }
    }

    if (condition.type === 'history') {
      if (!this.history) return false;
      const to = this.now();
      const points = await this.history.query({ entityId: condition.entityId, from: to - condition.windowMs, to, limit: 1 });
      const value = points[0]?.value;
      if (value === undefined) return false;
      return Number(value) === Number(condition.value);
    }

    return false;
  }

  private async runActions(actions: TAutomationAction[], depth: number): Promise<void> {
    if (depth > 3) throw new Error('Automation action nesting is too deep');
    for (const action of actions) {
      if (action.type === 'set') {
        await this.actions.execute({
          requestId: randomUUID(),
          deviceId: action.deviceId,
          entityKey: action.entityKey,
          value: action.value,
          source: 'automation',
        });
      } else if (action.type === 'scene') {
        const scene = this.scenes.get(action.sceneId);
        if (scene) await this.runActions(scene.actions, depth + 1);
      } else if (action.type === 'notify') {
        await this.notificationStore.create({ level: action.level, text: action.text, at: this.now(), read: false });
      } else if (action.type === 'delay') {
        await new Promise(resolve => setTimeout(resolve, Math.min(Math.max(action.ms, 0), 10_000)));
      }
      // Script actions are executed by ScriptRuntime in stage 08.
    }
  }

  private log(rule: IAutomationRule, status: IAutomationJournalEntry['status'], reason: string, error?: string): IAutomationJournalEntry {
    const entry: IAutomationJournalEntry = {
      at: this.now(),
      ruleId: rule.id,
      ruleName: rule.name,
      status,
      reason,
      ...(error ? { error } : {}),
    };
    this.journal.push(entry);
    if (this.journal.length > 200) this.journal.shift();
    return entry;
  }
}
