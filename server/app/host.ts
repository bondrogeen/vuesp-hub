import { DeviceRuntime } from '@core/application/deviceRuntime.ts';
import { ObjectRegistry } from '@core/application/objectRegistry.ts';
import { ActionService } from '@core/application/actionService.ts';
import { STATE_SCHEMA_VERSION, type IStateStore } from '@core/application/stateStore.ts';
import type { IConfigStore } from '@core/application/configStore.ts';
import type { IHistoryStore } from '@core/application/historyStore.ts';
import Core from '@core/core.ts';
import type { IDeviceConnectionRecord } from '@root/shared/device.ts';
import type { IAuthService } from '@server/modules/auth/application/authService.ts';
import type { IAccessRepository } from '@server/modules/access/infrastructure/jsonAccessRepository.ts';
import { VuespDevices } from '@server/modules/devices/application/vuespDevices.ts';
import { attachVuespObjects } from '@server/modules/devices/application/vuespObjectAdapter.ts';
import { VuespActionTarget } from '@server/modules/devices/application/vuespActionTarget.ts';
import { AdapterManager } from '@server/modules/adapters/application/adapterManager.ts';
import { CompositeActionTarget } from '@server/modules/adapters/application/compositeActionTarget.ts';
import { CONFIG_SECTIONS, createHubStoreModel } from '@server/shared/storage/hubStoreModel.ts';
import { AutomationEngine } from '@server/modules/automations/application/automationEngine.ts';
import { ScriptRuntime } from '@core/application/scriptRuntime.ts';
import { BackupService } from '@server/modules/backup/application/backupService.ts';
import { Watchdog, type IWatchdogTarget } from '@core/application/watchdog.ts';
import { AuditLog } from '@server/modules/audit/application/auditLog.ts';
import { loadModuleTrustPolicy } from '@server/modules/modules/application/moduleTrust.ts';
import { openWithRecovery } from '@server/shared/storage/recovery.ts';
import { createStorageFactories } from '@server/shared/storage/providers.ts';
import { UpdateManager } from '@server/modules/update/application/updateManager.ts';
import { APP_VERSION, DATA_SCHEMA_VERSION } from '@server/shared/version.ts';
import { backupFileName } from '@server/modules/backup/application/backupNaming.ts';
import { HistoryRecorder } from '@server/modules/history/application/historyRecorder.ts';
import type { IDeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import type { TStoreModelFactory } from '@shared/stores/types.ts';
import type { ISecretProvider } from '@shared/secrets/secretProvider.ts';
import { createCloudService, type ICloudService } from '@server/modules/cloud/application/cloudService.ts';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { createModuleHost, type TModuleHost } from '@server/module-host/moduleHost.ts';
import { createModuleCatalog, type TModuleCatalog } from '@server/modules/modules/application/moduleCatalog.ts';
import { server } from './server.ts';
import { errorMessage } from '@root/shared/errors.ts';

export interface ISettingsStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
}

export interface IHubTelemetryOptions {
  url: string;
  token: string;
  hubName?: string;
  dataDirectory: string;
}

export interface IHubOptions {
  getDeviceModel: () => Promise<IDeviceRepository>;
  closeDeviceModel?: () => Promise<void> | void;
  storeModel: TStoreModelFactory;
  serialSettingsStore: ISettingsStore;
  scriptRunnerPath?: string;
  staticDirectory?: string;
  auth?: IAuthService;
  access?: IAccessRepository;
  dataDirectory?: string;
  secretProvider?: ISecretProvider;
  host?: string;
  port?: number;
  /** Optional bootstrap credentials for headless installs; the UI pairing flow is preferred. */
  telemetry?: IHubTelemetryOptions;
  /** Path to the module runner bundle; enables the module host. */
  moduleRunnerPath?: string;
  modulesDirectory?: string;
  modulesCatalogUrl?: string;
}

export interface IHub {
  runtime: DeviceRuntime<IDeviceConnectionRecord>;
  objects: ObjectRegistry;
  adapters: AdapterManager;
  actions: ActionService;
  watchdog: Watchdog;
  stateStore?: IStateStore;
  configStore?: IConfigStore;
  historyStore?: IHistoryStore;
  automation?: AutomationEngine;
  backup?: BackupService;
  audit?: AuditLog;
  update?: UpdateManager;
  core: Core;
  cloud?: ICloudService;
  moduleHost?: TModuleHost;
  moduleCatalog?: TModuleCatalog;
  start(): Promise<void>;
  stop(): Promise<void>;
}

/**
 * Platform-neutral composition root shared by the Electron desktop app and the
 * headless server. Platform-specific pieces (database path, secret provider,
 * settings store, worker bundle path and web assets) are injected.
 */
export const createHub = ({
  getDeviceModel,
  closeDeviceModel,
  storeModel,
  serialSettingsStore,
  scriptRunnerPath,
  staticDirectory,
  auth,
  access,
  dataDirectory,
  secretProvider,
  host,
  port,
  telemetry,
  moduleRunnerPath,
  modulesDirectory,
  modulesCatalogUrl,
}: IHubOptions): IHub => {
  const runtime = new DeviceRuntime<IDeviceConnectionRecord>({
    loadDevices: async () => (await getDeviceModel()).getAll({ includeCredentials: true }),
    createConnections: devices => new VuespDevices(devices),
  });

  const core = new Core();
  const recovery = (name: string) => (moved: string[], error: unknown) => {
    core.log(
      `${name} store was corrupted (${errorMessage(error)}); moved ${moved.join(', ')} aside`,
      'error',
      name,
    );
    core.markDegraded(`${name} store was recreated after corruption`);
  };
  const storage = dataDirectory ? createStorageFactories({ dataDirectory }) : undefined;
  const statePath = dataDirectory ? path.join(dataDirectory, 'state.sqlite') : undefined;
  const configPath = dataDirectory ? path.join(dataDirectory, 'config.sqlite') : undefined;
  let stateStore: IStateStore | undefined;
  if (storage && statePath) {
    try {
      stateStore = openWithRecovery(statePath, () => storage.createState(), recovery('state'));
    } catch (error) {
      core.log(`State store could not be opened: ${errorMessage(error)}`, 'error', 'state');
      core.markDegraded('state store unavailable');
    }
  }
  const configStore = storage && configPath
    ? openWithRecovery(configPath, () => storage.createConfig(), recovery('config'))
    : undefined;
  const effectiveStoreModel = createHubStoreModel({ ...(configStore ? { configStore } : {}), fallback: storeModel });

  const { registry: objects, detach: detachObjects } = attachVuespObjects(runtime, undefined, {
    onChange: entityId => core.emitEvent('entity:changed', { entityId, at: Date.now() }),
  });
  const adapters = new AdapterManager(objects);
  const actions = new ActionService({ registry: objects, target: new CompositeActionTarget(new VuespActionTarget(runtime), adapters) });
  core.registerService('actions', actions);
  const historyPath = dataDirectory ? path.join(dataDirectory, 'history.sqlite') : undefined;
  const historyStore = storage && historyPath
    ? openWithRecovery(historyPath, () => storage.createHistory(), recovery('history'))
    : undefined;
  const historyRecorder = historyStore
    ? new HistoryRecorder({
        registry: objects,
        history: historyStore,
        onError: error => {
          core.log(`History append failed: ${errorMessage(error)}`, 'error', 'history');
          core.markDegraded('history persistence failed');
        },
      })
    : undefined;
  if (historyStore) core.registerService('history', historyStore);
  const automation = new AutomationEngine({
    registry: objects,
    actions,
    ...(historyStore ? { history: historyStore } : {}),
    rules: { getAll: () => effectiveStoreModel('automations').getAll() },
    scenes: { getAll: () => effectiveStoreModel('scenes').getAll() },
    notifications: { create: data => effectiveStoreModel('notifications').create(data as Record<string, unknown>) },
    now: () => Date.now(),
  });
  core.registerService('automation', automation);
  const scripts = scriptRunnerPath
    ? new ScriptRuntime({ registry: objects, actions, ...(historyStore ? { history: historyStore } : {}), runnerPath: scriptRunnerPath })
    : undefined;
  if (scripts) core.registerService('scripts', scripts);
  const backup = dataDirectory ? new BackupService({ dataDirectory, appVersion: APP_VERSION }) : undefined;
  const audit = dataDirectory ? new AuditLog({ directory: dataDirectory }) : undefined;
  const releaseRoot = process.env.VUESP_RELEASE_ROOT?.trim();
  const update = dataDirectory && releaseRoot
    ? new UpdateManager({
        releaseRoot: path.resolve(releaseRoot),
        statePath: path.join(dataDirectory, 'update-state.json'),
        ...(process.env.VUESP_UPDATE_PUBLIC_KEY ? { publicKey: process.env.VUESP_UPDATE_PUBLIC_KEY } : {}),
        ...(process.env.VUESP_UPDATE_MANIFEST_URL ? { manifestSource: process.env.VUESP_UPDATE_MANIFEST_URL } : {}),
        currentVersion: APP_VERSION,
        currentDataSchema: DATA_SCHEMA_VERSION,
        hooks: {
          health: () => core.getHealth().status !== 'error',
          backup: async () => {
            if (!backup) return;
            const directory = path.join(dataDirectory, 'backups');
            await mkdir(directory, { recursive: true, mode: 0o700 });
            const file = path.join(directory, backupFileName('pre-update', backup.encrypts));
            await backup.create(file);
          },
        },
      })
    : undefined;
  const watchdog = new Watchdog({
    intervalMs: 30_000,
    failureThreshold: 3,
    restartCooldownMs: 120_000,
    log: (level, message, targetId) => {
      core.log(message, level, targetId);
      if (level === 'error') core.markDegraded(message);
    },
    targets: async () => {
      const targets: IWatchdogTarget[] = [];
      for (const state of moduleHost?.states() ?? []) {
        if (!state.desired) continue;
        targets.push({
          id: `module:${state.id}`,
          check: () => ({
            ok: state.running,
            ...(state.running ? {} : { reason: 'module process is not running' }),
          }),
          restart: () => moduleHost!.start(state.id),
        });
      }
      if (adapters.list().length) {
        targets.push({
          id: 'adapters',
          check: async () => {
            const health = await adapters.health();
            const broken = Object.entries(health.adapters)
              .filter(([, value]) => value.status === 'error')
              .map(([id]) => id);
            return broken.length
              ? { ok: false, reason: `adapters with errors: ${broken.join(', ')}` }
              : { ok: health.status !== 'error', ...(health.status === 'error' ? { reason: 'adapter manager is in error state' } : {}) };
          },
        });
      }
      return targets;
    },
  });
  let historyRetentionTimer: ReturnType<typeof setInterval> | undefined;

  let stateSaveTimer: ReturnType<typeof setTimeout> | undefined;
  const saveState = async (): Promise<void> => {
    if (!stateStore) return;
    await stateStore.save({
      schemaVersion: STATE_SCHEMA_VERSION,
      savedAt: Date.now(),
      devices: objects.snapshotView().devices,
    });
  };
  const scheduleStateSave = (): void => {
    if (!stateStore) return;
    if (stateSaveTimer) clearTimeout(stateSaveTimer);
    stateSaveTimer = setTimeout(() => {
      stateSaveTimer = undefined;
      void saveState().catch(error => {
        core.log(`State save failed: ${errorMessage(error)}`, 'error', 'state');
        core.markDegraded('state persistence failed');
      });
    }, 2_000);
  };
  const unsubscribeState = stateStore ? objects.subscribe(scheduleStateSave) : () => undefined;

  const cloud = dataDirectory && secretProvider
    ? createCloudService({
        dataDirectory,
        secretProvider,
        runtime,
        getDeviceModel,
        ...(telemetry ? { bootstrap: { url: telemetry.url, token: telemetry.token, hubName: telemetry.hubName } } : {}),
      })
    : undefined;

  const moduleHost = dataDirectory && moduleRunnerPath
    ? createModuleHost({
        modulesDirectory: modulesDirectory ?? path.join(dataDirectory, 'modules'),
        dataDirectory,
        runnerPath: moduleRunnerPath,
        ...(auth ? { verifyModuleToken: (token, moduleId) => auth.verifyModuleToken(token, moduleId) } : {}),
        trust: loadModuleTrustPolicy(),
        gateway: {
          readObjects: () => objects.snapshotView(),
          executeAction: async input => {
            const body = input as Record<string, unknown>;
            if (typeof body?.deviceId !== 'string' || typeof body?.entityKey !== 'string' || !('value' in body)) {
              throw new TypeError('deviceId, entityKey and value are required');
            }
            return actions.execute({
              requestId: typeof body.requestId === 'string' ? body.requestId : undefined,
              deviceId: body.deviceId,
              entityKey: body.entityKey,
              value: body.value,
              source: 'module',
            });
          },
        },
      })
    : undefined;
  const moduleCatalog = modulesCatalogUrl ? createModuleCatalog({ url: modulesCatalogUrl }) : undefined;
  const http = server({
    staticDirectory,
    deviceRuntime: runtime,
    getDeviceModel,
    storeModel: effectiveStoreModel,
    serialSettingsStore,
      auth,
    access,
    cloud,
    moduleHost,
    moduleCatalog,
    core,
    objects,
    actions,
    ...(historyStore ? { history: historyStore } : {}),
    automation,
    ...(scripts ? { scripts } : {}),
    ...(backup ? { backup } : {}),
    ...(audit ? { audit } : {}),
    ...(update ? { update } : {}),
    adapters,
    host,
    port,
  });

  const start = async () => {
    if (historyStore) {
      const runRetention = (): void => {
        void historyStore.retention({ days: 30 }).catch(error => {
          core.log(`History retention failed: ${errorMessage(error)}`, 'error', 'history');
        });
      };
      runRetention();
      historyRetentionTimer = setInterval(runRetention, 86_400_000);
      historyRetentionTimer.unref?.();
    }
    if (configStore) {
      for (const section of CONFIG_SECTIONS) {
        const existing = await configStore.list(section);
        if (Object.keys(existing).length) continue;
        const legacy = await storeModel(section).getAll();
        for (const item of legacy) await configStore.set(section, String(item.id), item);
      }
    }
    if (stateStore) {
      try {
        objects.restore(await stateStore.load());
      } catch (error) {
        core.log(`State load failed: ${errorMessage(error)}`, 'error', 'state');
        core.markDegraded('state store unavailable');
      }
    }
    await adapters.startAll();
    await automation.start();
    historyRecorder?.start();
    cloud?.start();
    await runtime.start();
    await http.createExpress();
    await core.init();
    // Modules are optional; never block the base hub startup on them.
    void moduleHost?.startAll();
    watchdog.start();
  };

  const stop = async () => {
    const errors: unknown[] = [];
    watchdog.stop();
    if (stateSaveTimer) clearTimeout(stateSaveTimer);
    stateSaveTimer = undefined;
    if (historyRetentionTimer) clearInterval(historyRetentionTimer);
    historyRetentionTimer = undefined;
    for (const shutdown of [
      () => saveState(),
      () => adapters.stopAll(),
      () => automation.stop(),
      () => historyRecorder?.stop(),
      detachObjects,
      () => unsubscribeState(),
      http.closeExpress,
      () => core.shutdown(),
      () => cloud?.stop(),
      () => moduleHost?.stopAll(),
      () => runtime.stop(),
      () => closeDeviceModel?.(),
      () => stateStore?.close(),
      () => historyStore?.close(),
      () => configStore?.close(),
    ]) {
      try {
        await shutdown();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, 'One or more hub services failed to shut down');
  };

  return { runtime, core, objects, adapters, actions, watchdog, ...(stateStore ? { stateStore } : {}), ...(configStore ? { configStore } : {}), ...(historyStore ? { historyStore } : {}), automation, ...(scripts ? { scripts } : {}), ...(backup ? { backup } : {}), ...(audit ? { audit } : {}), ...(update ? { update } : {}), cloud, moduleHost, moduleCatalog, start, stop };
};
