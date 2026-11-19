import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import express from 'express';
import { c as createTar } from 'tar';

import type { IReleaseManifest } from '@core/application/release.ts';
import { ReleaseLayout, canonicalManifest } from '@server/modules/update/application/releaseService.ts';
import { UpdateManager } from '@server/modules/update/application/updateManager.ts';
import { createUpdateRouter } from '@server/modules/update/api/updateRoutes.ts';

const setup = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-update-manager-'));
  const source = path.join(root, 'source');
  await mkdir(source, { recursive: true });
  await writeFile(path.join(source, 'package.json'), JSON.stringify({ version: '1.1.0' }));
  const artifact = path.join(root, 'release.tgz');
  await createTar({ file: artifact, gzip: true, cwd: source }, ['.']);

  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const manifest: IReleaseManifest = {
    appVersion: '1.1.0',
    channel: 'stable',
    releasedAt: new Date().toISOString(),
    platform: 'linux-x64',
    url: 'https://example.invalid/release.tgz',
    sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
    signature: '',
    dataSchema: 1,
    moduleApiVersion: 2,
    cloudProtocol: 1,
    size: (await stat(artifact)).size,
  };
  manifest.signature = sign(null, Buffer.from(canonicalManifest(manifest)), privateKey).toString('base64');
  const manifestPath = path.join(root, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest));

  const layout = new ReleaseLayout(root);
  await mkdir(path.join(root, 'releases', '1.0.0'), { recursive: true });
  await layout.switchTo('1.0.0');

  return {
    root,
    artifact,
    manifest,
    privateKey,
    manifestPath,
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    layout,
    statePath: path.join(root, 'update-state.json'),
  };
};

test('update manager reports status, checks, applies and rolls back', async () => {
  const { root, artifact, manifestPath, publicKey, layout, statePath } = await setup();
  try {
    const manager = new UpdateManager({
      releaseRoot: root,
      statePath,
      publicKey,
      manifestSource: manifestPath,
      currentVersion: '1.0.0',
      currentDataSchema: 1,
    });

    const initial = await manager.status();
    assert.equal(initial.enabled, true);
    assert.equal(initial.current, '1.0.0');
    assert.deepEqual(initial.releases, ['1.0.0']);

    const check = await manager.check(artifact);
    assert.equal(check.available, true);
    assert.equal(check.manifest?.appVersion, '1.1.0');

    const result = await manager.apply(artifact);
    assert.equal(result.status, 'done');
    assert.equal(await layout.currentVersion(), '1.1.0');
    assert.equal((await manager.status()).state?.status, 'done');

    const rolled = await manager.rollback();
    assert.deepEqual(rolled, { from: '1.1.0', to: '1.0.0' });
    assert.equal(await layout.currentVersion(), '1.0.0');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('downloads the artifact when only a manifest source is present', async () => {
  const { root, artifact, manifest, privateKey, publicKey, layout, statePath } = await setup();
  const server = createServer((_request, response) => {
    response.setHeader('content-type', 'application/octet-stream');
    createReadStream(artifact).pipe(response);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const manifestPath = path.join(root, 'manifest-download.json');

  try {
    const signed: IReleaseManifest = { ...manifest, url: `http://127.0.0.1:${address.port}/release.tgz` };
    signed.signature = sign(null, Buffer.from(canonicalManifest(signed)), privateKey).toString('base64');
    await writeFile(manifestPath, JSON.stringify(signed));

    const manager = new UpdateManager({
      releaseRoot: root,
      statePath,
      publicKey,
      manifestSource: manifestPath,
      currentVersion: '1.0.0',
      currentDataSchema: 1,
    });
    const result = await manager.apply();
    assert.equal(result.status, 'done');
    assert.equal(await layout.currentVersion(), '1.1.0');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
    await rm(root, { recursive: true, force: true });
  }
});

test('disabled update manager and API guards', async () => {
  const { root, publicKey, statePath } = await setup();
  const manager = new UpdateManager({
    releaseRoot: root,
    statePath,
    currentVersion: '1.0.0',
    currentDataSchema: 1,
  });
  const app = express();
  app.use(express.json());
  app.use('/update', createUpdateRouter(manager, { selfUpdate: false, onExit: () => undefined }));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}/update`;

  try {
    const status = await (await fetch(base)).json();
    assert.equal(status.enabled, false);
    assert.equal(status.selfUpdate, false);

    const apply = await fetch(`${base}/apply`, { method: 'POST', headers: { 'content-type': 'application/json' } });
    assert.equal(apply.status, 409);
    assert.equal((await apply.json()).code, 'SELF_UPDATE_DISABLED');

    // A configured-but-unsigned manager fails the check before touching files.
    const configured = new UpdateManager({
      releaseRoot: root,
      statePath,
      publicKey,
      manifestSource: path.join(root, 'missing.json'),
      currentVersion: '1.0.0',
      currentDataSchema: 1,
    });
    await assert.rejects(configured.check(), /ENOENT|no such file/i);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
    await rm(root, { recursive: true, force: true });
  }
});
