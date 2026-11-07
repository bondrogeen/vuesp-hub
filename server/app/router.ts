import express from 'express';

import { createCameraRouter } from '../modules/cameras/api/cameraRoutes.ts';
import { createUserRouter } from '../modules/users/api/userRoutes.ts';
import { createUserAdminRouter } from '../modules/users/api/userAdminRoutes.ts';
import { createVuespRouter } from '../modules/devices/api/vuespRoutes.ts';
import modbusRoutes from '../modules/serial/api/modbusRoutes.ts';
import type { CameraStore } from '../modules/cameras/application/cameraStore.ts';
import type { DeviceRepository } from '../modules/devices/infrastructure/deviceRepository.ts';
import type { StoreModelFactory } from '../shared/stores/types.ts';
import type { CameraStreamManager } from '../modules/cameras/sockets/stream.ts';
import type { AuthService } from '../modules/auth/application/authService.ts';

export const createRouter = ({
  getDeviceModel,
  storeModel,
  cameraStore,
  streamManager,
  auth,
}: {
  getDeviceModel: () => Promise<DeviceRepository>;
  storeModel: StoreModelFactory;
  cameraStore: CameraStore;
  streamManager: CameraStreamManager;
  auth?: AuthService;
}) => {
  const router = express.Router();

  router.use('/user', createUserRouter(storeModel));
  if (auth) router.use('/users', createUserAdminRouter(auth));
  router.use('/device', createVuespRouter(getDeviceModel));
  router.use('/modbus', modbusRoutes);
  router.use('/cameras', createCameraRouter({ cameraStore, streamManager }));

  return router;
};
