import { Router } from 'express';

import userRoutes from './userRoutes';
import vuespRoutes from './vuespRoutes';

const router = new Router();

router.use('/user', userRoutes);
router.use('/vuesp', vuespRoutes);

export default router;