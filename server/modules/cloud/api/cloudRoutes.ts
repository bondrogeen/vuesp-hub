import { Router } from 'express';

import type { CloudService } from '../application/cloudService.ts';

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const createCloudRouter = (cloud: CloudService) => {
  const router = Router();

  router.get('/', (_request, response) => {
    response.json(cloud.status());
  });

  router.get('/tiles', async (_request, response) => {
    try {
      response.json(await cloud.listTiles());
    } catch (error) {
      response.status(400).json({ error: errorMessage(error, 'Could not load tiles') });
    }
  });

  router.put('/tiles', async (request, response) => {
    const tiles = (request.body as { tiles?: unknown } | undefined)?.tiles;
    if (!Array.isArray(tiles) || !tiles.every((key) => typeof key === 'string')) {
      response.status(400).json({ error: 'tiles must be an array of strings' });
      return;
    }

    try {
      response.json(await cloud.setPublishedTiles(tiles));
    } catch (error) {
      response.status(400).json({ error: errorMessage(error, 'Could not save the tile selection') });
    }
  });

  router.post('/pair', async (_request, response) => {
    try {
      response.json(await cloud.startPairing());
    } catch (error) {
      response.status(400).json({ error: errorMessage(error, 'Could not start pairing') });
    }
  });

  router.post('/disconnect', async (_request, response) => {
    try {
      response.json(await cloud.disconnect());
    } catch (error) {
      response.status(400).json({ error: errorMessage(error, 'Could not disconnect') });
    }
  });

  return router;
};
