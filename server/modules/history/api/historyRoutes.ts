import express from 'express';

import type { IHistoryStore } from '@core/application/historyStore.ts';

const numberParam = (value: unknown, fallback: number): number => {
  const number = typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) ? number : fallback;
};

export const createHistoryRouter = (history: IHistoryStore) => {
  const router = express.Router();

  router.get('/', async (request, response, next) => {
    try {
      const entityId = typeof request.query.entityId === 'string' ? request.query.entityId : '';
      if (!entityId) {
        response.status(400).json({ error: 'entityId is required' });
        return;
      }
      const to = numberParam(request.query.to, Date.now());
      const from = numberParam(request.query.from, to - 86_400_000);
      const bucketMs = numberParam(request.query.bucketMs, 0);
      const limit = numberParam(request.query.limit, 5_000);
      const points = await history.query({
        entityId,
        from,
        to,
        limit,
        ...(bucketMs > 0 ? { bucketMs } : {}),
      });
      response.json({ points });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
