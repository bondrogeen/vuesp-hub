import { fork } from 'node:child_process';

import type { ActionService } from './actionService.ts';
import type { IHistoryStore } from './historyStore.ts';
import type { ObjectRegistry } from './objectRegistry.ts';
import { errorMessage } from '@root/shared/errors.ts';

export interface IScriptRunOptions {
  code: string;
  timeoutMs?: number;
  memoryMb?: number;
  onLog?: (level: string, message: string) => void;
}

export type TScriptErrorKind = 'timeout' | 'runtime' | 'denied' | 'output';

export interface IScriptRunResult {
  ok: boolean;
  durationMs: number;
  output?: unknown;
  logs: Array<{ level: string; message: string }>;
  error?: { message: string; kind: TScriptErrorKind };
}

export interface IScriptRuntimeOptions {
  registry: ObjectRegistry;
  actions: ActionService;
  history?: IHistoryStore;
  runnerPath: string;
}

const MAX_CODE = 256_000;
const MAX_OUTPUT = 64_000;
const MAX_TIMEOUT = 30_000;
const MAX_MEMORY = 256;

/** One process per invocation; workers are not reused across scripts. */
export class ScriptRuntime {
  private readonly registry: ObjectRegistry;
  private readonly actions: ActionService;
  private readonly history?: IHistoryStore;
  private readonly runnerPath: string;

  constructor({ registry, actions, history, runnerPath }: IScriptRuntimeOptions) {
    this.registry = registry;
    this.actions = actions;
    this.history = history;
    this.runnerPath = runnerPath;
  }

  async run({ code, timeoutMs = 2_000, memoryMb = 64, onLog }: IScriptRunOptions): Promise<IScriptRunResult> {
    const started = Date.now();
    const logs: Array<{ level: string; message: string }> = [];
    const timeout = Math.min(Math.max(timeoutMs, 100), MAX_TIMEOUT);
    const memory = Math.min(Math.max(memoryMb, 16), MAX_MEMORY);

    if (typeof code !== 'string' || !code.trim()) return this.error(started, logs, 'Script is empty', 'runtime');
    if (code.length > MAX_CODE) return this.error(started, logs, 'Script is too large', 'runtime');

    const child = fork(this.runnerPath, [], {
      execArgv: [`--permission`, `--allow-fs-read=${this.runnerPath}`, `--max-old-space-size=${memory}`],
      env: {
        PATH: process.env.PATH ?? '',
        LANG: process.env.LANG ?? 'C',
        LC_ALL: process.env.LC_ALL ?? '',
      },
      silent: true,
      stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    });

    return new Promise<IScriptRunResult>(resolve => {
      let settled = false;
      const finish = (result: IScriptRunResult): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.removeAllListeners();
        if (child.connected) child.disconnect();
        child.kill('SIGKILL');
        resolve(result);
      };
      const fail = (message: string, kind: TScriptErrorKind): void => {
        finish(this.error(started, logs, message, kind));
      };

      const timer = setTimeout(() => fail(`Script timed out after ${timeout} ms`, 'timeout'), timeout);
      child.on('error', error => fail(error.message, 'runtime'));
      child.on('exit', code => {
        if (!settled) fail(`Script process exited with code ${String(code)}`, 'runtime');
      });
      child.on('message', async (message: unknown) => {
        if (!message || typeof message !== 'object') return;
        const data = message as Record<string, unknown>;
        if (data.type === 'log') {
          const entry = { level: String(data.level ?? 'info'), message: String(data.message ?? '').slice(0, 2_000) };
          if (logs.length < 100) logs.push(entry);
          onLog?.(entry.level, entry.message);
          return;
        }
        if (data.type === 'rpc') {
          try {
            const result = await this.handleRpc(String(data.method), Array.isArray(data.args) ? data.args : []);
            child.send?.({ type: 'rpc_result', id: data.id, result });
          } catch (error) {
            child.send?.({ type: 'rpc_result', id: data.id, error: errorMessage(error) });
          }
          return;
        }
        if (data.type === 'result') {
          const output = data.result;
          if (JSON.stringify(output ?? null).length > MAX_OUTPUT) {
            fail('Script output is too large', 'output');
            return;
          }
          finish({ ok: true, durationMs: Date.now() - started, output, logs });
          return;
        }
        if (data.type === 'error') fail(String(data.message ?? 'Script failed'), 'runtime');
      });

      child.send?.({ type: 'run', code, timeoutMs: timeout });
    });
  }

  private async handleRpc(method: string, args: unknown[]): Promise<unknown> {
    if (method === 'getEntity') {
      const [deviceId, entityKey] = args;
      if (typeof deviceId !== 'string' || typeof entityKey !== 'string') throw new TypeError('deviceId and entityKey are required');
      return this.registry.getEntity(deviceId, entityKey);
    }
    if (method === 'setEntity') {
      const [deviceId, entityKey, value] = args;
      if (typeof deviceId !== 'string' || typeof entityKey !== 'string') throw new TypeError('deviceId and entityKey are required');
      return this.actions.execute({
        requestId: `script-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        deviceId,
        entityKey,
        value,
        source: 'script',
      });
    }
    if (method === 'queryHistory') {
      if (!this.history) return [];
      const [query] = args;
      if (!query || typeof query !== 'object') throw new TypeError('History query is required');
      return this.history.query(query as never);
    }
    throw new Error(`Unsupported script RPC: ${method}`);
  }

  private error(started: number, logs: Array<{ level: string; message: string }>, message: string, kind: TScriptErrorKind): IScriptRunResult {
    return { ok: false, durationMs: Date.now() - started, logs, error: { message, kind } };
  }
}
