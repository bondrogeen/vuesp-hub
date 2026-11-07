import { Router } from 'express';

import type { AuthService } from '../application/authService.ts';
import { requireAuth, type AuthenticatedRequest } from './middleware.ts';

export const createAuthRouter = (auth: AuthService) => {
  const router = Router();

  router.get('/status', (_request, response) => {
    response.json({ defaultCredentials: auth.isDefaultAdminPassword() });
  });

  router.post('/login', (request, response) => {
    const { username, password } = (request.body ?? {}) as Record<string, unknown>;
    if (typeof username !== 'string' || typeof password !== 'string') {
      response.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const session = auth.login(username, password);
    if (!session) {
      response.status(401).json({ error: 'Invalid username or password' });
      return;
    }
    response.json(session);
  });

  router.get('/me', requireAuth(auth), (request: AuthenticatedRequest, response) => {
    response.json({ user: request.auth });
  });

  router.post('/change-password', requireAuth(auth), (request: AuthenticatedRequest, response) => {
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
    response.json(session);
  });

  return router;
};
