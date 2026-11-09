import { DeviceRuntime } from '@core/application/deviceRuntime.ts';
import Core from '@core/core.ts';
import type { CameraStore } from '@server/modules/cameras/application/cameraStore.ts';
import type { DeviceConnectionRecord } from '@root/shared/device.ts';
import type { AuthService } from '@server/modules/auth/application/authService.ts';
import type { AccessRepository } from '@server/modules/access/infrastructure/jsonAccessRepository.ts';
import { VuespDevices } from '@server/modules/devices/application/vuespDevices.ts';
import type { DeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import type { StoreModelFactory } from '@shared/stores/types.ts';
import type { SecretProvider } from '@shared/secrets/secretProvider.ts';
import { createAlisaService } from '@server/modules/alisa/application/alisaService.ts';
import { createCloudService, type CloudService } from '@server/modules/cloud/application/cloudService.ts';
import { server } from './server.ts';

export interface SettingsStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
}

export interface HubTelemetryOptions {
  url: string;
  token: string;
  hubName?: string;
  dataDirectory: string;
}

export interface HubOptions {
  getDeviceModel: () => Promise<DeviceRepository>;
  closeDeviceModel?: () => Promise<void> | void;
  storeModel: StoreModelFactory;
  serialSettingsStore: SettingsStore;
  cameraStore: CameraStore;
  workerScriptPath: string;
  staticDirectory?: string;
  auth?: AuthService;
  access?: AccessRepository;
  dataDirectory?: string;
  secretProvider?: SecretProvider;
  host?: string;
  port?: number;
  /** Optional bootstrap credentials for headless installs; the UI pairing flow is preferred. */
  telemetry?: HubTelemetryOptions;
}

export interface Hub {
  runtime: DeviceRuntime<DeviceConnectionRecord>;
  core: Core;
  cloud?: CloudService;
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
  cameraStore,
  workerScriptPath,
  staticDirectory,
  auth,
  access,
  dataDirectory,
  secretProvider,
  host,
  port,
  telemetry,
}: HubOptions): Hub => {
  const runtime = new DeviceRuntime<DeviceConnectionRecord>({
    loadDevices: async () => (await getDeviceModel()).getAll({ includeCredentials: true }),
    createConnections: devices => new VuespDevices(devices),
  });

  const cloud = dataDirectory && secretProvider
    ? createCloudService({
        dataDirectory,
        secretProvider,
        runtime,
        getDeviceModel,
        ...(telemetry ? { bootstrap: { url: telemetry.url, token: telemetry.token, hubName: telemetry.hubName } } : {}),
      })
    : undefined;

  const alisa = dataDirectory && secretProvider ? createAlisaService({ dataDirectory, secretProvider }) : undefined;
  const core = new Core({ workerScriptPath });
  const http = server({
    staticDirectory,
    deviceRuntime: runtime,
    getDeviceModel,
    storeModel,
    serialSettingsStore,
    cameraStore,
    auth,
    access,
    alisa,
    cloud,
    host,
    port,
  });

  const start = async () => {
    cloud?.start();
    await runtime.start();
    await http.createExpress();
    await core.init();
  };

  const stop = async () => {
    const errors: unknown[] = [];
    for (const shutdown of [
      http.closeExpress,
      () => core.shutdown(),
      () => cloud?.stop(),
      () => alisa?.dispose(),
      () => runtime.stop(),
      () => closeDeviceModel?.(),
    ]) {
      try {
        await shutdown();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, 'One or more hub services failed to shut down');
  };

  return { runtime, core, cloud, start, stop };
};
