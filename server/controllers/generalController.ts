import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '../../shared/api.ts';
import type { StoreModel } from '../models/storeModel.ts';
import { sendApiError, sendApiFailure } from '../http/apiResponse.ts';

interface ResourceParams {
  id: string;
}

const parseResourceId = (value: string): number => {
  if (!/^[1-9]\d*$/.test(value)) throw new TypeError('ID must be a positive integer');
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new TypeError('ID must be a positive integer');
  return id;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseResourceData = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new TypeError('Request body must be an object');
  }
  return value;
};

export default (model: StoreModel) => ({
  async getById(req: Request<ResourceParams>, res: Response) {
    try {
      const user = await model.getById(parseResourceId(req.params.id));
      if (user) return res.json(user);
      return sendApiError(res, 404, 'Not found');
    } catch (error) {
      return sendApiFailure(res, error, 'User API request');
    }
  },

  async getAll(_req: Request, res: Response) {
    try {
      return res.json(await model.getAll());
    } catch (error) {
      return sendApiFailure(res, error, 'User API request');
    }
  },

  async create(req: Request, res: Response) {
    try {
      const newUser = await model.create(parseResourceData(req.body));
      return res.status(201).json(newUser);
    } catch (error) {
      return sendApiFailure(res, error, 'User API request');
    }
  },

  async update(req: Request<ResourceParams>, res: Response) {
    try {
      const updatedUser = await model.update(
        parseResourceId(req.params.id),
        parseResourceData(req.body),
      );
      if (updatedUser) return res.json(updatedUser);
      return sendApiError(res, 404, 'Not found');
    } catch (error) {
      return sendApiFailure(res, error, 'User API request');
    }
  },

  async delete(req: Request<ResourceParams>, res: Response) {
    try {
      const deletedUser = await model.delete(parseResourceId(req.params.id));
      if (deletedUser) return res.status(200).json(deletedUser);
      return sendApiError(res, 404, 'Not found');
    } catch (error) {
      return sendApiFailure(res, error, 'User API request');
    }
  },
});
