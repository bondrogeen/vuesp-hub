'use strict';

const nodeHttp = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const moduleDir = path.resolve(process.argv[2] || '.');
const entry = process.argv[3] || 'server/index.cjs';
const moduleId = process.argv[4] || path.basename(moduleDir);

let nextRequestId = 0;
const pending = new Map();
let deactivate;
let httpServer;

const send = payload => {
  if (process.connected) process.send(payload);
};

const rpc = (method, params) =>
  new Promise((resolve, reject) => {
    const id = ++nextRequestId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Module RPC timeout: ${method}`));
    }, 10_000);
    pending.set(id, { resolve, reject, timer });
    send({ type: 'rpc', id, method, params });
  });

const closeHttp = () =>
  new Promise(resolve => {
    if (!httpServer) return resolve();
    httpServer.close(() => resolve());
    httpServer = undefined;
  });

let shuttingDown = false;

const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  Promise.resolve()
    .then(() => deactivate?.())
    .catch(error => send({ type: 'log', level: 'error', message: String(error?.message || error) }))
    .then(() => closeHttp())
    .finally(() => process.exit(0));
};

// The IPC channel closes when the hub exits, including an abrupt SIGKILL.
// Without this the module process (and its FFmpeg children) would be orphaned.
process.on('disconnect', shutdown);

process.on('message', message => {
  if (!message || typeof message !== 'object') return;
  if (message.type === 'rpc_result') {
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    clearTimeout(item.timer);
    if (message.error) item.reject(new Error(String(message.error)));
    else item.resolve(message.result);
    return;
  }
  if (message.type === 'shutdown') shutdown();
});

const toMessage = args =>
  args.map(value => (typeof value === 'string' ? value : JSON.stringify(value))).join(' ');

const createContext = async () => {
  const manifest = JSON.parse(await readFile(path.join(moduleDir, 'manifest.json'), 'utf8'));
  const permissions = new Set(Array.isArray(manifest.permissions) ? manifest.permissions : []);
  const allowNetwork = permissions.size === 0 || permissions.has('network');

  return {
    manifest,
    id: moduleId,
    log: (...args) => send({ type: 'log', level: 'info', message: toMessage(args) }),
    warn: (...args) => send({ type: 'log', level: 'warn', message: toMessage(args) }),
    error: (...args) => send({ type: 'log', level: 'error', message: toMessage(args) }),
    storage: {
      get: key => rpc('storage.get', { key }),
      set: (key, value) => rpc('storage.set', { key, value }),
    },
    auth: {
      /** Verifies a module-scoped token through the hub auth service. */
      verify: token => rpc('auth.verify', { token }),
    },
    http: {
      fetch: (input, init) => {
        if (!allowNetwork) throw new Error('Module has no network permission');
        return globalThis.fetch(input, init);
      },
    },
    routes: {
      /**
       * Registers the module HTTP listener; the host proxies /modules/<id>/*
       * here. Resolves to the Node server so the module can attach Socket.IO
       * or other upgrade handlers.
       */
      serve: handler =>
        new Promise((resolve, reject) => {
          if (httpServer) throw new Error('Module routes are already served');
          httpServer = nodeHttp.createServer((request, response) => {
            try {
              handler(request, response);
            } catch (error) {
              send({ type: 'log', level: 'error', message: String(error?.message || error) });
              response.statusCode = 500;
              response.end('Module handler failed');
            }
          });
          httpServer.once('error', reject);
          httpServer.listen(0, '127.0.0.1', () => {
            const address = httpServer.address();
            if (!address || typeof address === 'string') {
              reject(new Error('Module HTTP server did not start'));
              return;
            }
            send({ type: 'http-ready', port: address.port });
            resolve(httpServer);
          });
        }),
    },
  };
};

const loadModule = async file => {
  try {
    const loaded = await import(pathToFileURL(file).href);
    return loaded;
  } catch (error) {
    try {
      return require(file);
    } catch {
      throw error;
    }
  }
};

const main = async () => {
  const file = path.resolve(moduleDir, entry);
  if (!file.startsWith(`${moduleDir}${path.sep}`)) throw new Error('Module entry escapes module directory');

  const loaded = await loadModule(file);
  const module = loaded.default && typeof loaded.default === 'object' ? loaded.default : loaded;
  const activate = module.activate || loaded.activate;
  deactivate = module.deactivate || loaded.deactivate;
  if (typeof activate !== 'function') throw new Error('Module must export activate(ctx)');

  const ctx = await createContext();
  const result = await activate(ctx);
  send({ type: 'ready', result });
};

main().catch(error => {
  send({ type: 'error', message: error?.stack || String(error) });
  process.exit(1);
});

process.on('uncaughtException', error => {
  send({ type: 'error', message: error?.stack || String(error) });
  process.exit(1);
});
process.on('unhandledRejection', error => {
  send({ type: 'error', message: error?.stack || String(error) });
  process.exit(1);
});
