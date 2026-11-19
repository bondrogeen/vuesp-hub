export type THistoryStatus = 'live' | 'stale';

export interface IHistoryPoint {
  entityId: string;
  at: number;
  value: unknown;
  status: THistoryStatus;
}

export interface IHistoryQuery {
  entityId: string;
  from: number;
  to: number;
  limit?: number;
  bucketMs?: number;
}

export interface IHistoryRetention {
  days: number;
  maxBytes?: number;
}

export interface IHistoryHealth {
  ok: boolean;
  status: 'ok' | 'degraded' | 'error';
  message?: string;
  sizeBytes?: number;
}

export interface IHistoryStore {
  append(points: IHistoryPoint[]): Promise<void>;
  query(query: IHistoryQuery): Promise<IHistoryPoint[]>;
  retention(policy: IHistoryRetention): Promise<number>;
  health(): Promise<IHistoryHealth>;
  close(): Promise<void>;
}
