import { Router } from 'express';

import type { IAuthService } from '@server/modules/auth/application/authService.ts';
import { RateLimiter } from '@server/shared/security/rateLimiter.ts';
import { clearSessionCookie, setSessionCookie } from '@server/shared/security/sessionCookie.ts';
import { requireAuth, type IAuthenticatedRequest } from './middleware.ts';

const isSecureRequest = (request: { secure?: boolean; headers: Record<string, unknown> }): boolean => {
  if (request.secure) return true;
  const forwarded = request.headers['x-forwarded-proto'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return typeof value === 'string' && value.split(',')[0]?.trim() === 'https';
};

export const createAuthRouter = (auth: IAuthService) => {
  const router = Router();
  // Ten failed attempts per client per five minutes, then a fifteen minute block.
  const loginLimiter = new RateLimiter({ limit: 10, windowMs: 5 * 60_000, blockMs: 15 * 60_000 });
  const loginKey = (request: { ip?: string; body?: unknown }): string => {
    const username = typeof (request.body as { username?: unknown } | undefined)?.username === 'string'
      ? String((request.body as { username: string }).username).toLowerCase()
      : '';
    return `${request.ip ?? 'local'}:${username}`;
  };

  router.get('/status', (_request, response) => {
    response.json({ defaultCredentials: auth.isDefaultAdminPassword() });
  });

  router.post('/login', (request, response) => {
    const { username, password } = (request.body ?? {}) as Record<string, unknown>;
    if (typeof username !== 'string' || typeof password !== 'string') {
      response.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const key = loginKey(request);
    const limit = loginLimiter.take(key);
    if (!limit.allowed) {
      response.setHeader('Retry-After', String(Math.ceil(limit.retryAfterMs / 1000)));
      response.status(429).json({ error: 'Too many login attempts, try again later' });
      return;
    }

    const session = auth.login(username, password);
    if (!session) {
      response.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    loginLimiter.reset(key);
    setSessionCookie(response, session.token, {
      maxAgeSeconds: auth.ttlSeconds,
      secure: isSecureRequest(request),
    });
    response.json(session);
  });

  router.get('/me', requireAuth(auth), (request: IAuthenticatedRequest, response) => {
    response.json({ user: request.auth });
  });

  router.post('/logout', (_request, response) => {
    clearSessionCookie(response);
    response.json({ ok: true });
  });

  router.post('/change-password', requireAuth(auth), (request: IAuthenticatedRequest, response) => {
    const { currentPassword, newPassword } = (request.body ?? {}) as Record<string, unknown>;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
      response.status(400).json({ error: 'Current password and a new password of at least 6 characters are required' });
      return;
    }

    const session = auth.changePassword(request.auth?.id ?? 0, currentPassword, newPassword);
    if (!session) {
      response.status(400).json({ error: 'Current password is invalid' });
      return;
    }
    setSessionCookie(response, session.token, {
      maxAgeSeconds: auth.ttlSeconds,
      secure: isSecureRequest(request),
    });
    response.json(session);
  });

  return router;
};
