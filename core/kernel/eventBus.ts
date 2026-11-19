import type {
  ICoreEventBus,
  ICoreEventMap,
  TCoreEventHandler,
  TCoreEventName,
} from './types.ts';

type TAnyHandler = (event: unknown) => void;

export interface ICoreEventBusOptions {
  onError?: (type: TCoreEventName, error: unknown) => void;
  maxListenersPerEvent?: number;
}

/**
 * Small typed event bus. Handlers are isolated: one throwing subscriber must
 * not break the others or the caller. Order is insertion order.
 */
export class CoreEventBus implements ICoreEventBus {
  private readonly handlers = new Map<TCoreEventName, Set<TAnyHandler>>();
  private readonly onError?: (type: TCoreEventName, error: unknown) => void;
  private readonly maxListenersPerEvent: number;

  constructor({ onError, maxListenersPerEvent = 50 }: ICoreEventBusOptions = {}) {
    this.onError = onError;
    this.maxListenersPerEvent = maxListenersPerEvent;
  }

  on<K extends TCoreEventName>(type: K, handler: TCoreEventHandler<K>): () => void {
    const set = this.handlers.get(type) ?? new Set<TAnyHandler>();
    const wrapped = handler as TAnyHandler;
    if (set.has(wrapped)) return () => this.off(type, handler);
    if (set.size >= this.maxListenersPerEvent) {
      this.onError?.(type, new Error(`Too many listeners for ${type}: ${set.size}`));
      return () => undefined;
    }
    set.add(wrapped);
    this.handlers.set(type, set);
    return () => this.off(type, handler);
  }

  once<K extends TCoreEventName>(type: K, handler: TCoreEventHandler<K>): () => void {
    let active = true;
    const unsubscribe = this.on(type, event => {
      if (!active) return;
      active = false;
      unsubscribe();
      handler(event);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }

  off<K extends TCoreEventName>(type: K, handler: TCoreEventHandler<K>): void {
    const set = this.handlers.get(type);
    if (!set) return;
    set.delete(handler as TAnyHandler);
    if (!set.size) this.handlers.delete(type);
  }

  emit<K extends TCoreEventName>(type: K, payload: ICoreEventMap[K]): number {
    const set = this.handlers.get(type);
    if (!set?.size) return 0;

    let delivered = 0;
    for (const handler of [...set]) {
      try {
        handler(payload);
        delivered += 1;
      } catch (error) {
        this.onError?.(type, error);
      }
    }
    return delivered;
  }

  listenerCount(type: TCoreEventName): number {
    return this.handlers.get(type)?.size ?? 0;
  }

  clear(): void {
    this.handlers.clear();
  }
}
