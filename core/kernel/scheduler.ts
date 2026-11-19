type TTimerKind = 'interval' | 'timeout';

interface ITimerEntry {
  kind: TTimerKind;
  handle: ReturnType<typeof setInterval>;
}

export interface ISchedulerOptions {
  onError?: (name: string, error: unknown) => void;
  maxTimers?: number;
}

/**
 * Named timers with a single stop point. Missed/late work is not replayed;
 * callers own debounce/coalescing semantics.
 */
export class Scheduler {
  private readonly timers = new Map<string, ITimerEntry>();
  private readonly onError?: (name: string, error: unknown) => void;
  private readonly maxTimers: number;

  constructor({ onError, maxTimers = 100 }: ISchedulerOptions = {}) {
    this.onError = onError;
    this.maxTimers = maxTimers;
  }

  setInterval(name: string, ms: number, handler: () => void, immediate = false): void {
    this.assertName(name);
    if (!Number.isFinite(ms) || ms <= 0) throw new TypeError(`Invalid interval for ${name}: ${ms}`);
    this.assertCapacity();
    const run = () => {
      try {
        handler();
      } catch (error) {
        this.onError?.(name, error);
      }
    };
    const handle = setInterval(run, ms);
    this.timers.set(name, { kind: 'interval', handle });
    if (immediate) run();
  }

  setTimeout(name: string, ms: number, handler: () => void): void {
    this.assertName(name);
    if (!Number.isFinite(ms) || ms < 0) throw new TypeError(`Invalid timeout for ${name}: ${ms}`);
    this.assertCapacity();
    const handle = setTimeout(() => {
      this.timers.delete(name);
      try {
        handler();
      } catch (error) {
        this.onError?.(name, error);
      }
    }, ms);
    this.timers.set(name, { kind: 'timeout', handle });
  }

  clear(name: string): boolean {
    const timer = this.timers.get(name);
    if (!timer) return false;
    if (timer.kind === 'interval') clearInterval(timer.handle);
    else clearTimeout(timer.handle);
    this.timers.delete(name);
    return true;
  }

  stopAll(): void {
    for (const name of [...this.timers.keys()]) this.clear(name);
  }

  get activeCount(): number {
    return this.timers.size;
  }

  has(name: string): boolean {
    return this.timers.has(name);
  }

  private assertName(name: string): void {
    if (typeof name !== 'string' || !name.trim()) throw new TypeError('Timer name is required');
  }

  private assertCapacity(): void {
    if (this.timers.size >= this.maxTimers) {
      throw new Error(`Too many timers: ${this.timers.size}`);
    }
  }
}
