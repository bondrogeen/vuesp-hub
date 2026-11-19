import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { c as createTar } from 'tar';

import type { IReleaseManifest } from '@core/application/release.ts';
import { ReleaseLayout, UpdateService, canonicalManifest, verifyManifest } from '@server/modules/update/application/releaseService.ts';

const setup = async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'vuesp-release-'));
  const source = path.join(root, 'source');
  await mkdir(source, { recursive: true });
  await writeFile(path.join(source, 'package.json'), JSON.stringify({ version: '1.1.0' }));
  const archive = path.join(root, 'release.tgz');
  await createTar({ file: archive, gzip: true, cwd: source }, ['.']);
  const hash = createHash('sha256').update(await readFile(archive)).digest('hex');
  const size = (await stat(archive)).size;
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const manifest: IReleaseManifest = {
    appVersion: '1.1.0',
    channel: 'stable',
    releasedAt: new Date().toISOString(),
    platform: 'linux-x64',
    url: 'https://example.invalid/release.tgz',
    sha256: hash,
    signature: '',
    dataSchema: 1,
    moduleApiVersion: 2,
    cloudProtocol: 1,
    size,
  };
  manifest.signature = sign(null, Buffer.from(canonicalManifest(manifest)), privateKey).toString('base64');

  const layout = new ReleaseLayout(root);
  await mkdir(path.join(root, 'releases', '1.0.0'), { recursive: true });
  await layout.switchTo('1.0.0');
  const statePath = path.join(root, 'update-state.json');
  return { root, archive, manifest, privateKey, publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(), layout, statePath };
};

test('verifies a signed release manifest and applies it atomically', async () => {
  const { root, archive, manifest, publicKey, layout, statePath } = await setup();
  const events: string[] = [];
  const service = new UpdateService({
    layout,
    statePath,
    publicKey,
    currentVersion: '1.0.0',
    currentDataSchema: 1,
    hooks: {
      backup: async () => { events.push('backup'); },
      stop: async () => { events.push('stop'); },
      migrate: async schema => { events.push(`migrate:${schema}`); },
      start: async () => { events.push('start'); },
      health: () => true,
    },
  });
  assert.equal((await service.verify(manifest, archive)).ok, true);
  const result = await service.apply(manifest, archive);
  assert.equal(result.ok, true);
  assert.equal(await layout.currentVersion(), '1.1.0');
  assert.deepEqual(events, ['backup', 'stop', 'migrate:1', 'start']);
  assert.equal((await service.readState())?.status, 'done');
  await rm(root, { recursive: true, force: true });
});

test('rejects a tampered manifest and rolls back a failed health check', async () => {
  const { root, archive, manifest, publicKey, layout, statePath } = await setup();
  const tampered = { ...manifest, appVersion: '1.2.0' };
  assert.equal(verifyManifest(tampered, publicKey).ok, false);

  const service = new UpdateService({
    layout,
    statePath,
    publicKey,
    currentVersion: '1.0.0',
    currentDataSchema: 1,
    hooks: { health: () => false, start: async () => undefined },
  });
  const result = await service.apply(manifest, archive);
  assert.equal(result.ok, false);
  assert.equal(result.status, 'rolled_back');
  assert.equal(await layout.currentVersion(), '1.0.0');
  await rm(root, { recursive: true, force: true });
});

test('applies sequential N-1 updates and rolls back to the previous release', async () => {
  const { root, archive, manifest, privateKey, publicKey, layout, statePath } = await setup();
  const first = new UpdateService({ layout, statePath, publicKey, currentVersion: '1.0.0', currentDataSchema: 1 });
  assert.equal((await first.apply(manifest, archive)).status, 'done');
  assert.equal(await layout.currentVersion(), '1.1.0');

  const source = path.join(root, 'source-1.2.0');
  await mkdir(source, { recursive: true });
  await writeFile(path.join(source, 'package.json'), JSON.stringify({ version: '1.2.0' }));
  const nextArchive = path.join(root, 'release-1.2.0.tgz');
  await createTar({ file: nextArchive, gzip: true, cwd: source }, ['.']);
  const nextManifest: IReleaseManifest = {
    ...manifest,
    appVersion: '1.2.0',
    sha256: createHash('sha256').update(await readFile(nextArchive)).digest('hex'),
    size: (await stat(nextArchive)).size,
  };
  nextManifest.signature = sign(null, Buffer.from(canonicalManifest(nextManifest)), privateKey).toString('base64');

  const second = new UpdateService({ layout, statePath, publicKey, currentVersion: '1.1.0', currentDataSchema: 1 });
  assert.equal((await second.verify(nextManifest, nextArchive)).ok, true);
  assert.equal((await second.apply(nextManifest, nextArchive)).status, 'done');
  assert.equal(await layout.currentVersion(), '1.2.0');
  assert.deepEqual(await layout.list(), ['1.0.0', '1.1.0', '1.2.0']);

  await layout.rollbackTo('1.1.0');
  assert.equal(await layout.currentVersion(), '1.1.0');
  await rm(root, { recursive: true, force: true });
});

test('reconciles an update interrupted by a power loss', async () => {
  const { root, layout, statePath, publicKey } = await setup();
  const interrupted = { status: 'migrating', fromVersion: '1.0.0', toVersion: '1.1.0', at: 1 };
  await writeFile(statePath, JSON.stringify(interrupted));
  const service = new UpdateService({ layout, statePath, publicKey, currentVersion: '1.0.0', currentDataSchema: 1 });

  const rolledBack = await service.recover();
  assert.equal(rolledBack?.status, 'rolled_back');
  assert.match(rolledBack?.error ?? '', /interrupted/);
  assert.equal(await layout.currentVersion(), '1.0.0');

  // A release that finished installing before the crash is confirmed by health.
  await mkdir(path.join(root, 'releases', '1.1.0'), { recursive: true });
  await layout.switchTo('1.1.0');
  await writeFile(statePath, JSON.stringify({ status: 'starting', fromVersion: '1.0.0', toVersion: '1.1.0', at: 2 }));
  const healthy = new UpdateService({
    layout,
    statePath,
    publicKey,
    currentVersion: '1.0.0',
    currentDataSchema: 1,
    hooks: { health: () => true },
  });
  assert.equal((await healthy.recover())?.status, 'done');
  assert.equal(await layout.currentVersion(), '1.1.0');
  await rm(root, { recursive: true, force: true });
});
