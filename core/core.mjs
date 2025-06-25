import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import EventEmitter from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Core extends EventEmitter {
  constructor() {
    super();
    this.modules = new Map();
    this.services = new Map();
    this.hooks = {
      startup: [],
      shutdown: [],
    };
    this.logs = [];
    this.watchers = new Map();
  }

  async init() {
    this.registerService('core', this);
    this.log('System initialization started');

    const modulesDir = path.join(__dirname, '../../core/modules');

    const moduleFolders = fs.readdirSync(modulesDir).filter((folder) => {
      return fs.statSync(path.join(modulesDir, folder)).isDirectory();
    });

    for (const folder of moduleFolders) {
      await this.loadModule(folder);
    }

    await this.runHooks('startup');
    this.log('System initialized');
  }

  async loadModule(moduleName) {
    try {
      const modulePath = `../../core/modules/${moduleName}/vuesp.${moduleName}.mjs`;
      const { default: ModuleClass } = await import(modulePath);
      const moduleInstance = new ModuleClass(this);
      await moduleInstance.init();
      this.modules.set(moduleName, moduleInstance);
      this.log(`Module ${moduleName} loaded`);
      return true;
    } catch (error) {
      this.log(`Error loading module ${moduleName}: ${error.message}`, 'error');
      return false;
    }
  }

  async unloadModule(moduleName) {
    if (!this.modules.has(moduleName)) return false;

    try {
      const moduleInstance = this.modules.get(moduleName);
      await moduleInstance.destroy();

      // Очистка кэша
      const modulePath = path.resolve(__dirname, `../../core/modules/${moduleName}/vuesp.${moduleName}.mjs`);
      if (import.meta.cache) delete import.meta.cache[modulePath];

      this.modules.delete(moduleName);
      this.log(`Module ${moduleName} unloaded`);
      return true;
    } catch (error) {
      this.log(`Error unloading module ${moduleName}: ${error.message}`, 'error');
      return false;
    }
  }

  async reloadModule(moduleName) {
    await this.unloadModule(moduleName);
    return this.loadModule(moduleName);
  }

  watchModule(moduleName) {
    const modulePath = path.resolve(__dirname, `./modules/${moduleName}`);

    if (this.watchers.has(moduleName)) {
      return;
    }

    const watcher = fs.watch(modulePath, async (event, filename) => {
      if (filename.endsWith('.js')) {
        this.log(`Detected changes in ${moduleName}, reloading...`);
        await this.reloadModule(moduleName);
      }
    });

    this.watchers.set(moduleName, watcher);
    this.log(`Watching module ${moduleName} for changes`);
  }

  registerService(name, service) {
    this.services.set(name, service);
    this.log(`Service ${name} registered`);
  }

  getService(name) {
    return this.services.get(name);
  }

  addHook(type, handler) {
    this.hooks[type].push(handler);
  }

  async runHooks(type) {
    for (const handler of this.hooks[type]) {
      await handler();
    }
  }

  log(message, level = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    this.logs.push(entry);
    this.emit('log', entry);
    console.log(`[${level.toUpperCase()}] ${entry.timestamp} ${message}`);
  }

  getLogs(filter = {}) {
    return this.logs.filter((entry) => {
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.search && !entry.message.includes(filter.search)) return false;
      return true;
    });
  }

  async shutdown() {
    await this.runHooks('shutdown');

    // Остановка всех вотчеров
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }

    // Выгрузка модулей
    for (const [name] of this.modules) {
      await this.unloadModule(name);
    }

    this.log('System stopped');
  }
}
