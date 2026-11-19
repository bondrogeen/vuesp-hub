/* eslint-disable @typescript-eslint/no-require-imports -- Node CJS sandbox entry, bundlers are not involved */
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');

const pending = new Map();
let logs = 0;

const sendLog = (level, message) => {
  if (logs >= 100) return;
  logs += 1;
  process.send?.({ type: 'log', level, message: String(message).slice(0, 2_000) });
};

const rpc = (method, args) => new Promise((resolve, reject) => {
  const id = randomUUID();
  pending.set(id, { resolve, reject });
  process.send?.({ type: 'rpc', id, method, args });
});

process.on('message', async message => {
  if (!message || typeof message !== 'object') return;

  if (message.type === 'rpc_result') {
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(String(message.error)));
    else entry.resolve(message.result);
    return;
  }

  if (message.type !== 'run') return;

  const code = String(message.code ?? '');
  const timeoutMs = Number(message.timeoutMs) || 2_000;
  const sandbox = {
    console: {
      log: (...args) => sendLog('info', args.join(' ')),
      warn: (...args) => sendLog('warn', args.join(' ')),
      error: (...args) => sendLog('error', args.join(' ')),
    },
    getEntity: (...args) => rpc('getEntity', args),
    setEntity: (...args) => rpc('setEntity', args),
    queryHistory: (...args) => rpc('queryHistory', args),
    log: (level, text) => sendLog(level, text),
    now: () => Date.now(),
    sleep: ms => new Promise(resolve => setTimeout(resolve, Math.min(Math.max(Number(ms) || 0, 0), timeoutMs))),
  };

  try {
    vm.createContext(sandbox);
    const script = new vm.Script(`(async () => {\n${code}\n})()`);
    const result = await script.runInContext(sandbox, { timeout: timeoutMs });
    process.send?.({ type: 'result', result });
  } catch (error) {
    process.send?.({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});

process.on('uncaughtException', error => {
  process.send?.({ type: 'error', message: error instanceof Error ? error.message : String(error) });
});
process.on('unhandledRejection', error => {
  process.send?.({ type: 'error', message: error instanceof Error ? error.message : String(error) });
});
