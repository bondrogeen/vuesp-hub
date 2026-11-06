import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { createCameraStore } from '../../server/modules/cameras/application/cameraStore.ts';

const withStore = (run: (store: ReturnType<typeof createCameraStore>, directory: string) => void) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-camera-store-'));
  try {
    run(createCameraStore({ dataDirectory: directory }), directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
};

test('stores RTSP credentials on the hub and exposes only the host', () => {
  withStore((store, directory) => {
    const camera = store.create({
      name: 'Front door',
      url: 'rtsp://user:password@192.0.2.10:554/stream',
    });

    assert.equal(camera.name, 'Front door');
    assert.equal(camera.host, '192.0.2.10:554');
    assert.equal('url' in camera, false);

    const stored = store.get(camera.id);
    assert.ok(stored);
    assert.equal(stored.url, 'rtsp://user:password@192.0.2.10:554/stream');

    const file = path.join(directory, 'cameras.json');
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.match(readFileSync(file, 'utf8'), /password/);
  });
});

test('updates names and removes cameras', () => {
  withStore((store) => {
    const camera = store.create({ name: 'Old', url: 'rtsp://192.0.2.11:554/stream' });

    const updated = store.update(camera.id, { name: 'New' });
    assert.equal(updated.name, 'New');
    assert.equal(updated.host, '192.0.2.11:554');

    assert.equal(store.remove(camera.id), true);
    assert.equal(store.remove(camera.id), false);
    assert.deepEqual(store.list(), []);
  });
});

test('rejects unsupported camera URLs', () => {
  withStore((store) => {
    assert.throws(() => store.create({ url: 'ftp://192.0.2.10/stream' }), /rtsp/);
    assert.throws(() => store.create({ url: 'not-a-url' }), /invalid/);
    assert.throws(() => store.create({ url: 'rtsp://' }), /invalid|host/);
  });
});
