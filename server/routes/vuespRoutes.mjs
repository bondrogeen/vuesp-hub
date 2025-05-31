import { Router } from 'express';
import { generalController, vuespController } from '../controllers/index.mjs';
import { storeModel } from '../models/index.mjs';

const router = Router();

const model = storeModel('device');
const controller = generalController(model);
const vuesp = vuespController();


router.get('/scan/', vuesp.scan);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;