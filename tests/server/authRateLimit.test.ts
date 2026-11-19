import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import express from 'express';

import { createAuthRouter } from '@server/modules/auth/api/authRoutes.ts';
import { createAuthService } from '@server/modules/auth/application/authService.ts';

test('login is rate limited after repeated failures', async () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-auth-limit-'));
  const auth = createAuthService({ dataDirectory: directory });
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter(auth));
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1/auth`;

  const attempt = () => fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'wrong-password' }),
  });

  try {
    for (let index = 0; index < 10; index += 1) {
      assert.equal((await attempt()).status, 401);
    }
    const limited = await attempt();
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);

    // A different username keeps its own bucket.
    const other = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'admin2', password: 'wrong' }),
    });
    assert.equal(other.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
    rmSync(directory, { recursive: true, force: true });
  }
});
