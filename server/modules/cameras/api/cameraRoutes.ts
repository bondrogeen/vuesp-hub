import express from 'express';

import type { CameraInput, CameraStore } from '@server/modules/cameras/application/cameraStore.ts';
import type { CameraStreamManager } from '@server/modules/cameras/sockets/stream.ts';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Unexpected error');

const readInput = (body: unknown): CameraInput => {
  if (typeof body !== 'object' || body === null) return {};
  const value = body as Record<string, unknown>;
  return {
    name: typeof value.name === 'string' ? value.name : undefined,
    url: typeof value.url === 'string' ? value.url : undefined,
    transcode: typeof value.transcode === 'boolean' ? value.transcode : undefined,
  };
};

export const createCameraRouter = ({
  cameraStore,
  streamManager,
}: {
  cameraStore: CameraStore;
  streamManager: CameraStreamManager;
}) => {
  const router = express.Router();

  router.get('/', (_request, response) => {
    response.json(cameraStore.list().map(camera => ({
      ...camera,
      stream: streamManager.snapshot(camera.id),
    })));
  });

  router.put('/order', (request, response) => {
    try {
      const ids = Array.isArray(request.body?.ids)
        ? request.body.ids.filter((id: unknown): id is string => typeof id === 'string')
        : [];
      response.json(cameraStore.reorder(ids));
    } catch (error) {
      response.status(400).json({ message: errorMessage(error) });
    }
  });

  router.get('/:id', (request, response) => {
    const camera = cameraStore.get(request.params.id);
    if (!camera) {
      response.status(404).json({ message: 'Camera not found' });
      return;
    }
    const publicCamera = cameraStore.list().find(item => item.id === camera.id);
    response.json({ ...publicCamera, url: camera.url });
  });

  router.post('/', (request, response) => {
    try {
      const camera = cameraStore.create(readInput(request.body));
      response.status(201).json(camera);
    } catch (error) {
      response.status(400).json({ message: errorMessage(error) });
    }
  });

  router.patch('/:id', (request, response) => {
    try {
      const before = cameraStore.get(request.params.id);
      const camera = cameraStore.update(request.params.id, readInput(request.body));
      const after = cameraStore.get(request.params.id);
      if (before && after && (before.url !== after.url || before.transcode !== after.transcode)) {
        streamManager.stop(request.params.id);
      }
      response.json(camera);
    } catch (error) {
      const message = errorMessage(error);
      response.status(message === 'Camera not found' ? 404 : 400).json({ message });
    }
  });

  router.delete('/:id', (request, response) => {
    const id = request.params.id;
    streamManager.stop(id);
    const removed = cameraStore.remove(id);
    if (!removed) {
      response.status(404).json({ message: 'Camera not found' });
      return;
    }
    response.json({ ok: true });
  });

  return router;
};
