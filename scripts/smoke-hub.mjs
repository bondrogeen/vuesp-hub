#!/usr/bin/env node
/**
 * End-to-end smoke test for the headless hub npm package.
 *
 * Packs ./dist (unless --tarball is given), installs it into a throw-away
 * prefix, starts the daemon on a free loopback port, checks the UI, auth and
 * API, restarts it against the same data directory and verifies that a clean
 * shutdown and session persistence work.
 *
 *   node scripts/smoke-hub.mjs
 *   node scripts/smoke-hub.mjs --build            # rebuild dist first
 *   node scripts/smoke-hub.mjs --tarball release/vuesp-hub-1.0.0.tgz
 *   node scripts/smoke-hub.mjs --keep             # keep the temp dir
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values } = parseArgs({
  options: {
    tarball: { type: 'string' },
    build: { type: 'boolean', default: false },
    keep: { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (process.platform === 'win32') {
  console.error('This smoke test targets Linux/macOS: the npm bin shim and POSIX modes are checked.');
  process.exit(1);
}

const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  \u2713 ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`  \u2717 ${name}`);
    console.log(`      ${error instanceof Error ? error.message : String(error)}`);
  }
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => (stdout += chunk));
    child.stderr.on('data', chunk => (stderr += chunk));
    child.on('error', reject);
    child.on('exit', code =>
      code === 0
        ? resolve({ stdout, stderr })
        : reject(new Error(`${command} ${args.join(' ')} exited with ${code}\n${stdout}\n${stderr}`)),
    );
  });

const freePort = async () => {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(5000) });
  const text = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    text,
    json: () => JSON.parse(text),
  };
};

const startHub = async ({ bin, dataDir, port, secretKey }) => {
  const child = spawn(bin, ['--port', String(port), '--data-dir', dataDir], {
    env: { ...process.env, VUESP_SECRET_KEY: secretKey },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let log = '';
  const onData = chunk => {
    log += chunk;
    if (process.env.VUESP_SMOKE_VERBOSE === '1') process.stderr.write(chunk);
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  const started = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`hub did not start in 20s\n${log}`)), 20000);
    child.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`hub exited with ${code} before start\n${log}`));
    });
    const interval = setInterval(() => {
      if (log.includes('URL:')) {
        clearInterval(interval);
        clearTimeout(timer);
        resolve(undefined);
      }
    }, 100);
  });

  await started;
  return { child, logs: () => log };
};

const stopHub = async ({ child }) => {
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  const startedAt = Date.now();
  child.kill('SIGTERM');
  const result = await Promise.race([
    exited,
    new Promise(resolve => setTimeout(() => resolve(null), 10000)),
  ]);
  return { ...result, duration: Date.now() - startedAt };
};

const modeOf = filePath => (statSync(filePath).mode & 0o777).toString(8);

const tempDir = mkdtempSync(path.join(tmpdir(), 'vuesp-hub-smoke-'));
let activeHub;
let failed = false;

try {
  console.log(`Temp dir: ${tempDir}`);

  let tarball = values.tarball ? path.resolve(root, values.tarball) : '';

  if (!tarball) {
    if (values.build || !existsSync(path.join(root, 'dist/package.json'))) {
      console.log('\nBuilding hub bundle (npm run build:hub)...');
      await run('npm', ['run', 'build:hub'], { cwd: root });
    }
    console.log('\nPacking dist...');
    await run('npm', ['pack', './dist', '--pack-destination', tempDir], { cwd: root });
    const packed = readdirSync(tempDir).find(file => file.endsWith('.tgz'));
    assert(packed, 'npm pack produced no tarball');
    tarball = path.join(tempDir, packed);
  }

  assert(existsSync(tarball), `tarball not found: ${tarball}`);
  console.log(`Tarball:  ${tarball}`);

  const prefix = path.join(tempDir, 'prefix');
  const dataDir = path.join(tempDir, 'data');
  const secretKey = randomBytes(24).toString('hex');

  console.log('\nInstalling into a throw-away prefix...');
  await run('npm', ['install', '--global', '--prefix', prefix, tarball, '--no-audit', '--no-fund', '--loglevel=error']);

  const bin = path.join(prefix, 'bin/vuesp-hub');
  assert(existsSync(bin), `bin shim missing: ${bin}`);

  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  console.log(`\nStarting hub on ${base}...`);
  activeHub = await startHub({ bin, dataDir, port, secretKey });

  console.log('\nHTTP checks');
  await check('GET / serves the bundled UI', async () => {
    const response = await request(`${base}/`);
    assert(response.status === 200, `status ${response.status}`);
    assert(response.contentType.includes('text/html'), `content-type ${response.contentType}`);
    assert(response.text.includes('id="app"'), 'index.html does not look like the SPA shell');
  });

  await check('GET /dashboard falls back to the SPA shell', async () => {
    const response = await request(`${base}/dashboard`);
    assert(response.status === 200, `status ${response.status}`);
    assert(response.text.includes('id="app"'), 'no SPA fallback');
  });

  await check('GET /api/v1/auth/me rejects anonymous access', async () => {
    const response = await request(`${base}/api/v1/auth/me`);
    assert([401, 403].includes(response.status), `status ${response.status}`);
  });

  await check('POST /api/v1/auth/login returns a token for the default admin', async () => {
    const response = await request(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    });
    assert(response.status === 200, `status ${response.status}: ${response.text}`);
    const session = response.json();
    assert(typeof session.token === 'string' && session.token.length > 10, 'no token in response');
  });

  const login = async () => {
    const response = await request(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' }),
    });
    assert(response.status === 200, `login status ${response.status}`);
    return response.json().token;
  };

  await check('authenticated GET /api/v1/device returns an empty device list', async () => {
    const token = await login();
    const response = await request(`${base}/api/v1/device`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert(response.status === 200, `status ${response.status}: ${response.text}`);
    const devices = response.json();
    assert(Array.isArray(devices) && devices.length === 0, 'expected an empty array');
  });

  await check('authenticated GET /api/v1/auth/me returns the admin user', async () => {
    const token = await login();
    const response = await request(`${base}/api/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert(response.status === 200, `status ${response.status}`);
    assert(response.json().user?.username === 'admin', 'unexpected user payload');
  });

  console.log('\nFilesystem checks');
  await check('data directory is 0700', async () => {
    assert(modeOf(dataDir) === '700', `mode ${modeOf(dataDir)}`);
  });

  for (const file of ['auth.json', 'jwt.secret', 'secret.salt']) {
    await check(`${file} is 0600`, async () => {
      const filePath = path.join(dataDir, file);
      assert(existsSync(filePath), 'file missing');
      assert(modeOf(filePath) === '600', `mode ${modeOf(filePath)}`);
    });
  }

  await check('SQLite database was created', async () => {
    assert(existsSync(path.join(dataDir, 'vuesp.sqlite')), 'vuesp.sqlite missing');
  });

  console.log('\nShutdown and persistence');
  await check('SIGTERM exits cleanly within 10s', async () => {
    const result = await stopHub(activeHub);
    activeHub = undefined;
    assert(result.code === 0, `exit code ${result.code}, signal ${result.signal}`);
    assert(result.duration < 10000, `took ${result.duration}ms`);
  });

  await check('restart against the same data dir keeps the admin session working', async () => {
    activeHub = await startHub({ bin, dataDir, port, secretKey });
    const token = await login();
    assert(token.length > 10, 'no token after restart');
    const response = await request(`${base}/api/v1/device`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert(response.status === 200, `status ${response.status}`);
  });

  if (activeHub) {
    const hub = activeHub;
    activeHub = undefined;
    await check('second shutdown exits cleanly', async () => {
      const result = await stopHub(hub);
      assert(result.code === 0, `exit code ${result.code}`);
    });
  }
} catch (error) {
  failed = true;
  console.error(`\nSmoke test aborted: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  if (activeHub) {
    activeHub.child.kill('SIGKILL');
  }
  if (!values.keep) {
    rmSync(tempDir, { recursive: true, force: true });
  } else {
    console.log(`\nKept temp dir: ${tempDir}`);
  }
}

const failedChecks = results.filter(result => !result.ok);
console.log(`\n${results.length - failedChecks.length}/${results.length} checks passed`);
if (failedChecks.length > 0 || failed) {
  for (const result of failedChecks) {
    console.log(`  \u2717 ${result.name}: ${result.error instanceof Error ? result.error.message : result.error}`);
  }
  process.exit(1);
}
console.log('Headless hub package smoke test passed.');
