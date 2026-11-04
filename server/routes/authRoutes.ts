import { Router } from 'express';

import type { AuthService } from '../auth/authService.ts';
import { requireAuth, type AuthenticatedRequest } from '../auth/middleware.ts';

export const createAuthRouter = (auth: AuthService) => {
  const router = Router();

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

  return router;
};
