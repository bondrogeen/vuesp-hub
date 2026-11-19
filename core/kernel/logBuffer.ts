import type { ICoreLogEntry, TCoreLogLevel } from './types.ts';

export interface ILogFilter {
  level?: TCoreLogLevel;
  search?: string;
  context?: string;
}

/**
 * Bounded in-memory log buffer. The hub is a long-running process; an
 * unbounded array is a memory leak by design.
 */
export class LogBuffer {
  private readonly entries: ICoreLogEntry[] = [];
  private dropped = 0;

  constructor(private readonly maxEntries = 2_000) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new TypeError('maxEntries must be a positive integer');
    }
  }

  add(entry: ICoreLogEntry): void {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      const overflow = this.entries.length - this.maxEntries;
      this.entries.splice(0, overflow);
      this.dropped += overflow;
    }
  }

  list(filter: ILogFilter = {}): ICoreLogEntry[] {
    return this.entries.filter(entry => {
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.context && entry.context !== filter.context) return false;
      if (filter.search && !entry.message.includes(filter.search)) return false;
      return true;
    });
  }

  get size(): number {
    return this.entries.length;
  }

  get droppedCount(): number {
    return this.dropped;
  }

  clear(): void {
    this.entries.length = 0;
    this.dropped = 0;
  }
}
