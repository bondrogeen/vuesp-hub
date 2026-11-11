import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { cp, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { c as createTar } from 'tar';

import { createModuleHost } from '@server/module-host/moduleHost.ts';

test('installs and runs a module in a separate process', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-'));
  const modulesDirectory = path.join(root, 'modules');
  const dataDirectory = path.join(root, 'data');
  const source = path.join(root, 'hello');
  await cp(path.resolve('modules-dev/hello'), source, { recursive: true });

  const host = createModuleHost({
    modulesDirectory,
    dataDirectory,
    runnerPath: path.resolve('server/module-host/module-runner.cjs'),
  });

  try {
    const manifest = await host.install(source);
    assert.equal(manifest.id, 'vuesp-hub.hello');

    await host.start('vuesp-hub.hello');

    const modules = await host.list();
    assert.equal(modules.length, 1);
    assert.equal(modules[0].manifest.id, 'vuesp-hub.hello');
    assert.equal(modules[0].running, true);
    assert.ok(host.logs('vuesp-hub.hello').some(entry => entry.message.includes('hello module started')));

    const storage = JSON.parse(
      await readFile(path.join(dataDirectory, 'module-data', 'vuesp-hub.hello', 'storage.json'), 'utf8')
    ) as Record<string, unknown>;
    assert.equal(storage.starts, 1);

    await host.stop('vuesp-hub.hello');
    const stopped = await host.list();
    assert.equal(stopped[0].running, false);
  } finally {
    await host.stopAll();
    await rm(root, { recursive: true, force: true });
  }
});

test('installs a module from a gzipped .vmod archive', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-archive-'));
  const modulesDirectory = path.join(root, 'modules');
  const dataDirectory = path.join(root, 'data');
  const source = path.join(root, 'hello');
  const archive = path.join(root, 'vuesp-hub.hello-0.1.0.vmod');
  await cp(path.resolve('modules-dev/hello'), source, { recursive: true });
  await createTar({ file: archive, gzip: true, cwd: source }, ['.']);

  const host = createModuleHost({
    modulesDirectory,
    dataDirectory,
    runnerPath: path.resolve('server/module-host/module-runner.cjs'),
  });

  try {
    const manifest = await host.install(archive);
    assert.equal(manifest.id, 'vuesp-hub.hello');
    await host.start('vuesp-hub.hello');
    assert.equal((await host.list())[0].running, true);
    await host.stopAll();
  } finally {
    await host.stopAll();
    await rm(root, { recursive: true, force: true });
  }
});

test('proxies HTTP requests to the module process', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-http-'));
  const modulesDirectory = path.join(root, 'modules');
  const dataDirectory = path.join(root, 'data');
  const source = path.join(root, 'hello');
  await cp(path.resolve('modules-dev/hello'), source, { recursive: true });

  const host = createModuleHost({
    modulesDirectory,
    dataDirectory,
    runnerPath: path.resolve('server/module-host/module-runner.cjs'),
  });
  await host.install(source);
  await host.start('vuesp-hub.hello');

  const gateway = createServer((request, response) => {
    host.proxy('vuesp-hub.hello', request, response, '/modules/vuesp-hub.hello');
  });

  try {
    const port = await new Promise<number>(resolve => {
      gateway.listen(0, '127.0.0.1', () => {
        const address = gateway.address();
        resolve(typeof address === 'object' && address ? address.port : 0);
      });
    });

    const response = await fetch(`http://127.0.0.1:${port}/modules/vuesp-hub.hello/state`);
    assert.equal(response.status, 200);
    const state = (await response.json()) as { id: string };
    assert.equal(state.id, 'vuesp-hub.hello');
  } finally {
    await new Promise<void>(resolve => gateway.close(() => resolve()));
    await host.stopAll();
    await rm(root, { recursive: true, force: true });
  }
});

test('derives grouped public routes and rejects conflicts', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-routes-'));
  const modulesDirectory = path.join(root, 'modules');
  const dataDirectory = path.join(root, 'data');
  const host = createModuleHost({
    modulesDirectory,
    dataDirectory,
    runnerPath: path.resolve('server/module-host/module-runner.cjs'),
  });

  const makeModule = async (name: string, manifest: Record<string, unknown>) => {
    const directory = path.join(root, name);
    await cp(path.resolve('modules-dev/hello'), directory, { recursive: true });
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
    return directory;
  };

  const base = {
    name: 'Test module',
    version: '1.0.0',
    apiVersion: 1,
    entry: 'server/index.cjs',
    group: { id: 'vuesp-hub.video', slug: 'video', name: 'Видео' },
  };

  try {
    await host.install(await makeModule('first', { ...base, id: 'vuesp-hub.test.first', slug: 'rtc' }));
    const resolved = await host.resolve('/modules/video/rtc/web/entry.js');
    assert.equal(resolved?.info.manifest.id, 'vuesp-hub.test.first');
    assert.equal(resolved?.relative, '/web/entry.js');

    await assert.rejects(
      host.install(await makeModule('second', { ...base, id: 'vuesp-hub.test.second', slug: 'rtc' })),
      /already used by vuesp-hub\.test\.first/,
    );

    const ungrouped = await makeModule('plain', {
      id: 'vuesp-hub.test.plain',
      name: 'Plain',
      version: '1.0.0',
      apiVersion: 1,
      entry: 'server/index.cjs',
    });
    await host.install(ungrouped);
    assert.equal((await host.resolve('/modules/vuesp-hub.test.plain'))?.info.manifest.id, 'vuesp-hub.test.plain');
  } finally {
    await host.stopAll();
    await rm(root, { recursive: true, force: true });
  }
});

test('downloads and verifies module assets', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-module-assets-'));
  const modulesDirectory = path.join(root, 'modules');
  const dataDirectory = path.join(root, 'data');
  const payload = Buffer.from('fake-ffmpeg-binary');
  const digest = createHash('sha256').update(payload).digest('hex');
  const assetServer = createServer((_request, response) => {
    response.setHeader('content-type', 'application/octet-stream');
    response.end(payload);
  });
  const port = await new Promise<number>(resolve => {
    assetServer.listen(0, '127.0.0.1', () => {
      const address = assetServer.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });

  const source = path.join(root, 'asset-module');
  await cp(path.resolve('modules-dev/hello'), source, { recursive: true });
  await writeFile(
    path.join(source, 'manifest.json'),
    JSON.stringify({
      id: 'vuesp-hub.asset-test',
      name: 'Asset test',
      version: '1.0.0',
      apiVersion: 1,
      entry: 'server/index.cjs',
      assets: [{
        id: 'ffmpeg',
        url: `http://127.0.0.1:${port}/ffmpeg`,
        sha256: digest,
        size: payload.length,
        installTo: 'native/ffmpeg',
        mode: '0755',
      }],
    }, null, 2),
  );

  const host = createModuleHost({
    modulesDirectory,
    dataDirectory,
    runnerPath: path.resolve('server/module-host/module-runner.cjs'),
  });

  try {
    await host.install(source);
    const installed = await readFile(path.join(modulesDirectory, 'vuesp-hub.asset-test', 'native', 'ffmpeg'));
    assert.deepEqual(installed, payload);
    const mode = (await stat(path.join(modulesDirectory, 'vuesp-hub.asset-test', 'native', 'ffmpeg'))).mode & 0o777;
    assert.equal(mode, 0o755);
    assert.ok((await readdir(path.join(dataDirectory, 'module-cache'))).includes(digest));
  } finally {
    await new Promise<void>(resolve => assetServer.close(() => resolve()));
    await host.stopAll();
    await rm(root, { recursive: true, force: true });
  }
});
