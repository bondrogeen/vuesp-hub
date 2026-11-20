import express from 'express';

import type { AdapterManager } from '@server/modules/adapters/application/adapterManager.ts';

export const createAdapterRouter = (adapters: AdapterManager) => {
  const router = express.Router();

  router.get('/', async (_request, response, next) => {
    try {
      const health = await adapters.health();
      const assignments = adapters.assignments();
      const counts = new Map<string, number>();
      for (const adapterId of Object.values(assignments)) {
        counts.set(adapterId, (counts.get(adapterId) ?? 0) + 1);
      }
      response.json({
        status: health.status,
        adapters: adapters.list().map(adapter => ({
          id: adapter.id,
          protocol: adapter.protocol,
          mode: adapter.mode ?? 'push',
          health: health.adapters[adapter.id],
          devices: counts.get(adapter.id) ?? 0,
        })),
        queue: adapters.queueStats(),
        devices: assignments,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
