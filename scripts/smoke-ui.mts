import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync, mkdtempSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import WebSocket from 'ws';

import { DeviceRuntime } from '../core/application/deviceRuntime.ts';
import { createAuthService } from '../server/auth/authService.ts';
import { server } from '../server/server.ts';

/**
 * UI smoke test: serves the built web UI with a stub device runtime, opens the
 * dashboard in headless Chrome, clicks a tile button and asserts that the
 * expected device message (comm + payload) is dispatched.
 *
 *   npm run smoke:ui
 *   CHROME_BIN=/path/to/chrome npm run smoke:ui
 */
const temp = mkdtempSync(path.join(tmpdir(), 'vuesp-ui-e2e-'));
const sends: Array<{ target: string; comm: string; data: unknown }> = [];

const tiles = [
  {
    id: 'device.output.1',
    name: 'output.1',
    type: 'button',
    icon: 'bulb',
    args: ['device.output', 'device'],
    get: '(v & 1 ? 0 : 1)',
    getTo: "v ? 'ON' : 'OFF'",
    set: '({...a, output: v ? (a.output &= ~1) : (a.output |= 1), command: 2 })',
  },
];

class FakeManager extends EventEmitter {
  connection() {}
  disconnection() {}
  getMenu() { return []; }
  getList() { return [{ id: 1, ip: '192.0.2.5', name: 'Lamp', list: tiles }]; }
  onSend(target: string, comm: string, data?: unknown) { sends.push({ target, comm, data }); return true; }
  onSendAll() { return true; }
}

const manager = new FakeManager();

const runtime = new DeviceRuntime({
  loadDevices: async () => [{}],
  createConnections: () => manager as never,
});

const freePort = async () => {
  const probe = createServer();
  await new Promise<void>(resolve => probe.listen(0, '127.0.0.1', resolve));
  const address = probe.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise(resolve => probe.close(resolve));
  return port;
};

const appPort = await freePort();
const app = server({
  staticDirectory: path.resolve('dist/web'),
  deviceRuntime: runtime as never,
  getDeviceModel: async () => ({ getAll: () => [] }) as never,
  storeModel: () => ({}) as never,
  serialSettingsStore: { get: () => undefined, set: () => {} },
  auth: createAuthService({ dataDirectory: temp }),
  host: '127.0.0.1',
  port: appPort,
});

await app.createExpress();
await runtime.start();
manager.emit('*', { event: 'message', id: 1, ip: '192.0.2.5', name: 'Lamp', key: 'INFO', data: { id: 1, name: 'Lamp' } });
manager.emit('*', { event: 'message', id: 1, ip: '192.0.2.5', name: 'Lamp', key: 'DEVICE', data: { key: 6, command: 0, input: 0, output: 0, now: 0 } });
manager.emit('*', { event: 'message', id: 1, ip: '192.0.2.5', name: 'Lamp', key: 'PING', data: { delta: 100 } });

const base = `http://127.0.0.1:${appPort}`;
const login = await fetch(`${base}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin' }),
});
const { token } = (await login.json()) as { token: string };

// --- headless Chrome via CDP -------------------------------------------------
const cdpPort = await freePort();
const chromeBinary = process.env.CHROME_BIN ?? ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(existsSync);
if (!chromeBinary) {
  console.error('Chrome/Chromium not found. Set CHROME_BIN to run this smoke test.');
  process.exit(1);
}

const chrome = spawn(
  chromeBinary,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${path.join(temp, 'chrome')}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'ignore'] },
);

const waitFor = async (fn: () => Promise<unknown>, label: string, timeout = 15000) => {
  const started = Date.now();
  for (;;) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      // keep polling
    }
    if (Date.now() - started > timeout) throw new Error(`timed out waiting for ${label}`);
    await delay(200);
  }
};

await waitFor(async () => (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).ok, 'chrome');

const tabResponse = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(`${base}/auth/login`)}`, { method: 'PUT' });
const tab = (await tabResponse.json()) as { webSocketDebuggerUrl: string };

const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise<void>((resolve, reject) => {
  socket.once('open', resolve);
  socket.once('error', reject);
});

let nextId = 1;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
const logs: string[] = [];

socket.on('message', raw => {
  const message = JSON.parse(String(raw)) as { id?: number; result?: unknown; error?: { message: string }; method?: string; params?: { args?: Array<{ value?: unknown }> } };
  if (message.id && pending.has(message.id)) {
    const entry = pending.get(message.id)!;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error.message));
    else entry.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.consoleAPICalled') {
    const params = message.params as unknown as { type?: string; args?: Array<{ value?: unknown; description?: string; type?: string }> };
    logs.push(`${params.type}: ${params.args?.map(arg => arg.value ?? arg.description ?? arg.type).join(' ')}`);
  }
  if (message.method === 'Runtime.exceptionThrown') {
    const params = message.params as unknown as { exceptionDetails?: { text?: string; exception?: { description?: string } } };
    logs.push(`EXCEPTION: ${params.exceptionDetails?.exception?.description ?? params.exceptionDetails?.text}`);
  }
});

const send = (method: string, params: Record<string, unknown> = {}) =>
  new Promise<unknown>((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

const evaluate = async (expression: string) => {
  const result = (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })) as { result?: { value?: unknown } };
  return result.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'login page');
await evaluate(`localStorage.setItem('vuesp-auth-token', ${JSON.stringify(token)})`);
await send('Page.navigate', { url: `${base}/dashboard` });

await waitFor(async () => await evaluate('Boolean(document.querySelector("section .grid button"))'), 'dashboard tiles');

const buttonCount = await evaluate('document.querySelectorAll("section .grid button").length');
console.log(`tile buttons: ${buttonCount}`);
await evaluate('document.querySelector("section .grid button").click()');
await delay(800);

console.log('sends:', JSON.stringify(sends));
console.log('console:', JSON.stringify(logs.slice(-10)));

socket.close();
chrome.kill('SIGKILL');
await app.closeExpress();

const ok = sends.length > 0 && sends[0].comm === 'DEVICE' && sends[0].target === '192.0.2.5';
console.log(ok ? 'E2E OK' : 'E2E FAILED');
process.exit(ok ? 0 : 1);
