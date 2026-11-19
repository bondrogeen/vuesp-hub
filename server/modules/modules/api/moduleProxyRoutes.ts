import express from 'express';

import type { IAuthService, IAuthUser } from '@server/modules/auth/application/authService.ts';
import { requestToken } from '@server/modules/auth/api/middleware.ts';
import type { TModuleHost } from '@server/module-host/moduleHost.ts';

/**
 * Module API proxy. It is mounted before the hub session middleware so a
 * module UI can authenticate with its own short-lived scoped token instead of
 * receiving the admin session. A normal hub session also works, which keeps
 * existing integrations and `curl` debugging simple.
 */
export const createModuleProxyRouter = ({
  moduleHost,
  auth,
}: {
  moduleHost: TModuleHost;
  auth?: IAuthService;
}) => {
  const router = express.Router();

  const resolveUser = (request: express.Request, moduleId: string): IAuthUser | null => {
    if (!auth) return null;
    const token = requestToken(request);
    return auth.verify(token) ?? auth.verifyModuleToken(token, moduleId);
  };

  const proxy = (request: express.Request, response: express.Response): void => {
    const id = String(request.params.id);
    const user = resolveUser(request, id);
    if (auth && !user) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (user?.id !== undefined) request.headers['x-vuesp-user-id'] = String(user.id);
    if (user?.username) request.headers['x-vuesp-username'] = user.username;
    if (user?.role) request.headers['x-vuesp-role'] = user.role;
    moduleHost.proxy(id, request, response, `/api/v1/modules/${id}/proxy`);
  };

  const cors = (request: express.Request, response: express.Response, next: express.NextFunction): void => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    // A sandboxed (opaque-origin) module frame counts as a public context for
    // Chrome's Private Network Access checks.
    response.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (request.method === 'OPTIONS') {
      response.status(204).end();
      return;
    }
    next();
  };

  router.all('/:id/proxy', cors, proxy);
  router.all('/:id/proxy/*splat', cors, proxy);

  return router;
};
