// modules/script-runner/script-runner.module.js
import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// /home/user/github/pets/vuesp-app/core/core/modules/script/worker-script.js
// /home/user/github/pets/vuesp-app/core/modules/script/vuesp.script.mjs

export default class ScriptRunnerModule {
  constructor(core) {
    this.core = core;
    this.workerPool = [];
    this.maxWorkers = 5;
    this.workerScriptPath = path.join(__dirname, '../../modules/script/worker-script.mjs');
    console.log(this.workerScriptPath)
  }

  async init() {
    this.core.registerService('script-runner', this);
    this.core.log('Script runner module initialized');
    this.setupWorkerPool();
  }

  setupWorkerPool() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(this.workerScriptPath);
      worker.on('message', this.handleWorkerResponse.bind(this, worker.threadId));
      worker.on('error', this.handleWorkerError.bind(this, worker.threadId));
      worker.on('exit', this.handleWorkerExit.bind(this, worker.threadId));

      this.workerPool.push({
        worker,
        busy: false,
        resolve: null,
        reject: null
      });
    }
  }

  runScript(code, context = {}) {
    return new Promise((resolve, reject) => {
      const freeWorker = this.workerPool.find(w => !w.busy);

      if (!freeWorker) {
        reject(new Error('No available workers'));
        return;
      }

      freeWorker.busy = true;
      freeWorker.resolve = resolve;
      freeWorker.reject = reject;

      freeWorker.worker.postMessage({
        code,
        context
      });
    });
  }

  handleWorkerResponse(threadId, { result, error, logs }) {
    const worker = this.workerPool.find(w => w.worker.threadId === threadId);
    if (!worker) return;

    // Обработка логов из воркера
    if (logs && logs.length > 0) {
      logs.forEach(log => this.core.log(`[Worker ${threadId}] ${log.message}`, log.level));
    }

    worker.busy = false;

    if (error) {
      if (worker.reject) worker.reject(new Error(error));
    } else {
      if (worker.resolve) worker.resolve(result);
    }

    // Сброс обработчиков
    worker.resolve = null;
    worker.reject = null;
  }

  handleWorkerError(threadId, error) {
    this.core.log(`Worker error [${threadId}]: ${error.message}`, 'error');
    const worker = this.workerPool.find(w => w.worker.threadId === threadId);
    if (worker && worker.reject) {
      worker.reject(error);
      worker.busy = false;
    }
  }

  handleWorkerExit(threadId, code) {
    if (code !== 0) {
      this.core.log(`Worker stopped with exit code ${code} [${threadId}]`, 'error');
    }
  }

  async destroy() {
    for (const { worker } of this.workerPool) {
      await worker.terminate();
    }
    this.core.log('Script runner module stopped');
  }
}