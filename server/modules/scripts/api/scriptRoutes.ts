import express from 'express';

import type { ScriptRuntime } from '@core/application/scriptRuntime.ts';
import type { TStoreModelFactory } from '@shared/stores/types.ts';

const parseId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const scriptInput = (value: unknown): { name: string; code: string; timeoutMs: number; memoryMb: number; enabled: boolean } => {
  if (!value || typeof value !== 'object') throw new TypeError('Script must be an object');
  const body = value as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const code = typeof body.code === 'string' ? body.code : '';
  if (!name || name.length > 64) throw new TypeError('Script name must contain 1 to 64 characters');
  if (!code || code.length > 256_000) throw new TypeError('Script code is required and must be at most 256 KB');
  return {
    name,
    code,
    timeoutMs: typeof body.timeoutMs === 'number' ? body.timeoutMs : 2_000,
    memoryMb: typeof body.memoryMb === 'number' ? body.memoryMb : 64,
    enabled: body.enabled !== false,
  };
};

export const createScriptsRouter = (scripts: ScriptRuntime, storeModel: TStoreModelFactory) => {
  const router = express.Router();
  const store = storeModel('scripts');

  router.get('/', async (_request, response, next) => {
    try {
      response.json({ scripts: await store.getAll() });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const script = await store.create(scriptInput(request.body));
      response.status(201).json({ script });
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
        response.status(400).json({ error: 'Script ID must be a positive integer' });
        return;
      }
      const script = await store.update(id, scriptInput(request.body));
      if (!script) {
        response.status(404).json({ error: 'Script not found' });
        return;
      }
      response.json({ script });
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
        response.status(400).json({ error: 'Script ID must be a positive integer' });
        return;
      }
      const removed = await store.delete(id);
      if (!removed) {
        response.status(404).json({ error: 'Script not found' });
        return;
      }
      response.json({ script: removed });
    } catch (error) {
      next(error);
    }
  });

  router.post('/:id/run', async (request, response, next) => {
    try {
      const id = parseId(request.params.id);
      if (!id) {
        response.status(400).json({ error: 'Script ID must be a positive integer' });
        return;
      }
      const script = await store.getById(id);
      if (!script || typeof script.code !== 'string') {
        response.status(404).json({ error: 'Script not found' });
        return;
      }
      const result = await scripts.run({
        code: script.code,
        timeoutMs: typeof script.timeoutMs === 'number' ? script.timeoutMs : 2_000,
        memoryMb: typeof script.memoryMb === 'number' ? script.memoryMb : 64,
      });
      response.json({ result });
    } catch (error) {
      next(error);
    }
  });

  router.post('/run', async (request, response, next) => {
    try {
      const code = typeof request.body?.code === 'string' ? request.body.code : '';
      const result = await scripts.run({
        code,
        timeoutMs: typeof request.body?.timeoutMs === 'number' ? request.body.timeoutMs : 2_000,
        memoryMb: typeof request.body?.memoryMb === 'number' ? request.body.memoryMb : 64,
      });
      response.json({ result });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
