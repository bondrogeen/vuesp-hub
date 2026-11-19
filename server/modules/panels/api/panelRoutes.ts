import express from 'express';

import type { TStoreModelFactory } from '@shared/stores/types.ts';
import { parsePanelInput, type IPanel } from '@server/modules/panels/application/panel.ts';

const asPanel = (value: Record<string, unknown>): IPanel => value as unknown as IPanel;

const parseId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createPanelsRouter = (storeModel: TStoreModelFactory) => {
  const router = express.Router();
  const store = storeModel('panels');

  router.get('/', async (_request, response, next) => {
    try {
      const panels = (await store.getAll()).map(asPanel).sort((left, right) => left.name.localeCompare(right.name));
      response.json({ panels });
    } catch (error) {
      next(error);
    }
  });

  router.get('/trash/', async (_request, response, next) => {
    try {
      const items = (await store.getDeleted?.() ?? []).map(asPanel);
      response.json({ panels: items });
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Panel ID must be a positive integer' });
        return;
      }
      const panel = await store.getById(id);
      if (!panel) {
        response.status(404).json({ error: 'Panel not found' });
        return;
      }
      response.json({ panel: asPanel(panel) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const input = parsePanelInput(request.body);
      const panel = await store.create({
        schemaVersion: 1,
        ...input,
        updatedAt: new Date().toISOString(),
      });
      response.status(201).json({ panel: asPanel(panel) });
    } catch (error) {
      if (error instanceof TypeError) {
        response.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  router.put('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Panel ID must be a positive integer' });
        return;
      }
      const input = parsePanelInput(request.body);
      const panel = await store.update(id, { ...input, updatedAt: new Date().toISOString() });
      if (!panel) {
        response.status(404).json({ error: 'Panel not found' });
        return;
      }
      response.json({ panel: asPanel(panel) });
    } catch (error) {
      if (error instanceof TypeError) {
        response.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  router.patch('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Panel ID must be a positive integer' });
        return;
      }
      const current = await store.getById(id);
      if (!current) {
        response.status(404).json({ error: 'Panel not found' });
        return;
      }
      const input = parsePanelInput({ ...current, ...request.body });
      const panel = await store.update(id, { ...input, updatedAt: new Date().toISOString() });
      response.json({ panel: asPanel(panel!) });
    } catch (error) {
      if (error instanceof TypeError) {
        response.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Panel ID must be a positive integer' });
        return;
      }
      const removed = request.query.purge === 'true'
        ? await store.purge?.(id)
        : await store.delete(id);
      if (!removed) {
        response.status(404).json({ error: request.query.purge === 'true' ? 'Panel is not in the trash' : 'Panel not found' });
        return;
      }
      response.json({ panel: asPanel(removed) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/restore/', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Panel ID must be a positive integer' });
        return;
      }
      const restored = await store.restore?.(id);
      if (!restored) {
        response.status(404).json({ error: 'Panel is not in the trash' });
        return;
      }
      response.json({ panel: asPanel(restored) });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
