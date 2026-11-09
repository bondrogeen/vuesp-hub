import { Worker } from 'node:worker_threads';
import type Core from '@core/core.ts';

interface WorkerPoolEntry {
  worker: Worker;
  busy: boolean;
  resolve: ((result: unknown) => void) | null;
  reject: ((error: Error) => void) | null;
}

interface WorkerResponse {
  result?: unknown;
  error?: string;
  logs?: Array<{ message: string; level: string }>;
}

export default class ScriptRunnerModule {
  private readonly core: Core;
  private readonly workerScriptPath: string;
  private readonly workerPool: WorkerPoolEntry[] = [];
  private readonly maxWorkers = 5;

  constructor(core: Core, workerScriptPath: string) {
    this.core = core;
    this.workerScriptPath = workerScriptPath;
  }

  async init(): Promise<void> {
    this.core.registerService('script-runner', this);
    this.core.log('Script runner module initialized');
    this.setupWorkerPool();
  }

  private setupWorkerPool(): void {
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

  runScript(code: string, context: Record<string, unknown> = {}): Promise<unknown> {
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

  handleWorkerResponse(threadId: number, { result, error, logs }: WorkerResponse) {
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

  handleWorkerError(threadId: number, error: Error) {
    this.core.log(`Worker error [${threadId}]: ${error.message}`, 'error');
    const worker = this.workerPool.find(w => w.worker.threadId === threadId);
    if (worker && worker.reject) {
      worker.reject(error);
      worker.busy = false;
    }
  }

  handleWorkerExit(threadId: number, code: number) {
    if (code !== 0) {
      this.core.log(`Worker stopped with exit code ${code} [${threadId}]`, 'error');
    }
  }

  async destroy(): Promise<void> {
    for (const { worker } of this.workerPool) {
      await worker.terminate();
    }
    this.core.log('Script runner module stopped');
  }
}