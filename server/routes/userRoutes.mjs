// routes/userRoutes.js
import { Router } from 'express';
import { userController } from '../controllers/index.mjs';

const router = Router();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

export default router;