import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import { createUserRouter } from '@server/modules/users/api/userRoutes.ts';
import type { StoreModel } from '@shared/stores/types.ts';

interface TestUser {
  id: number;
  [key: string]: unknown;
}

const createModel = (): StoreModel => {
  let users: TestUser[] = [{ id: 1, name: 'Admin' }];
  return {
    getAll: async () => users,
    getById: async id => users.find(user => user.id === id),
    create: async data => {
      const user = { ...data, id: 2 };
      users = [...users, user];
      return user;
    },
    update: async (id, data) => {
      const user = users.find(item => item.id === id);
      if (!user) return null;
      const updated = { ...user, ...data };
      users = users.map(item => item.id === id ? updated : item);
      return updated;
    },
    delete: async id => {
      const user = users.find(item => item.id === id);
      users = users.filter(item => item.id !== id);
      return user;
    },
  };
};

const startApi = async (model: StoreModel) => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/user', createUserRouter(() => model));
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}/api/v1/user`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

test('user API preserves direct resource responses and CRUD status codes', async () => {
  const api = await startApi(createModel());
  try {
    const list = await fetch(api.url);
    assert.equal(list.status, 200);
    assert.deepEqual(await list.json(), [{ id: 1, name: 'Admin' }]);

    const created = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Operator' }),
    });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { id: 2, name: 'Operator' });

    const updated = await fetch(`${api.url}/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Administrator' }),
    });
    assert.equal(updated.status, 200);
    assert.deepEqual(await updated.json(), { id: 1, name: 'Administrator' });

    const deleted = await fetch(`${api.url}/2`, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.deepEqual(await deleted.json(), { id: 2, name: 'Operator' });

    const missing = await fetch(`${api.url}/999`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: 'Not found' });
  } finally {
    await api.close();
  }
});

test('user API rejects invalid IDs and non-object request bodies', async () => {
  const api = await startApi(createModel());
  try {
    const invalidId = await fetch(`${api.url}/0`);
    assert.equal(invalidId.status, 400);
    assert.deepEqual(await invalidId.json(), { error: 'ID must be a positive integer' });

    const invalidBody = await fetch(api.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(['not', 'a', 'record']),
    });
    assert.equal(invalidBody.status, 400);
    assert.deepEqual(await invalidBody.json(), { error: 'Request body must be an object' });
  } finally {
    await api.close();
  }
});

test('user API returns a stable generic error for internal failures', async () => {
  const model = createModel();
  model.getAll = async () => {
    throw new Error('private storage detail');
  };
  const api = await startApi(model);
  const originalError = console.error;
  const loggedErrors: unknown[][] = [];
  console.error = (...args: unknown[]) => loggedErrors.push(args);
  try {
    const response = await fetch(api.url);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Internal server error' });
    assert.equal(loggedErrors.length, 1);
    assert.match(String(loggedErrors[0][1]), /private storage detail/);
  } finally {
    console.error = originalError;
    await api.close();
  }
});
