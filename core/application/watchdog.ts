import { errorMessage } from '@root/shared/errors.ts';
/**
 * Watches long-lived components (modules, adapters, bridges) and restarts
 * them after repeated failures. The watchdog never kills a healthy component:
 * a check has to fail `failureThreshold` times in a row, and restarts are
 * throttled so a crash loop cannot turn into a busy loop.
 */
export interface IWatchdogCheck {
  ok: boolean;
  reason?: string;
}

export interface IWatchdogTarget {
  id: string;
  check(): IWatchdogCheck | Promise<IWatchdogCheck>;
  restart?(): Promise<void> | void;
}

export interface IWatchdogTargetState {
  ok: boolean;
  failures: number;
  restarts: number;
  lastCheckAt: number;
  lastOkAt?: number;
  lastRestartAt?: number;
  reason?: string;
}

export interface IWatchdogOptions {
  targets: () => IWatchdogTarget[] | Promise<IWatchdogTarget[]>;
  intervalMs?: number;
  checkTimeoutMs?: number;
  failureThreshold?: number;
  restartCooldownMs?: number;
  log?: (level: 'warn' | 'error', message: string, targetId: string) => void;
  now?: () => number;
}

export class Watchdog {
  private readonly targets: IWatchdogOptions['targets'];
  private readonly intervalMs: number;
  private readonly checkTimeoutMs: number;
  private readonly failureThreshold: number;
  private readonly restartCooldownMs: number;
  private readonly log?: IWatchdogOptions['log'];
  private readonly now: () => number;
  private readonly state = new Map<string, IWatchdogTargetState>();
  private timer: ReturnType<typeof setInterval> | undefined;
  private running = false;

  constructor({ targets, intervalMs = 30_000, checkTimeoutMs = 5_000, failureThreshold = 3, restartCooldownMs = 60_000, log, now = Date.now }: IWatchdogOptions) {
    this.targets = targets;
    this.intervalMs = Math.max(intervalMs, 1_000);
    this.checkTimeoutMs = Math.max(checkTimeoutMs, 100);
    this.failureThreshold = Math.max(failureThreshold, 1);
    this.restartCooldownMs = Math.max(restartCooldownMs, 0);
    this.log = log;
    this.now = now;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  snapshot(): Record<string, IWatchdogTargetState> {
    return Object.fromEntries([...this.state].map(([id, value]) => [id, { ...value }]));
  }

  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const list = await this.targets();
      const seen = new Set<string>();
      for (const target of list) {
        seen.add(target.id);
        await this.checkTarget(target);
      }
      for (const id of [...this.state.keys()]) {
        if (!seen.has(id)) this.state.delete(id);
      }
    } finally {
      this.running = false;
    }
  }

  private async checkTarget(target: IWatchdogTarget): Promise<void> {
    const at = this.now();
    const previous = this.state.get(target.id) ?? { ok: true, failures: 0, restarts: 0, lastCheckAt: at };
    let result: IWatchdogCheck;
    try {
      result = await this.withTimeout(target.check());
    } catch (error) {
      result = { ok: false, reason: errorMessage(error) };
    }

    if (result.ok) {
      this.state.set(target.id, { ...previous, ok: true, failures: 0, lastCheckAt: at, lastOkAt: at, reason: undefined });
      return;
    }

    const failures = previous.failures + 1;
    const next: IWatchdogTargetState = {
      ...previous,
      ok: false,
      failures,
      lastCheckAt: at,
      ...(result.reason ? { reason: result.reason } : {}),
    };
    this.state.set(target.id, next);
    if (failures < this.failureThreshold) return;

    if (!target.restart) {
      this.log?.('warn', `${target.id} is unhealthy: ${result.reason ?? 'check failed'}`, target.id);
      return;
    }

    if (previous.lastRestartAt !== undefined && at - previous.lastRestartAt < this.restartCooldownMs) {
      this.log?.('warn', `${target.id} still unhealthy, restart is throttled`, target.id);
      return;
    }

    this.log?.('error', `${target.id} failed ${failures} checks, restarting: ${result.reason ?? 'check failed'}`, target.id);
    try {
      await target.restart();
      this.state.set(target.id, { ...next, failures: 0, restarts: previous.restarts + 1, lastRestartAt: at });
    } catch (error) {
      this.log?.('error', `Failed to restart ${target.id}: ${errorMessage(error)}`, target.id);
    }
  }

  private async withTimeout(value: IWatchdogCheck | Promise<IWatchdogCheck>): Promise<IWatchdogCheck> {
    if (!(value instanceof Promise)) return value;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        value,
        new Promise<IWatchdogCheck>(resolve => {
          timer = setTimeout(() => resolve({ ok: false, reason: `check timed out after ${this.checkTimeoutMs}ms` }), this.checkTimeoutMs);
          timer.unref?.();
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
