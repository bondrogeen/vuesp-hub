import { Router } from 'express';

import userRoutes from './userRoutes';
import vuespRoutes from './vuespRoutes';
import modbusRoutes from './modbusRoutes';

const router = new Router();

router.use('/user', userRoutes);
router.use('/device', vuespRoutes);
router.use('/modbus', modbusRoutes);

export default router;