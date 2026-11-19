import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import express from 'express';

import { createAuthRouter } from '@server/modules/auth/api/authRoutes.ts';
import { createAuthService } from '@server/modules/auth/application/authService.ts';
import { requireAuth, requireSameOrigin } from '@server/modules/auth/api/middleware.ts';

const withServer = async (run: (baseUrl: string) => Promise<void>) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'vuesp-auth-cookie-'));
  const auth = createAuthService({ dataDirectory: directory });
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter(auth));
  app.use('/api/v1/private', requireSameOrigin, requireAuth(auth), (_request, response) => {
    response.json({ ok: true });
  });
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
    rmSync(directory, { recursive: true, force: true });
  }
};

const login = async (baseUrl: string) => {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' }),
  });
  return response;
};

test('login sets an HttpOnly session cookie that authenticates requests', async () => {
  await withServer(async baseUrl => {
    const response = await login(baseUrl);
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie') ?? '';
    assert.match(cookie, /vuesp_session=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /Max-Age=\d+/);

    const sessionCookie = cookie.split(';')[0]!;
    const me = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { cookie: sessionCookie } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.username, 'admin');

    const privateCall = await fetch(`${baseUrl}/api/v1/private`, { headers: { cookie: sessionCookie } });
    assert.equal(privateCall.status, 200);

    const withoutCookie = await fetch(`${baseUrl}/api/v1/private`);
    assert.equal(withoutCookie.status, 401);
  });
});

test('logout clears the session cookie', async () => {
  await withServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/v1/auth/logout`, { method: 'POST' });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie') ?? '';
    assert.match(cookie, /vuesp_session=;/);
    assert.match(cookie, /Max-Age=0/);
  });
});

test('cookie-authenticated state changes reject a foreign origin', async () => {
  await withServer(async baseUrl => {
    const response = await login(baseUrl);
    const sessionCookie = (response.headers.get('set-cookie') ?? '').split(';')[0]!;

    const crossOrigin = await fetch(`${baseUrl}/api/v1/private`, {
      method: 'POST',
      headers: { cookie: sessionCookie, origin: 'http://evil.example' },
    });
    assert.equal(crossOrigin.status, 403);

    const sameOrigin = await fetch(`${baseUrl}/api/v1/private`, {
      method: 'POST',
      headers: { cookie: sessionCookie, origin: `http://127.0.0.1:${new URL(baseUrl).port}` },
    });
    assert.equal(sameOrigin.status, 200);
  });
});
