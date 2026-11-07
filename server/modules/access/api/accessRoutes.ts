import { Router } from 'express';
import type { Request, Response } from 'express';

import { isAccessPage, type AccessPage } from '../domain/access.ts';
import type { AccessRepository } from '../infrastructure/jsonAccessRepository.ts';
import { requireRole } from '../../auth/api/middleware.ts';

const parsePages = (value: unknown): AccessPage[] | null => {
  if (!Array.isArray(value)) return null;
  const pages = value.filter(isAccessPage);
  return pages.length === value.length ? [...new Set(pages)] : null;
};

export const createAccessRouter = (access: AccessRepository) => {
  const router = Router();

  router.get('/', (_request: Request, response: Response) => {
    response.json(access.get());
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
