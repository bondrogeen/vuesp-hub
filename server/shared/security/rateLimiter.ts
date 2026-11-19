export interface IRateLimiterOptions {
  /** Maximum attempts inside the window. */
  limit: number;
  windowMs: number;
  /** How long a tripped key stays blocked after the last attempt. */
  blockMs?: number;
}

export interface IRateLimiterResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Sliding-window limiter used for authentication and other low-volume,
 * high-value endpoints. State is in memory on purpose: a restart clears it and
 * there is no shared storage requirement for a single local hub.
 */
export class RateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly blockMs: number;
  private readonly attempts = new Map<string, number[]>();
  private readonly blockedUntil = new Map<string, number>();

  constructor({ limit, windowMs, blockMs = windowMs }: IRateLimiterOptions) {
    if (limit < 1) throw new TypeError('Rate limit must be at least 1');
    if (windowMs < 1) throw new TypeError('Rate window must be positive');
    this.limit = limit;
    this.windowMs = windowMs;
    this.blockMs = Math.max(blockMs, windowMs);
  }

  take(key: string, now = Date.now()): IRateLimiterResult {
    const blocked = this.blockedUntil.get(key) ?? 0;
    if (blocked > now) return { allowed: false, remaining: 0, retryAfterMs: blocked - now };

    const since = now - this.windowMs;
    const recent = (this.attempts.get(key) ?? []).filter(at => at > since);
    if (recent.length >= this.limit) {
      this.blockedUntil.set(key, now + this.blockMs);
      this.attempts.delete(key);
      return { allowed: false, remaining: 0, retryAfterMs: this.blockMs };
    }

    recent.push(now);
    this.attempts.set(key, recent);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterMs: 0 };
  }

  reset(key: string): void {
    this.attempts.delete(key);
    this.blockedUntil.delete(key);
  }

  /** Drop stale state so a long-running hub does not grow forever. */
  cleanup(now = Date.now()): void {
    const since = now - this.windowMs;
    for (const [key, list] of this.attempts) {
      const recent = list.filter(at => at > since);
      if (recent.length) this.attempts.set(key, recent);
      else this.attempts.delete(key);
    }
    for (const [key, until] of this.blockedUntil) {
      if (until <= now) this.blockedUntil.delete(key);
    }
  }
}
