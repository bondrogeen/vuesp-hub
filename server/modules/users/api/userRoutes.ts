import { Router } from 'express';
import generalController from './generalController.ts';
import type { StoreModelFactory } from '@shared/stores/types.ts';

export const createUserRouter = (storeModel: StoreModelFactory) => {
    const router = Router();
    const controller = generalController(storeModel('user'));

    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    return router;
};