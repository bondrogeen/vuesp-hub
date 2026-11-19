import express from 'express';

import type { IStoreEntity, TStoreModelFactory } from '@shared/stores/types.ts';
import { parseAreaInput, type IArea } from '@server/modules/areas/application/area.ts';

const asArea = (value: Record<string, unknown>): IArea => value as unknown as IArea;
const parseId = (value: string): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createAreasRouter = (storeModel: TStoreModelFactory) => {
  const router = express.Router();
  const store = storeModel('areas');
  const assignments = storeModel('areaAssignments');

  const assignmentMap = async (): Promise<Record<string, string>> => {
    const result: Record<string, string> = {};
    for (const item of await assignments.getAll()) {
      if (typeof item.targetId === 'string' && typeof item.areaId === 'string') result[item.targetId] = item.areaId;
    }
    return result;
  };

  router.get('/', async (_request, response, next) => {
    try {
      const areas = (await store.getAll()).map(asArea).sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.name.localeCompare(right.name));
      response.json({ areas });
    } catch (error) {
      next(error);
    }
  });

  router.get('/assignments', async (_request, response, next) => {
    try {
      response.json({ assignments: await assignmentMap() });
    } catch (error) {
      next(error);
    }
  });

  router.put('/assignments', async (request, response, next) => {
    try {
      const targetId = typeof request.body?.targetId === 'string' ? request.body.targetId.trim() : '';
      const areaId = request.body?.areaId === null || request.body?.areaId === '' ? null : String(request.body?.areaId ?? '');
      if (!targetId || targetId.length > 256) {
        response.status(400).json({ error: 'targetId is required' });
        return;
      }
      if (areaId !== null) {
        const area = Number(areaId);
        if (!Number.isInteger(area) || !(await store.getById(area))) {
          response.status(400).json({ error: 'Area not found' });
          return;
        }
      }
      const existing = (await assignments.getAll()).find(item => item.targetId === targetId);
      if (areaId === null) {
        if (existing) await assignments.delete(existing.id);
        response.json({ assignment: null });
        return;
      }
      if (existing) await assignments.update(existing.id, { targetId, areaId });
      else await assignments.create({ targetId, areaId });
      response.json({ assignment: { targetId, areaId } });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (request, response, next) => {
    try {
      const area = await store.create({ ...parseAreaInput(request.body), order: parseAreaInput(request.body).order ?? 0 });
      response.status(201).json({ area: asArea(area) });
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
        response.status(400).json({ error: 'Area ID must be a positive integer' });
        return;
      }
      const area = await store.update(id, { ...parseAreaInput(request.body) } as Partial<IStoreEntity>);
      if (!area) {
        response.status(404).json({ error: 'Area not found' });
        return;
      }
      response.json({ area: asArea(area) });
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
        response.status(400).json({ error: 'Area ID must be a positive integer' });
        return;
      }
      const removed = await store.delete(id);
      if (!removed) {
        response.status(404).json({ error: 'Area not found' });
        return;
      }
      response.json({ area: asArea(removed) });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
