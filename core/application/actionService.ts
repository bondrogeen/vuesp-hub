import { randomUUID } from 'node:crypto';

import type { ObjectRegistry } from './objectRegistry.ts';

export type TActionSource = 'ui' | 'cloud' | 'script' | 'automation' | 'module';
export type TActionStatus = 'accepted' | 'confirmed' | 'failed' | 'timeout';

export interface IActionRequest {
  requestId?: string;
  deviceId: string;
  entityKey: string;
  action?: 'set';
  value: unknown;
  source: TActionSource;
  timeoutMs?: number;
}

export interface IActionCommandResult {
  comm: string;
  ok: boolean;
  error?: string;
}

export interface IActionError {
  code: string;
  message: string;
  at: number;
}

export interface IActionResult {
  requestId: string;
  status: TActionStatus;
  pending: boolean;
  commands: IActionCommandResult[];
  error?: IActionError;
  at: number;
}

export interface ICommandExecution {
  commands: IActionCommandResult[];
  error?: IActionError;
}

export interface IActionTarget {
  execute(request: {
    requestId: string;
    deviceId: string;
    entityKey: string;
    value: unknown;
  }): Promise<ICommandExecution>;
}

export interface IActionServiceOptions {
  registry: ObjectRegistry;
  target: IActionTarget;
  timeoutMs?: number;
  rateLimit?: number;
  idempotencyTtlMs?: number;
}

const DEFAULT_TIMEOUT = 5_000;
const DEFAULT_RATE_LIMIT = 10;
const DEFAULT_IDEMPOTENCY_TTL = 60_000;
const QUEUE_TTL = 5 * 60_000;

interface IQueuedAction {
  request: Required<Pick<IActionRequest, 'requestId' | 'deviceId' | 'entityKey' | 'value'>> & IActionRequest;
  expiresAt: number;
}

export class ActionService {
  private readonly registry: ObjectRegistry;
  private readonly target: IActionTarget;
  private readonly defaultTimeout: number;
  private readonly rateLimit: number;
  private readonly idempotencyTtl: number;
  private readonly results = new Map<string, IActionResult>();
  private readonly rates = new Map<string, number[]>();
  private readonly queue = new Map<string, IQueuedAction>();

  constructor({ registry, target, timeoutMs = DEFAULT_TIMEOUT, rateLimit = DEFAULT_RATE_LIMIT, idempotencyTtlMs = DEFAULT_IDEMPOTENCY_TTL }: IActionServiceOptions) {
    this.registry = registry;
    this.target = target;
    this.defaultTimeout = timeoutMs;
    this.rateLimit = rateLimit;
    this.idempotencyTtl = idempotencyTtlMs;
    this.registry.subscribe(change => {
      if (change.type === 'device') this.flushQueue(change.deviceId);
      if (change.type === 'entity') this.flushQueue(change.deviceId);
    });
  }

  getResult(requestId: string): IActionResult | undefined {
    return this.results.get(requestId);
  }

  async execute(input: IActionRequest): Promise<IActionResult> {
    const requestId = input.requestId ?? randomUUID();
    const cached = this.results.get(requestId);
    if (cached) return cached;

    const at = Date.now();
    const device = this.registry.getDevice(input.deviceId);
    const entity = this.registry.getEntity(input.deviceId, input.entityKey);

    const fail = (code: string, message: string): IActionResult => this.finish({
      requestId,
      status: 'failed',
      pending: false,
      commands: [],
      error: { code, message, at },
      at,
    });

    if (!device || !entity) return fail('not_found', 'Device or entity was not found');
    if (!entity.set) return fail('not_writable', 'Entity is read-only');
    if (!entity.available || !device.online) {
      if (entity.set.queue) {
        this.queue.set(entity.id, {
          request: { ...input, requestId, value: input.value, deviceId: input.deviceId, entityKey: input.entityKey },
          expiresAt: at + QUEUE_TTL,
        });
        this.patchSet(input.deviceId, input.entityKey, {
          requested: input.value,
          requestedAt: at,
          pending: true,
          status: 'pending',
        });
        return this.finish({
          requestId,
          status: 'accepted',
          pending: true,
          commands: [],
          at,
        });
      }
      return fail('offline', 'Device is offline');
    }

    if (!this.takeRate(input.deviceId, at)) return fail('rate_limited', 'Too many commands for this device');
    const ack = entity.set.ack ?? (entity.get ? 'state' : 'none');
    this.patchSet(input.deviceId, input.entityKey, {
      requested: input.value,
      requestedAt: at,
      pending: ack === 'state',
      status: ack === 'state' ? 'pending' : 'idle',
    });

    const waitForChange = ack === 'state'
      ? this.waitForChange(input.deviceId, input.entityKey, (input.timeoutMs ?? this.defaultTimeout))
      : Promise.resolve(false);

    const execution = await this.target.execute({
      requestId,
      deviceId: input.deviceId,
      entityKey: input.entityKey,
      value: input.value,
    });

    if (execution.error) {
      await waitForChange;
      this.patchSet(input.deviceId, input.entityKey, {
        pending: false,
        status: 'error',
        error: execution.error,
      });
      return this.finish({
        requestId,
        status: 'failed',
        pending: false,
        commands: execution.commands,
        error: execution.error,
        at,
      });
    }

    if (ack === 'none') {
      this.patchSet(input.deviceId, input.entityKey, { pending: false, status: 'idle' });
      return this.finish({
        requestId,
        status: 'accepted',
        pending: false,
        commands: execution.commands,
        at,
      });
    }

    const confirmed = await waitForChange;
    if (confirmed) {
      this.patchSet(input.deviceId, input.entityKey, { pending: false, status: 'idle' });
      return this.finish({
        requestId,
        status: 'confirmed',
        pending: false,
        commands: execution.commands,
        at,
      });
    }

    const error = { code: 'timeout', message: 'Device did not confirm the command in time', at: Date.now() };
    this.patchSet(input.deviceId, input.entityKey, { pending: false, status: 'error', error });
    return this.finish({
      requestId,
      status: 'timeout',
      pending: false,
      commands: execution.commands,
      error,
      at,
    });
  }

  private waitForChange(deviceId: string, entityKey: string, timeoutMs: number): Promise<boolean> {
    return new Promise(resolve => {
      let done = false;
      const finish = (value: boolean): void => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        unsubscribe();
        resolve(value);
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      const unsubscribe = this.registry.subscribe(change => {
        if (change.type === 'entity' && change.deviceId === deviceId && change.entityKey === entityKey) finish(true);
      });
    });
  }

  private finish(result: IActionResult): IActionResult {
    this.cleanupResults();
    this.results.set(result.requestId, result);
    return result;
  }

  private cleanupResults(): void {
    const now = Date.now();
    for (const [id, result] of this.results) {
      if (now - result.at > this.idempotencyTtl) this.results.delete(id);
    }
  }

  private takeRate(deviceId: string, now: number): boolean {
    const values = (this.rates.get(deviceId) ?? []).filter(value => now - value < 1_000);
    if (values.length >= this.rateLimit) {
      this.rates.set(deviceId, values);
      return false;
    }
    values.push(now);
    this.rates.set(deviceId, values);
    return true;
  }

  private patchSet(deviceId: string, entityKey: string, patch: Record<string, unknown>): void {
    const entity = this.registry.getEntity(deviceId, entityKey);
    if (!entity?.set) return;
    this.registry.updateEntity(deviceId, entityKey, { set: { ...entity.set, ...patch } as typeof entity.set });
  }

  private flushQueue(deviceId: string): void {
    const device = this.registry.getDevice(deviceId);
    if (!device?.online) return;
    const now = Date.now();
    for (const [entityId, queued] of [...this.queue]) {
      if (!entityId.startsWith(`${deviceId}/`)) continue;
      this.queue.delete(entityId);
      if (queued.expiresAt < now) continue;
      this.results.delete(queued.request.requestId);
      void this.execute({ ...queued.request, source: queued.request.source });
    }
  }
}
