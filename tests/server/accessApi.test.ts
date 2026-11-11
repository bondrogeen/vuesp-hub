import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import express from 'express';

import { createAccessRouter } from '@server/modules/access/api/accessRoutes.ts';
import { ACCESS_PAGES, DEFAULT_ROLE_ACCESS } from '@server/modules/access/domain/access.ts';
import { createJsonAccessRepository } from '@server/modules/access/infrastructure/jsonAccessRepository.ts';
import { createAuthService } from '@server/modules/auth/application/authService.ts';
import { requireAuth } from '@server/modules/auth/api/middleware.ts';
import { hashPassword } from '@server/modules/users/domain/password.ts';

const withServer = async (run: (baseUrl: string, auth: ReturnType<typeof createAuthService>) => Promise<void>) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-access-'));
  const auth = createAuthService({ dataDirectory: directory });
  const access = createJsonAccessRepository({ dataDirectory: directory });
  auth.users.create({ username: 'viewer1', passwordHash: hashPassword('secret1'), role: 'viewer' });

  const app = express();
  app.use(express.json());
  app.use('/api/v1/access', requireAuth(auth), createAccessRouter(access, auth));

  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    await run(`http://127.0.0.1:${address.port}/api/v1/access`, auth);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
    rmSync(directory, { recursive: true, force: true });
  }
};

const getMe = async (baseUrl: string, token: string) => {
  const response = await fetch(`${baseUrl}/me`, { headers: { authorization: `Bearer ${token}` } });
  return { status: response.status, body: await response.json() };
};

test('access/me returns role defaults and per-user overrides', async () => {
  await withServer(async (baseUrl, auth) => {
    const admin = auth.login('admin', 'admin');
    const viewer = auth.login('viewer1', 'secret1');
    assert.ok(admin && viewer);

    const adminAccess = await getMe(baseUrl, admin.token);
    assert.equal(adminAccess.status, 200);
    assert.deepEqual(adminAccess.body.pages, [...ACCESS_PAGES]);

    const roleAccess = await getMe(baseUrl, viewer.token);
    assert.deepEqual(roleAccess.body.pages, [...DEFAULT_ROLE_ACCESS.viewer]);

    auth.users.update(viewer.user.id, { pages: ['modbus'] });
    const overridden = await getMe(baseUrl, viewer.token);
    assert.deepEqual(overridden.body.pages, ['modbus']);
  });
});
