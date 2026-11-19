import express from 'express';

import type { ObjectRegistry } from '@core/application/objectRegistry.ts';

const serialize = (registry: ObjectRegistry, deviceId?: string) => registry.snapshotView(deviceId).devices;

export const createObjectRouter = (registry: ObjectRegistry) => {
  const router = express.Router();

  router.get('/', (_request, response) => {
    response.json({ devices: serialize(registry) });
  });

  router.get('/:deviceId', (request, response) => {
    const devices = serialize(registry, request.params.deviceId);
    if (!devices.length) {
      response.status(404).json({ error: 'Device not found' });
      return;
    }
    response.json({ devices });
  });

  router.get('/:deviceId/:entityKey', (request, response) => {
    const entity = registry.getEntity(request.params.deviceId, request.params.entityKey);
    if (!entity) {
      response.status(404).json({ error: 'Entity not found' });
      return;
    }
    response.json({ entity });
  });

  return router;
};
