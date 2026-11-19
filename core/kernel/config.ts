import { existsSync, readFileSync } from 'node:fs';

import type { TCoreLogLevel } from './types.ts';

export interface ICoreConfig {
  dataDir?: string;
  logLevel: TCoreLogLevel;
  maxLogEntries: number;
  shutdownTimeoutMs: number;
  schedulerMaxTimers: number;
  eventMaxListeners: number;
}

const LOG_LEVELS: TCoreLogLevel[] = ['debug', 'info', 'warn', 'error'];

export const defaultCoreConfig = (): ICoreConfig => ({
  logLevel: 'info',
  maxLogEntries: 2_000,
  shutdownTimeoutMs: 10_000,
  schedulerMaxTimers: 100,
  eventMaxListeners: 50,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const positiveInteger = (value: unknown, fallback: number, name: string): number => {
  if (value === undefined) return fallback;
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (!Number.isInteger(parsed) || (parsed as number) <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
  return parsed as number;
};

const logLevel = (value: unknown, fallback: TCoreLogLevel): TCoreLogLevel => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !LOG_LEVELS.includes(value as TCoreLogLevel)) {
    throw new TypeError(`logLevel must be one of: ${LOG_LEVELS.join(', ')}`);
  }
  return value as TCoreLogLevel;
};

export const parseCoreConfig = (value: unknown, base = defaultCoreConfig()): ICoreConfig => {
  if (!isRecord(value)) throw new TypeError('Core config must be an object');
  return {
    ...(typeof value.dataDir === 'string' ? { dataDir: value.dataDir } : {}),
    logLevel: logLevel(value.logLevel, base.logLevel),
    maxLogEntries: positiveInteger(value.maxLogEntries, base.maxLogEntries, 'maxLogEntries'),
    shutdownTimeoutMs: positiveInteger(value.shutdownTimeoutMs, base.shutdownTimeoutMs, 'shutdownTimeoutMs'),
    schedulerMaxTimers: positiveInteger(value.schedulerMaxTimers, base.schedulerMaxTimers, 'schedulerMaxTimers'),
    eventMaxListeners: positiveInteger(value.eventMaxListeners, base.eventMaxListeners, 'eventMaxListeners'),
  };
};

export const loadCoreConfig = ({
  filePath,
  env = process.env,
  overrides,
}: {
  filePath?: string;
  env?: NodeJS.ProcessEnv;
  overrides?: Partial<ICoreConfig>;
} = {}): ICoreConfig => {
  let config = defaultCoreConfig();

  if (filePath && existsSync(filePath)) {
    const raw: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
    config = parseCoreConfig(raw, config);
  }

  config = parseCoreConfig({
    ...(env.VUESP_LOG_LEVEL ? { logLevel: env.VUESP_LOG_LEVEL } : {}),
    ...(env.VUESP_MAX_LOG_ENTRIES ? { maxLogEntries: env.VUESP_MAX_LOG_ENTRIES } : {}),
    ...(env.VUESP_SHUTDOWN_TIMEOUT_MS ? { shutdownTimeoutMs: env.VUESP_SHUTDOWN_TIMEOUT_MS } : {}),
  }, config);

  return overrides ? parseCoreConfig({ ...config, ...overrides }, config) : config;
};
