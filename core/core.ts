import { EventEmitter } from 'node:events';

import { loadCoreConfig, type ICoreConfig } from './kernel/config.ts';
import { CoreEventBus } from './kernel/eventBus.ts';
import { HealthRegistry } from './kernel/healthRegistry.ts';
import { LogBuffer, type ILogFilter } from './kernel/logBuffer.ts';
import { CoreMetrics } from './kernel/metrics.ts';
import { Scheduler } from './kernel/scheduler.ts';
import { ServiceRegistry } from './kernel/serviceRegistry.ts';
import type {
  ICoreEventMap,
  ICoreHealthSnapshot,
  ICoreLogEntry,
  ICoreMetricsSnapshot,
  IServiceHealth,
  TCoreEventHandler,
  TCoreEventName,
  TCoreLogLevel,
} from './kernel/types.ts';
import { errorMessage } from '@root/shared/errors.ts';

export type { ICoreLogEntry, TCoreLogLevel } from './kernel/types.ts';
export type { ICoreConfig } from './kernel/config.ts';

export interface ICoreModule {
  init(): Promise<void>;
  destroy(): Promise<void>;
  health?(): IServiceHealth | Promise<IServiceHealth>;
}

export type TCoreModuleFactory = (core: Core) => ICoreModule;

export interface ICoreOptions {
  modules?: TCoreModuleFactory[];
  config?: Partial<ICoreConfig>;
  configPath?: string;
}

export interface ICoreHookHandlers {
  startup: Array<() => void | Promise<void>>;
  shutdown: Array<() => void | Promise<void>>;
}

const LEVEL_WEIGHT: Record<TCoreLogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};


const isLogLevel = (value: unknown): value is TCoreLogLevel =>
  typeof value === 'string' && Object.hasOwn(LEVEL_WEIGHT, value);

export default class Core extends EventEmitter {
  readonly config: ICoreConfig;
  readonly events: CoreEventBus;
  readonly scheduler: Scheduler;
  readonly health: HealthRegistry;
  readonly metrics: CoreMetrics;
  readonly services: ServiceRegistry;

  private readonly modules = new Map<string, ICoreModule>();
  private readonly hooks: ICoreHookHandlers = { startup: [], shutdown: [] };
  private readonly logs: LogBuffer;
  private readonly moduleFactories: TCoreModuleFactory[];
  private initialized = false;
  private stopped = false;

  constructor({ modules, config, configPath }: ICoreOptions = {}) {
    super();
    this.config = loadCoreConfig({
      filePath: configPath ?? process.env.VUESP_CORE_CONFIG,
      overrides: config,
    });
    this.logs = new LogBuffer(this.config.maxLogEntries);
    this.metrics = new CoreMetrics();
    this.health = new HealthRegistry();
    this.services = new ServiceRegistry();
    this.scheduler = new Scheduler({
      maxTimers: this.config.schedulerMaxTimers,
      onError: (name, error) => this.log(`Timer ${name} failed: ${errorMessage(error)}`, 'error', 'scheduler'),
    });
    this.events = new CoreEventBus({
      maxListenersPerEvent: this.config.eventMaxListeners,
      onError: (type, error) => {
        this.metrics.eventErrors += 1;
        this.log(`Event ${type} handler failed: ${errorMessage(error)}`, 'error', 'event-bus');
      },
    });

    this.moduleFactories = modules ?? [];
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    this.stopped = false;

    this.health.setStatus('starting');
    this.events.emit('core:starting', { at: Date.now() });
    this.registerService('core', this);
    this.log('System initialization started');

    for (const createModule of this.moduleFactories) {
      const module = createModule(this);
      const name = module.constructor.name || 'anonymous';
      try {
        await module.init();
        this.modules.set(name, module);
        this.health.setService(name, 'ready');
        this.log(`Module ${name} loaded`);
      } catch (error) {
        this.health.setService(name, 'error', errorMessage(error));
        this.events.emit('service:error', { service: name, error, at: Date.now() });
        await this.cleanupAfterFailedInit(error);
        throw error;
      }
    }

    try {
      await this.runHooks('startup');
    } catch (error) {
      this.events.emit('service:error', { service: 'startup', error, at: Date.now() });
      await this.cleanupAfterFailedInit(error);
      throw error;
    }

    this.health.setStatus('ready');
    this.events.emit('core:ready', { at: Date.now() });
    this.log('System initialized');
  }

  async start(): Promise<void> {
    await this.init();
  }

  registerService<T>(name: string, service: T): void {
    const existing = this.services.get<T>(name);
    if (existing === service) return;
    this.services.register(name, service);
    this.log(`Service ${name} registered`);
  }

  getService<T>(name: string): T | undefined {
    return this.services.get<T>(name);
  }

  addHook(type: keyof ICoreHookHandlers, handler: () => void | Promise<void>): void {
    this.hooks[type].push(handler);
  }

  onEvent<K extends TCoreEventName>(type: K, handler: TCoreEventHandler<K>): () => void {
    return this.events.on(type, handler);
  }

  emitEvent<K extends TCoreEventName>(type: K, payload: ICoreEventMap[K]): number {
    this.metrics.eventsEmitted += 1;
    return this.events.emit(type, payload);
  }

  log(message: string, level: TCoreLogLevel | string = 'info', context?: string): void {
    const normalized = isLogLevel(level) ? level : 'info';
    if (LEVEL_WEIGHT[normalized] < LEVEL_WEIGHT[this.config.logLevel]) return;

    const entry: ICoreLogEntry = {
      timestamp: new Date().toISOString(),
      level: normalized,
      message,
      ...(context ? { context } : {}),
    };

    this.logs.add(entry);
    this.metrics.logsWritten += 1;
    this.metrics.logsDropped = this.logs.droppedCount;

    try {
      this.emit('log', entry);
    } catch (error) {
      console.error(`[LOG HANDLER] ${errorMessage(error)}`);
    }

    const line = `[${normalized.toUpperCase()}] ${entry.timestamp} ${context ? `[${context}] ` : ''}${message}`;
    if (normalized === 'error') console.error(line);
    else if (normalized === 'warn') console.warn(line);
    else console.log(line);
  }

  getLogs(filter: ILogFilter & { level?: string } = {}): ICoreLogEntry[] {
    return this.logs.list({
      ...(isLogLevel(filter.level) ? { level: filter.level } : {}),
      ...(filter.search ? { search: filter.search } : {}),
      ...(filter.context ? { context: filter.context } : {}),
    });
  }

  getHealth(): ICoreHealthSnapshot {
    return this.health.snapshot();
  }

  markDegraded(reason: string): void {
    this.health.markDegraded(reason);
    this.events.emit('core:degraded', { reason, at: Date.now() });
  }

  getMetrics(): ICoreMetricsSnapshot {
    this.metrics.timersActive = this.scheduler.activeCount;
    return this.metrics.snapshot();
  }

  async shutdown(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;

    this.health.setStatus('stopping');
    this.events.emit('core:stopping', { at: Date.now() });
    const errors: unknown[] = [];

    for (const handler of this.hooks.shutdown) {
      try {
        await this.withTimeout(Promise.resolve().then(handler), `shutdown hook`);
      } catch (error) {
        errors.push(error);
        this.log(`Shutdown hook failed: ${errorMessage(error)}`, 'error', 'lifecycle');
      }
    }

    for (const [name, module] of [...this.modules].reverse()) {
      try {
        await this.withTimeout(module.destroy(), `module ${name}`);
        this.health.removeService(name);
        this.log(`Module ${name} unloaded`);
      } catch (error) {
        errors.push(error);
        this.health.setService(name, 'error', errorMessage(error));
        this.log(`Module ${name} failed to stop: ${errorMessage(error)}`, 'error', 'lifecycle');
      }
    }

    this.scheduler.stopAll();
    this.metrics.dispose();
    this.health.setStatus('stopped');
    this.events.emit('core:stopped', { at: Date.now() });
    this.log('System stopped');

    if (errors.length) throw new AggregateError(errors, 'One or more core components failed to stop');
  }

  async stop(): Promise<void> {
    await this.shutdown();
  }

  private async cleanupAfterFailedInit(error: unknown): Promise<void> {
    for (const [name, module] of [...this.modules].reverse()) {
      try {
        await this.withTimeout(module.destroy(), `module ${name}`);
        this.log(`Module ${name} rolled back after failed init`);
      } catch (destroyError) {
        this.log(`Module ${name} rollback failed: ${errorMessage(destroyError)}`, 'error', 'lifecycle');
      }
    }
    this.modules.clear();
    this.health.setStatus('error', errorMessage(error));
    this.initialized = false;
  }

  private async runHooks(type: keyof ICoreHookHandlers): Promise<void> {
    for (const handler of this.hooks[type]) {
      await this.withTimeout(Promise.resolve().then(handler), `${type} hook`);
    }
  }

  private async withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`${label} timed out after ${this.config.shutdownTimeoutMs} ms`)),
            this.config.shutdownTimeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
