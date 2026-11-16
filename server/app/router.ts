import express from 'express';

import { createUserRouter } from '@server/modules/users/api/userRoutes.ts';
import { createUserAdminRouter } from '@server/modules/users/api/userAdminRoutes.ts';
import { createVuespRouter } from '@server/modules/devices/api/vuespRoutes.ts';
import { createCloudRouter } from '@server/modules/cloud/api/cloudRoutes.ts';
import { createModuleRouter } from '@server/modules/modules/api/moduleRoutes.ts';
import type { TModuleHost } from '@server/module-host/moduleHost.ts';
import type { TModuleCatalog } from '@server/modules/modules/application/moduleCatalog.ts';
import modbusRoutes from '@server/modules/serial/api/modbusRoutes.ts';
import type { IDeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import type { TStoreModelFactory } from '@shared/stores/types.ts';
import type { IAuthService } from '@server/modules/auth/application/authService.ts';
import type { ICloudService } from '@server/modules/cloud/application/cloudService.ts';

export const createRouter = ({
  getDeviceModel,
  storeModel,
  auth,
  cloud,
  moduleHost,
  moduleCatalog,
}: {
  getDeviceModel: () => Promise<IDeviceRepository>;
  storeModel: TStoreModelFactory;
  auth?: IAuthService;
  cloud?: ICloudService;
  moduleHost?: TModuleHost;
  moduleCatalog?: TModuleCatalog;
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
