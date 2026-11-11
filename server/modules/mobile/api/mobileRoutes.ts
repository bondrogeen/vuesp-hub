import { Router } from 'express';
import type { Request, Response } from 'express';

import type { CloudService, MobileTokenRecord } from '@server/modules/cloud/application/cloudService.ts';

interface MobileRequest extends Request {
  mobileUser?: MobileTokenRecord;
}

const readBearer = (request: Request): string => {
  const header = request.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice('Bearer '.length).trim();
  const custom = request.headers['x-mobile-token'];
  return typeof custom === 'string' ? custom.trim() : '';
};

/** LAN API for the mobile app. Pairing uses the Vuesp cloud session. */
export const createMobileRouter = (cloud: CloudService) => {
  const router = Router();

  router.post('/session', async (request: Request, response: Response) => {
    const accessToken = (request.body as { accessToken?: unknown } | undefined)?.accessToken;
    if (typeof accessToken !== 'string' || accessToken.trim().length < 16) {
      response.status(400).json({ error: 'accessToken is required' });
      return;
    }

    try {
      response.json(await cloud.mobileSession(accessToken));
    } catch (error) {
      response.status(401).json({ error: error instanceof Error ? error.message : 'Access denied' });
    }
  });

  router.use((request: MobileRequest, response: Response, next) => {
    const user = cloud.verifyMobileToken(readBearer(request));
    if (!user) {
      response.status(401).json({ error: 'Unauthorized' });
      return;
    }
    request.mobileUser = user;
    next();
  });

  router.get('/hub', async (_request: Request, response: Response) => {
    try {
      response.json(await cloud.mobileHub());
    } catch (error) {
      response.status(502).json({ error: error instanceof Error ? error.message : 'Could not load hub' });
    }
  });

  router.post('/devices/:deviceId/action', async (request: Request, response: Response) => {
    const body = (request.body ?? {}) as { tileId?: unknown; tileKey?: unknown; value?: unknown };
    const tileId = typeof body.tileId === 'string' ? body.tileId : '';
    const tileKey = typeof body.tileKey === 'string' ? body.tileKey : '';
    if (!tileId && !tileKey) {
      response.status(400).json({ error: 'tileId or tileKey is required' });
      return;
    }

    const result = await cloud.action(String(request.params.deviceId ?? ''), tileId, tileKey, body.value);
    response.status(result.ok ? 200 : 400).json(result);
  });

  return router;
};
