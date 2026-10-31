import { Router } from 'express';
import { modbusController } from '../controllers/index.ts';

const router = Router();

const controller = modbusController();


router.get('/send', controller.send);
// router.get('/:id', controller.getById);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.delete('/:id', controller.delete);

export default router;