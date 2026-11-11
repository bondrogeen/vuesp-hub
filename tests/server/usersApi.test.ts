import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import express from 'express';

import { createAuthService } from '@server/modules/auth/application/authService.ts';
import { requireAuth } from '@server/modules/auth/api/middleware.ts';
import { createUserAdminRouter } from '@server/modules/users/api/userAdminRoutes.ts';
import { hashPassword } from '@server/modules/users/domain/password.ts';

const withServer = async (run: (baseUrl: string, auth: ReturnType<typeof createAuthService>) => Promise<void>) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-users-'));
  const auth = createAuthService({ dataDirectory: directory });
  auth.users.create({ username: 'viewer1', passwordHash: hashPassword('secret1'), role: 'viewer' });

  const app = express();
  app.use(express.json());
  app.use('/api/v1/users', requireAuth(auth), createUserAdminRouter(auth));

  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    await run(`http://127.0.0.1:${address.port}/api/v1/users`, auth);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
    rmSync(directory, { recursive: true, force: true });
  }
};

const call = async (baseUrl: string, token: string, pathname = '', init: RequestInit = {}) => {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  return { status: response.status, body: await response.json() };
};

test('user management is admin-only and keeps the last admin', async () => {
  await withServer(async (baseUrl, auth) => {
    const admin = auth.login('admin', 'admin');
    const viewer = auth.login('viewer1', 'secret1');
    assert.ok(admin && viewer);

    const adminList = await call(baseUrl, admin.token);
    assert.equal(adminList.status, 200);
    assert.deepEqual(adminList.body.map((user: { username: string }) => user.username).sort(), ['admin', 'viewer1']);

    const viewerList = await call(baseUrl, viewer.token);
    assert.equal(viewerList.status, 403);

    const created = await call(baseUrl, admin.token, '', {
      method: 'POST',
      body: JSON.stringify({ username: 'operator', password: 'secret1', role: 'user', pages: ['dashboard', 'modules'] }),
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.role, 'user');
    assert.deepEqual(created.body.pages, ['dashboard', 'modules']);

    const inherited = await call(baseUrl, admin.token, `/${created.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pages: null }),
    });
    assert.equal(inherited.status, 200);
    assert.equal(inherited.body.pages, null);

    const invalidPages = await call(baseUrl, admin.token, `/${created.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pages: ['unknown'] }),
    });
    assert.equal(invalidPages.status, 400);

    const promoted = await call(baseUrl, admin.token, `/${created.body.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'admin' }),
    });
    assert.equal(promoted.status, 200);
    assert.equal(promoted.body.role, 'admin');

    const selfDelete = await call(baseUrl, admin.token, `/${admin.user.id}`, { method: 'DELETE' });
    assert.equal(selfDelete.status, 400);
  });
});
