import { DeviceRuntime } from '../../core/application/deviceRuntime.ts';
import Core from '../../core/core.ts';
import type { CameraStore } from '../modules/cameras/application/cameraStore.ts';
import type { DeviceConnectionRecord } from '../../shared/device.ts';
import type { AuthService } from '../modules/auth/application/authService.ts';
import type { AccessRepository } from '../modules/access/infrastructure/jsonAccessRepository.ts';
import { VuespDevices } from '../modules/devices/application/vuespDevices.ts';
import type { DeviceRepository } from '../modules/devices/infrastructure/deviceRepository.ts';
import type { StoreModelFactory } from '../shared/stores/types.ts';
import { TelemetrySender } from '../modules/telemetry/application/telemetrySender.ts';
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
  host?: string;
  port?: number;
  /** Opt-in cloud telemetry; disabled when omitted. */
  telemetry?: HubTelemetryOptions;
}

export interface Hub {
  runtime: DeviceRuntime<DeviceConnectionRecord>;
  core: Core;
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
  host,
  port,
  telemetry,
}: HubOptions): Hub => {
  const runtime = new DeviceRuntime<DeviceConnectionRecord>({
    loadDevices: async () => (await getDeviceModel()).getAll({ includeCredentials: true }),
    createConnections: devices => new VuespDevices(devices),
  });

  const telemetrySender = telemetry
    ? new TelemetrySender({
        runtime,
        getDeviceModel,
        url: telemetry.url,
        token: telemetry.token,
        hubName: telemetry.hubName,
        dataDirectory: telemetry.dataDirectory,
      })
    : undefined;

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
    host,
    port,
  });

  const start = async () => {
    telemetrySender?.start();
    await runtime.start();
    await http.createExpress();
    await core.init();
  };

  const stop = async () => {
    const errors: unknown[] = [];
    for (const shutdown of [
      http.closeExpress,
      () => core.shutdown(),
      () => telemetrySender?.stop(),
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

  return { runtime, core, start, stop };
};
