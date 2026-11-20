import express from 'express';

import { createUserRouter } from '@server/modules/users/api/userRoutes.ts';
import { createUserAdminRouter } from '@server/modules/users/api/userAdminRoutes.ts';
import { createVuespRouter } from '@server/modules/devices/api/vuespRoutes.ts';
import { createCloudRouter } from '@server/modules/cloud/api/cloudRoutes.ts';
import { createModuleRouter } from '@server/modules/modules/api/moduleRoutes.ts';
import { createSystemRouter } from '@server/modules/system/api/systemRoutes.ts';
import { createObjectRouter } from '@server/modules/objects/api/objectRoutes.ts';
import { createPanelsRouter } from '@server/modules/panels/api/panelRoutes.ts';
import { createAreasRouter } from '@server/modules/areas/api/areaRoutes.ts';
import { createActionsRouter } from '@server/modules/actions/api/actionRoutes.ts';
import { createHistoryRouter } from '@server/modules/history/api/historyRoutes.ts';
import { createNotificationsRouter, createRulesRouter, createScenesRouter } from '@server/modules/automations/api/automationRoutes.ts';
import { createScriptsRouter } from '@server/modules/scripts/api/scriptRoutes.ts';
import type { TModuleHost } from '@server/module-host/moduleHost.ts';
import type { TModuleCatalog } from '@server/modules/modules/application/moduleCatalog.ts';
import modbusRoutes from '@server/modules/serial/api/modbusRoutes.ts';
import type { IDeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import type { TStoreModelFactory } from '@shared/stores/types.ts';
import type { IAuthService } from '@server/modules/auth/application/authService.ts';
import type { ICloudService } from '@server/modules/cloud/application/cloudService.ts';
import type Core from '@core/core.ts';
import type { ObjectRegistry } from '@core/application/objectRegistry.ts';
import type { ActionService } from '@core/application/actionService.ts';
import type { IHistoryStore } from '@core/application/historyStore.ts';
import type { AutomationEngine } from '@server/modules/automations/application/automationEngine.ts';
import type { ScriptRuntime } from '@core/application/scriptRuntime.ts';
import type { BackupService } from '@server/modules/backup/application/backupService.ts';
import type { AuditLog } from '@server/modules/audit/application/auditLog.ts';
import type { UpdateManager } from '@server/modules/update/application/updateManager.ts';
import type { AdapterManager } from '@server/modules/adapters/application/adapterManager.ts';
import { createAdapterRouter } from '@server/modules/adapters/api/adapterRoutes.ts';

export const createRouter = ({
  getDeviceModel,
  storeModel,
  auth,
  cloud,
  moduleHost,
  moduleCatalog,
  core,
  objects,
  actions,
  history,
  automation,
  scripts,
  backup,
  audit,
  update,
  adapters,
}: {
  getDeviceModel: () => Promise<IDeviceRepository>;
  storeModel: TStoreModelFactory;
  auth?: IAuthService;
  cloud?: ICloudService;
  moduleHost?: TModuleHost;
  moduleCatalog?: TModuleCatalog;
  core?: Core;
  objects?: ObjectRegistry;
  actions?: ActionService;
  history?: IHistoryStore;
  automation?: AutomationEngine;
  scripts?: ScriptRuntime;
  backup?: BackupService;
  audit?: AuditLog;
  update?: UpdateManager;
  adapters?: AdapterManager;
}) => {
  const router = express.Router();

  router.use('/user', createUserRouter(storeModel));
  if (auth) router.use('/users', createUserAdminRouter(auth));
  router.use('/device', createVuespRouter(getDeviceModel));
  if (cloud) router.use('/cloud', createCloudRouter(cloud));
  if (moduleHost) router.use('/modules', createModuleRouter({ moduleHost, auth, catalog: moduleCatalog }));
  if (core) router.use('/system', createSystemRouter(core, backup, audit, update));
  if (objects) router.use('/objects', createObjectRouter(objects));
  if (adapters) router.use('/adapters', createAdapterRouter(adapters));
  router.use('/panels', createPanelsRouter(storeModel));
  router.use('/areas', createAreasRouter(storeModel));
  if (actions) router.use('/actions', createActionsRouter(actions, audit));
  if (history) router.use('/history', createHistoryRouter(history));
  if (automation) {
    router.use('/automations', createRulesRouter(automation, storeModel));
    router.use('/scenes', createScenesRouter(automation, storeModel));
  }
  if (scripts) router.use('/scripts', createScriptsRouter(scripts, storeModel));
  router.use('/notifications', createNotificationsRouter(storeModel));
  router.use('/modbus', modbusRoutes);

  return router;
};
