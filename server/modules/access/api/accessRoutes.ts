import { Router } from 'express';
import type { Request, Response } from 'express';

import type { AuthService } from '@server/modules/auth/application/authService.ts';
import { requireRole, type AuthenticatedRequest } from '@server/modules/auth/api/middleware.ts';
import {
  isAccessPage,
  resolveUserPages,
  type AccessPage,
} from '@server/modules/access/domain/access.ts';
import type { AccessRepository } from '@server/modules/access/infrastructure/jsonAccessRepository.ts';

const parsePages = (value: unknown): AccessPage[] | null => {
  if (!Array.isArray(value)) return null;
  const pages = value.filter(isAccessPage);
  return pages.length === value.length ? [...new Set(pages)] : null;
};

export const createAccessRouter = (access: AccessRepository, auth: AuthService) => {
  const router = Router();

  router.get('/', (_request: Request, response: Response) => {
    response.json(access.get());
  });

  /** Effective page access for the authenticated user (per-user override or role defaults). */
  router.get('/me', (request: AuthenticatedRequest, response: Response) => {
    const user = request.auth;
    if (!user) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const current = auth.users.findById(user.id) ?? user;
    response.json({ pages: resolveUserPages(current.role, current.pages, access.get()) });
  });

  router.put('/', requireRole('admin'), (request: Request, response: Response) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const user = parsePages(body.user);
    const viewer = parsePages(body.viewer);

    if (!user || !viewer) {
      response.status(400).json({ error: 'user and viewer must be arrays of known pages' });
      return;
    }

    response.json(access.update({ user, viewer }));
  });

  return router;
};
