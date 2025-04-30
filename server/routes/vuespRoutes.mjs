// routes/userRoutes.js
import { Router } from 'express';
import { vuespController } from '../controllers/index.mjs';

const router = Router();

router.get('/', vuespController.getAll);
router.post('/', vuespController.create);
router.put('/:id', vuespController.update);
router.delete('/:id', vuespController.delete);

export default router;