import { Router } from 'express';
import { modbusController } from '../controllers/index.mjs';
import { storeModel } from '../models/index.mjs';

const router = Router();

const model = storeModel('user');
const controller = modbusController(model);


router.get('/send', controller.send);
// router.get('/:id', controller.getById);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.delete('/:id', controller.delete);

export default router;