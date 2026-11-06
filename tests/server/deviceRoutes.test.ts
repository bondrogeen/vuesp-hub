import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import { createVuespRouter } from '../../server/modules/devices/api/vuespRoutes.ts';
import { createDeviceRepository, type DeviceRepository } from '../../server/modules/devices/infrastructure/deviceRepository.ts';
import type { SecretProvider } from '../../server/shared/secrets/secretProvider.ts';

const secretProvider: SecretProvider = {
  encrypt: value => `encrypted:${value}`,
  decrypt: value => value.replace('encrypted:', ''),
};

const startApi = async (getModel: () => Promise<DeviceRepository>) => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/device', createVuespRouter(getModel));
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}/api/v1/device`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

test('device API preserves resource response shapes and returns stable validation errors', async () => {
  const repository = await createDeviceRepository({ databasePath: ':memory:', secretProvider });
  const api = await startApi(async () => repository);
  try {
    const invalid = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deviceId: 1, ip: 'not-an-ip', name: 'Invalid' }),
    });
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { error: 'A valid IPv4 or IPv6 address is required' });

    const body = {
      deviceId: 123,
      ip: '192.0.2.41',
      name: 'Desk',
      username: 'admin',
      password: 'secret',
    };
    const created = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(created.status, 201);
    const record = await created.json();
    assert.equal(record.name, body.name);
    assert.equal('password' in record, false);
    assert.equal('username' in record, false);

    const duplicate = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(duplicate.status, 409);
    assert.deepEqual(await duplicate.json(), {
      error: 'A device at this IP address is already registered',
    });
  } finally {
    await api.close();
    repository.close();
  }
});

test('device API rejects malformed record IDs with the shared validation error shape', async () => {
  const repository = await createDeviceRepository({ databasePath: ':memory:', secretProvider });
  const api = await startApi(async () => repository);
  try {
    const response = await fetch(`${api.url}/not-an-id`);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Device ID must be a positive integer' });
  } finally {
    await api.close();
    repository.close();
  }
});

test('device API hides internal failures and returns the shared error response shape', async () => {
  const repository = await createDeviceRepository({ databasePath: ':memory:', secretProvider });
  const failingRepository: DeviceRepository = new Proxy(repository, {
    get(target, property, receiver) {
      if (property === 'getAll') {
        return () => {
          throw new Error('private database details');
        };
      }
      return Reflect.get(target, property, receiver);
    },
  });
  const api = await startApi(async () => failingRepository);
  const originalError = console.error;
  const loggedErrors: unknown[][] = [];
  console.error = (...args: unknown[]) => loggedErrors.push(args);
  try {
    const response = await fetch(api.url);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Internal server error' });
    assert.equal(loggedErrors.length, 1);
    assert.match(String(loggedErrors[0][1]), /private database details/);
  } finally {
    console.error = originalError;
    await api.close();
    repository.close();
  }
});
