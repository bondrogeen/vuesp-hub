import { Router } from 'express';
import type { Request, Response } from 'express';

import { isAccessPage, type AccessPage } from '@server/modules/access/domain/access.ts';
import { hashPassword } from '@server/modules/users/domain/password.ts';
import { isUserRole, type UserRole } from '@server/modules/users/domain/user.ts';
import type { AuthService } from '@server/modules/auth/application/authService.ts';
import { requireRole, type AuthenticatedRequest } from '@server/modules/auth/api/middleware.ts';

interface UserParams {
  id: string;
}

const parseId = (value: string): number | null => {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
};

const parseUsername = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const username = value.trim().toLowerCase();
  return username.length >= 3 && username.length <= 64 ? username : null;
};

const parsePassword = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  return value.length >= 6 && value.length <= 128 ? value : null;
};

const parseRole = (value: unknown): UserRole | null => (isUserRole(value) ? value : null);

const INVALID_PAGES = Symbol('invalid-pages');

/** `null` resets to role defaults, `undefined` leaves the value unchanged. */
const parsePages = (value: unknown): AccessPage[] | null | undefined | typeof INVALID_PAGES => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) return INVALID_PAGES;
  const pages = value.filter(isAccessPage);
  return pages.length === value.length ? [...new Set(pages)] : INVALID_PAGES;
};

export const createUserAdminRouter = (auth: AuthService) => {
  const router = Router();
  router.use(requireRole('admin'));

  router.get('/', (_request: Request, response: Response) => {
    response.json(auth.users.list());
  });

  router.post('/', (request: Request, response: Response) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const username = parseUsername(body.username);
    const password = parsePassword(body.password);
    const role = parseRole(body.role ?? 'user');
    const pages = parsePages(body.pages);

    if (!username || !password || !role || pages === INVALID_PAGES) {
      response.status(400).json({ error: 'Username, password and role are required' });
      return;
    }
    if (auth.users.existsByUsername(username)) {
      response.status(409).json({ error: 'A user with this username already exists' });
      return;
    }

    const user = auth.users.create({
      username,
      passwordHash: hashPassword(password),
      role,
      pages: pages === undefined ? null : pages,
      mustChangePassword: true,
    });
    response.status(201).json(user);
  });

  router.patch('/:id', (request: Request<UserParams> & AuthenticatedRequest, response: Response) => {
    const id = parseId(request.params.id);
    if (id === null) {
      response.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const current = auth.users.findById(id);
    if (!current) {
      response.status(404).json({ error: 'User not found' });
      return;
    }

    const body = (request.body ?? {}) as Record<string, unknown>;
    const username = body.username === undefined ? undefined : parseUsername(body.username);
    const password = body.password === undefined || body.password === '' ? undefined : parsePassword(body.password);
    const role = body.role === undefined ? undefined : parseRole(body.role);
    const pages = parsePages(body.pages);

    if (username === null || password === null || role === null || pages === INVALID_PAGES) {
      response.status(400).json({ error: 'Invalid user data' });
      return;
    }
    if (username && username !== current.username && auth.users.existsByUsername(username)) {
      response.status(409).json({ error: 'A user with this username already exists' });
      return;
    }
    if (current.role === 'admin' && role && role !== 'admin' && auth.users.countByRole('admin') <= 1) {
      response.status(400).json({ error: 'At least one administrator is required' });
      return;
    }

    const user = auth.users.update(id, {
      ...(username ? { username } : {}),
      ...(password ? { passwordHash: hashPassword(password), mustChangePassword: true } : {}),
      ...(role ? { role } : {}),
      ...(pages !== undefined ? { pages } : {}),
    });
    response.json(user);
  });

  router.delete('/:id', (request: Request<UserParams> & AuthenticatedRequest, response: Response) => {
    const id = parseId(request.params.id);
    if (id === null) {
      response.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const current = auth.users.findById(id);
    if (!current) {
      response.status(404).json({ error: 'User not found' });
      return;
    }
    if (request.auth?.id === id) {
      response.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }
    if (current.role === 'admin' && auth.users.countByRole('admin') <= 1) {
      response.status(400).json({ error: 'At least one administrator is required' });
      return;
    }

    auth.users.remove(id);
    response.json({ deleted: true });
  });

  return router;
};
