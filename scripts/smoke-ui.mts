import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { cp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import WebSocket from 'ws';

import { DeviceRuntime } from '@core/application/deviceRuntime.ts';
import { createAuthService } from '@server/modules/auth/application/authService.ts';
import { server } from '@server/app/server.ts';
import { createModuleHost } from '@server/module-host/moduleHost.ts';

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
  getMenu() {
    return [{
      id: 1,
      recordId: 1,
      ip: '192.0.2.5',
      name: 'Lamp',
      menu: [
        { name: 'menu.dashboard', path: '/dashboard' },
        { name: 'menu.settings', path: '/settings' },
      ],
    }];
  }
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

const modulesDirectory = path.join(temp, 'modules');
const moduleHost = createModuleHost({
  modulesDirectory,
  dataDirectory: temp,
  runnerPath: path.resolve('server/module-host/module-runner.cjs'),
});
const moduleSource = path.join(temp, 'vuesp-hub.hello');
await cp(path.resolve('modules-dev/hello'), moduleSource, { recursive: true });
await moduleHost.install(moduleSource);
await moduleHost.start('vuesp-hub.hello');

const appPort = await freePort();
const app = server({
  staticDirectory: path.resolve('dist/web'),
  deviceRuntime: runtime as never,
  getDeviceModel: async () => ({
    getAll: () => [{ id: 1, uuid: 'smoke', deviceId: 1, name: 'Lamp', ip: '192.0.2.5', firmware: [], addedAt: new Date(0).toISOString() }],
    getById: () => ({ id: 1, uuid: 'smoke', deviceId: 1, name: 'Lamp', ip: '192.0.2.5', firmware: [], addedAt: new Date(0).toISOString(), username: '', password: '' }),
  }) as never,
  storeModel: () => ({}) as never,
  serialSettingsStore: { get: () => undefined, set: () => {} },
  auth: createAuthService({ dataDirectory: temp }),
  moduleHost,
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
let { token } = (await login.json()) as { token: string };

// The bootstrap admin starts with a password-change flag. Clear it before the
// UI smoke test so the router does not redirect to /auth/change-password.
const changed = await fetch(`${base}/api/v1/auth/change-password`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: JSON.stringify({ currentPassword: 'admin', newPassword: 'admin123' }),
});
if (changed.ok) {
  token = ((await changed.json()) as { token: string }).token;
}

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

socket.on('close', (code, reason) => console.log('CDP closed:', code, String(reason)));
socket.on('error', error => console.log('CDP error:', error.message));
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
  const result = (await Promise.race([
    send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`evaluate timeout: ${expression.slice(0, 80)}`)), 5000)),
  ])) as { result?: { value?: unknown } };
  return result.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
const viewportWidth = Number(process.env.UI_WIDTH ?? 1440);
const viewportHeight = Number(process.env.UI_HEIGHT ?? 900);
await send('Emulation.setDeviceMetricsOverride', { width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1, mobile: viewportWidth < 768 });
await waitFor(async () => (await evaluate('document.readyState')) === 'complete', 'login page');
await evaluate(`localStorage.setItem('vuesp-auth-token', ${JSON.stringify(token)})`);
await send('Page.navigate', { url: `${base}/dashboard` });

await waitFor(async () => await evaluate('Boolean(document.querySelector("section .grid button"))'), 'dashboard tiles');

const buttonCount = await evaluate('document.querySelectorAll("section .grid button").length');
console.log(`tile buttons: ${buttonCount}`);

if (process.env.UI_SHOT) {
  await evaluate('document.querySelector("section .grid > div").click()');
  await delay(600);
  const metrics = await evaluate('JSON.stringify({ viewport: [innerWidth, innerHeight], dialog: (() => { const el = [...document.querySelectorAll("body > div")].map(e => e.querySelector("h4")?.closest("div")?.parentElement).find(Boolean); const r = el?.getBoundingClientRect(); return r ? { top: r.top, height: r.height } : null; })() })');
  console.log('metrics:', metrics);
  const shot = (await send('Page.captureScreenshot', { format: 'png' })) as { data: string };
  writeFileSync('/tmp/opencode/dashboard-modal.png', Buffer.from(shot.data, 'base64'));
  console.log('screenshot: /tmp/opencode/dashboard-modal.png');
  await evaluate('document.querySelector("h4")?.parentElement?.parentElement?.querySelector("button")?.click()');
}
await evaluate('document.querySelector("section .grid button").click()');
await delay(800);

console.log('sends:', JSON.stringify(sends));
console.log('console:', JSON.stringify(logs.slice(-10)));

// --- menu nesting -----------------------------------------------------------
await evaluate('document.querySelector(\'aside a[href="/device/list/"]\')?.closest("li")?.querySelector("button")?.click(); true');
await delay(400);
const deviceLinks = JSON.parse(
  (await evaluate(`JSON.stringify([...document.querySelectorAll('aside a[href^="/device/192.0.2.5"]')].map((a) => a.getAttribute("href")))`)) as string,
) as string[];
console.log('device menu links:', JSON.stringify(deviceLinks));

await send('Page.navigate', { url: `${base}/device/192.0.2.5/dashboard` });
await waitFor(async () => await evaluate('Boolean(document.querySelector(\'aside a[href="/device/192.0.2.5/dashboard/"]\'))'), 'device submenu');
const nestedLinks = JSON.parse(
  (await evaluate(`JSON.stringify([...document.querySelectorAll('aside a[href^="/device/192.0.2.5"]')].map((a) => a.getAttribute("href")))`)) as string,
) as string[];
console.log('nested links:', JSON.stringify(nestedLinks));

// --- module web component ---------------------------------------------------
await send('Page.navigate', { url: `${base}/modules/vuesp-hub.hello` });
await waitFor(
  async () => await evaluate('Boolean(document.querySelector("vuesp-module-hello")?.shadowRoot?.textContent?.includes("vuesp-hub.hello"))'),
  'module web component',
);
const moduleUi = await evaluate('document.querySelector("vuesp-module-hello")?.shadowRoot?.querySelector(".panel")?.innerText?.replace(/\\s+/g, " ").trim().slice(0, 200)');
console.log('module ui:', moduleUi);

socket.close();
chrome.kill('SIGKILL');
await moduleHost.stopAll();
await app.closeExpress();

const commandsOk = sends.length > 0 && sends[0].comm === 'DEVICE' && sends[0].target === '192.0.2.5';
const menuOk = deviceLinks.includes('/device/192.0.2.5/') && nestedLinks.includes('/device/192.0.2.5/dashboard/');
const moduleOk = typeof moduleUi === 'string' && moduleUi.includes('vuesp-hub.hello');

const ok = commandsOk && menuOk && moduleOk;
console.log(ok ? 'E2E OK' : 'E2E FAILED');
process.exit(ok ? 0 : 1);
