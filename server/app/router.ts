import express from 'express';

import { createUserRouter } from '@server/modules/users/api/userRoutes.ts';
import { createUserAdminRouter } from '@server/modules/users/api/userAdminRoutes.ts';
import { createVuespRouter } from '@server/modules/devices/api/vuespRoutes.ts';
import { createCloudRouter } from '@server/modules/cloud/api/cloudRoutes.ts';
import { createModuleRouter } from '@server/modules/modules/api/moduleRoutes.ts';
import type { ModuleHost } from '@server/module-host/moduleHost.ts';
import type { ModuleCatalog } from '@server/modules/modules/application/moduleCatalog.ts';
import modbusRoutes from '@server/modules/serial/api/modbusRoutes.ts';
import type { DeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import type { StoreModelFactory } from '@shared/stores/types.ts';
import type { AuthService } from '@server/modules/auth/application/authService.ts';
import type { CloudService } from '@server/modules/cloud/application/cloudService.ts';

export const createRouter = ({
  getDeviceModel,
  storeModel,
  auth,
  cloud,
  moduleHost,
  moduleCatalog,
}: {
  getDeviceModel: () => Promise<DeviceRepository>;
  storeModel: StoreModelFactory;
  auth?: AuthService;
  cloud?: CloudService;
  moduleHost?: ModuleHost;
  moduleCatalog?: ModuleCatalog;
}) => {
  const router = express.Router();

  router.use('/user', createUserRouter(storeModel));
  if (auth) router.use('/users', createUserAdminRouter(auth));
  router.use('/device', createVuespRouter(getDeviceModel));
  if (cloud) router.use('/cloud', createCloudRouter(cloud));
  if (moduleHost) router.use('/modules', createModuleRouter({ moduleHost, auth, catalog: moduleCatalog }));
  router.use('/modbus', modbusRoutes);

  return router;
};
