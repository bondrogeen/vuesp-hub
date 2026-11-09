import express from 'express';

import { createCameraRouter } from '@server/modules/cameras/api/cameraRoutes.ts';
import { createUserRouter } from '@server/modules/users/api/userRoutes.ts';
import { createUserAdminRouter } from '@server/modules/users/api/userAdminRoutes.ts';
import { createVuespRouter } from '@server/modules/devices/api/vuespRoutes.ts';
import { createAlisaRouter } from '@server/modules/alisa/api/alisaRoutes.ts';
import { createCloudRouter } from '@server/modules/cloud/api/cloudRoutes.ts';
import modbusRoutes from '@server/modules/serial/api/modbusRoutes.ts';
import type { CameraStore } from '@server/modules/cameras/application/cameraStore.ts';
import type { DeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import type { StoreModelFactory } from '@shared/stores/types.ts';
import type { CameraStreamManager } from '@server/modules/cameras/sockets/stream.ts';
import type { AuthService } from '@server/modules/auth/application/authService.ts';
import type { AlisaService } from '@server/modules/alisa/application/alisaService.ts';
import type { CloudService } from '@server/modules/cloud/application/cloudService.ts';

export const createRouter = ({
  getDeviceModel,
  storeModel,
  cameraStore,
  streamManager,
  auth,
  alisa,
  cloud,
}: {
  getDeviceModel: () => Promise<DeviceRepository>;
  storeModel: StoreModelFactory;
  cameraStore: CameraStore;
  streamManager: CameraStreamManager;
  auth?: AuthService;
  alisa?: AlisaService;
  cloud?: CloudService;
}) => {
  const router = express.Router();

  router.use('/user', createUserRouter(storeModel));
  if (auth) router.use('/users', createUserAdminRouter(auth));
  router.use('/device', createVuespRouter(getDeviceModel));
  if (alisa) router.use('/alisa', createAlisaRouter(alisa));
  if (cloud) router.use('/cloud', createCloudRouter(cloud));
  router.use('/modbus', modbusRoutes);
  router.use('/cameras', createCameraRouter({ cameraStore, streamManager }));

  return router;
};
