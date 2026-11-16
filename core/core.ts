import { EventEmitter } from 'node:events';
import ScriptRunnerModule from './modules/script/vuesp.script.ts';

export interface ICoreLogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface ICoreModule {
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export type TCoreModuleFactory = (core: Core) => ICoreModule;

export interface ICoreOptions {
  modules?: TCoreModuleFactory[];
  workerScriptPath?: string;
}

export interface ICoreHookHandlers {
  startup: Array<() => void | Promise<void>>;
  shutdown: Array<() => void | Promise<void>>;
}

export default class Core extends EventEmitter {
  private readonly modules = new Map<string, ICoreModule>();
  private readonly services = new Map<string, unknown>();
  private readonly hooks: ICoreHookHandlers = { startup: [], shutdown: [] };
  private readonly logs: ICoreLogEntry[] = [];
  private readonly moduleFactories: TCoreModuleFactory[];

  constructor({ modules, workerScriptPath }: ICoreOptions = {}) {
    super();
    this.moduleFactories = modules ?? [
      core => {
        if (!workerScriptPath) throw new Error('workerScriptPath is required to initialize the script runner');
        return new ScriptRunnerModule(core, workerScriptPath);
      },
    ];
  }

  async init(): Promise<void> {
    this.registerService('core', this);
    this.log('System initialization started');

    for (const createModule of this.moduleFactories) {
      const module = createModule(this);
      const name = module.constructor.name;
      await module.init();
      this.modules.set(name, module);
      this.log(`Module ${name} loaded`);
    }

    await this.runHooks('startup');
    this.log('System initialized');
  }

  registerService<T>(name: string, service: T): void {
    this.services.set(name, service);
    this.log(`Service ${name} registered`);
  }

  getService<T>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  addHook(type: keyof ICoreHookHandlers, handler: () => void | Promise<void>): void {
    this.hooks[type].push(handler);
  }

  private async runHooks(type: keyof ICoreHookHandlers): Promise<void> {
    for (const handler of this.hooks[type]) {
      await handler();
    }
  }

  log(message: string, level = 'info'): void {
    const entry: ICoreLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    this.logs.push(entry);
    this.emit('log', entry);
    console.log(`[${level.toUpperCase()}] ${entry.timestamp} ${message}`);
  }

  getLogs(filter: { level?: string; search?: string } = {}): ICoreLogEntry[] {
    return this.logs.filter(entry => {
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.search && !entry.message.includes(filter.search)) return false;
      return true;
    });
  }

  async shutdown(): Promise<void> {
    await this.runHooks('shutdown');

    for (const [name, module] of [...this.modules].reverse()) {
      await module.destroy();
      this.modules.delete(name);
      this.log(`Module ${name} unloaded`);
    }

    this.log('System stopped');
  }
}
