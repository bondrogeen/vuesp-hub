import { monitorEventLoopDelay } from 'node:perf_hooks';

import type { ICoreMetricsSnapshot } from './types.ts';

export class CoreMetrics {
  readonly startedAt = Date.now();
  eventsEmitted = 0;
  eventErrors = 0;
  logsWritten = 0;
  logsDropped = 0;
  timersActive = 0;

  private readonly delay = monitorEventLoopDelay({ resolution: 20 });
  private enabled = false;

  constructor() {
    this.delay.enable();
    this.enabled = true;
  }

  snapshot(): ICoreMetricsSnapshot {
    return {
      startedAt: this.startedAt,
      eventsEmitted: this.eventsEmitted,
      eventErrors: this.eventErrors,
      logsWritten: this.logsWritten,
      logsDropped: this.logsDropped,
      timersActive: this.timersActive,
      eventLoopDelayMs: this.enabled
        ? {
            p50: this.delay.percentile(50) / 1_000_000,
            p95: this.delay.percentile(95) / 1_000_000,
            max: this.delay.max / 1_000_000,
          }
        : null,
    };
  }

  resetDelay(): void {
    this.delay.reset();
  }

  dispose(): void {
    if (!this.enabled) return;
    this.delay.disable();
    this.enabled = false;
  }
}
