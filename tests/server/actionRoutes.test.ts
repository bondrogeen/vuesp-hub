import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { test } from 'node:test';

import type { ActionService } from '@core/application/actionService.ts';
import { createActionsRouter } from '@server/modules/actions/api/actionRoutes.ts';

const startApi = async (role: string) => {
  const actions = {
    async execute(request: { requestId?: string }) {
      return { requestId: request.requestId ?? 'generated', status: 'accepted', pending: false, commands: [], at: 1 };
    },
    getResult: () => ({ requestId: 'r1', status: 'accepted', pending: false, commands: [], at: 1 }),
  } as unknown as ActionService;

  const app = express();
  app.use(express.json());
  app.use((request, _response, next) => {
    (request as express.Request & { auth?: { role: string } }).auth = { role };
    next();
  });
  app.use('/api/v1/actions', createActionsRouter(actions));
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server failed to bind');
  return {
    url: `http://127.0.0.1:${address.port}/api/v1/actions`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    }),
  };
};

test('action API gates viewers and validates command bodies', async () => {
  const viewer = await startApi('viewer');
  try {
    const response = await fetch(viewer.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deviceId: 'uuid-1', entityKey: 'device.power', value: 1 }),
    });
    assert.equal(response.status, 403);
  } finally {
    await viewer.close();
  }

  const user = await startApi('user');
  try {
    const invalid = await fetch(user.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 1 }),
    });
    assert.equal(invalid.status, 400);

    const accepted = await fetch(user.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestId: 'r1', deviceId: 'uuid-1', entityKey: 'device.power', value: 1 }),
    });
    assert.equal(accepted.status, 200);
    assert.equal((await accepted.json()).status, 'accepted');

    const result = await fetch(`${user.url}/r1`);
    assert.equal(result.status, 200);
    assert.equal((await result.json()).requestId, 'r1');
  } finally {
    await user.close();
  }
});
