export const CONFIG_SCHEMA_VERSION = 1;

export interface IConfigStore {
  get<T>(section: string, key: string): Promise<T | undefined>;
  set<T>(section: string, key: string, value: T): Promise<void>;
  delete(section: string, key: string): Promise<boolean>;
  list<T>(section: string): Promise<Record<string, T>>;
  health(): Promise<{ ok: boolean; status: 'ok' | 'error'; message?: string }>;
  close(): Promise<void>;
}
