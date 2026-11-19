import express from 'express';

import type { AutomationEngine } from '@server/modules/automations/application/automationEngine.ts';
import { parseRuleInput, parseSceneInput } from '@server/modules/automations/application/automationParser.ts';
import type { IStoreEntity, TStoreModelFactory } from '@shared/stores/types.ts';

const parseId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const badRequest = (response: express.Response, error: unknown): boolean => {
  if (!(error instanceof TypeError)) return false;
  response.status(400).json({ error: error.message });
  return true;
};

export const createRulesRouter = (engine: AutomationEngine, storeModel: TStoreModelFactory) => {
  const router = express.Router();
  const store = storeModel('automations');

  router.get('/', (_request, response) => {
    response.json({ rules: engine.listRules() });
  });

  router.get('/journal', (_request, response) => {
    response.json({ journal: engine.getJournal() });
  });

  router.post('/', async (request, response, next) => {
    try {
      const rule = await store.create(parseRuleInput(request.body));
      await engine.reload();
      response.status(201).json({ rule });
    } catch (error) {
      if (badRequest(response, error)) return;
      next(error);
    }
  });

  router.patch('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Rule ID must be a positive integer' });
        return;
      }
      const current = await store.getById(id);
      if (!current) {
        response.status(404).json({ error: 'Rule not found' });
        return;
      }
      const rule = await store.update(id, parseRuleInput({ ...current, ...request.body }));
      await engine.reload();
      response.json({ rule });
    } catch (error) {
      if (badRequest(response, error)) return;
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Rule ID must be a positive integer' });
        return;
      }
      const removed = await store.delete(id);
      if (!removed) {
        response.status(404).json({ error: 'Rule not found' });
        return;
      }
      await engine.reload();
      response.json({ rule: removed });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/run', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Rule ID must be a positive integer' });
        return;
      }
      response.json({ entry: await engine.runRule(id) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/dry-run', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Rule ID must be a positive integer' });
        return;
      }
      response.json(await engine.dryRun(id));
    } catch (error) {
      next(error);
    }
  });

  return router;
};

export const createScenesRouter = (engine: AutomationEngine, storeModel: TStoreModelFactory) => {
  const router = express.Router();
  const store = storeModel('scenes');

  router.get('/', (_request, response) => {
    response.json({ scenes: engine.listScenes() });
  });

  router.post('/', async (request, response, next) => {
    try {
      const scene = await store.create(parseSceneInput(request.body));
      await engine.reload();
      response.status(201).json({ scene });
    } catch (error) {
      if (badRequest(response, error)) return;
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Scene ID must be a positive integer' });
        return;
      }
      const removed = await store.delete(id);
      if (!removed) {
        response.status(404).json({ error: 'Scene not found' });
        return;
      }
      await engine.reload();
      response.json({ scene: removed });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/run', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Scene ID must be a positive integer' });
        return;
      }
      await engine.runScene(id);
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
};

export const createNotificationsRouter = (storeModel: TStoreModelFactory) => {
  const router = express.Router();
  const store = storeModel('notifications');

  router.get('/', async (_request, response, next) => {
    try {
      const items = (await store.getAll() as IStoreEntity[]).sort((left, right) => Number(right.at ?? 0) - Number(left.at ?? 0));
      response.json({ notifications: items });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:id/read', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Notification ID must be a positive integer' });
        return;
      }
      const item = await store.update(id, { read: true });
      if (!item) {
        response.status(404).json({ error: 'Notification not found' });
        return;
      }
      response.json({ notification: item });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Notification ID must be a positive integer' });
        return;
      }
      const removed = await store.delete(id);
      if (!removed) {
        response.status(404).json({ error: 'Notification not found' });
        return;
      }
      response.json({ notification: removed });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
