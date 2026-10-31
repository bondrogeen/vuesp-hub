import express from 'express';

import { createUserRouter } from './userRoutes.ts';
import { createVuespRouter } from './vuespRoutes.ts';
import modbusRoutes from './modbusRoutes.ts';
import type { DeviceRepository } from '../models/deviceRepository.ts';
import type { StoreModelFactory } from '../models/storeModel.ts';

export const createRouter = ({
  getDeviceModel,
  storeModel,
}: {
  getDeviceModel: () => Promise<DeviceRepository>;
  storeModel: StoreModelFactory;
}) => {
  const router = express.Router();

  router.use('/user', createUserRouter(storeModel));
  router.use('/device', createVuespRouter(getDeviceModel));
  router.use('/modbus', modbusRoutes);

  return router;
};