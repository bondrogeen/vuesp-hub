export type TCoreLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ICoreLogEntry {
  timestamp: string;
  level: TCoreLogLevel;
  message: string;
  context?: string;
}

export type TCoreHealthStatus = 'starting' | 'ready' | 'degraded' | 'stopping' | 'stopped' | 'error';

export interface IServiceHealth {
  status: TCoreHealthStatus;
  message?: string;
  updatedAt: number;
}

export interface ICoreHealthSnapshot {
  status: TCoreHealthStatus;
  startedAt: number;
  updatedAt: number;
  services: Record<string, IServiceHealth>;
  reason?: string;
}

export interface ICoreEventMap {
  'core:starting': { at: number };
  'core:ready': { at: number };
  'core:degraded': { reason: string; at: number };
  'core:stopping': { at: number };
  'core:stopped': { at: number };
  'device:raw': { deviceId: string; key?: string; payload: unknown; at: number };
  'device:online': { deviceId: string; at: number };
  'device:offline': { deviceId: string; at: number };
  'entity:changed': { entityId: string; at: number };
  'service:error': { service: string; error: unknown; at: number };
  'mqtt:state': { deviceId: string; state: unknown; at: number };
}

export type TCoreEventName = keyof ICoreEventMap;

export type TCoreEventHandler<K extends TCoreEventName> = (event: ICoreEventMap[K]) => void;

export interface ICoreMetricsSnapshot {
  startedAt: number;
  eventsEmitted: number;
  eventErrors: number;
  logsWritten: number;
  logsDropped: number;
  timersActive: number;
  eventLoopDelayMs: {
    p50: number;
    p95: number;
    max: number;
  } | null;
}

export interface ICoreEventBus {
  on<K extends TCoreEventName>(type: K, handler: TCoreEventHandler<K>): () => void;
  once<K extends TCoreEventName>(type: K, handler: TCoreEventHandler<K>): () => void;
  off<K extends TCoreEventName>(type: K, handler: TCoreEventHandler<K>): void;
  emit<K extends TCoreEventName>(type: K, payload: ICoreEventMap[K]): number;
  listenerCount(type: TCoreEventName): number;
  clear(): void;
}
