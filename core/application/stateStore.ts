import type { IEntity, IRegisteredDevice } from './objectRegistry.ts';

export const STATE_SCHEMA_VERSION = 1;

export interface IStoredStateDevice extends Omit<IRegisteredDevice, 'entities'> {
  entities: IEntity[];
}

export interface IStateSnapshot {
  schemaVersion: number;
  savedAt: number;
  devices: IStoredStateDevice[];
}

export interface IStoreHealth {
  ok: boolean;
  status: 'ok' | 'degraded' | 'error';
  message?: string;
  sizeBytes?: number;
}

export interface IStateStore {
  load(): Promise<IStateSnapshot>;
  save(snapshot: IStateSnapshot): Promise<void>;
  exportJson(): Promise<string>;
  importJson(value: string): Promise<void>;
  health(): Promise<IStoreHealth>;
  close(): Promise<void>;
}
