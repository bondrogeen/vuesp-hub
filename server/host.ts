import { DeviceRuntime } from '../core/application/deviceRuntime.ts';
import Core from '../core/core.ts';
import type { DeviceConnectionRecord } from '../shared/device.ts';
import type { AuthService } from './auth/authService.ts';
import { VuespDevices } from './devices/vuespDevices.ts';
import type { DeviceRepository } from './models/deviceRepository.ts';
import type { StoreModelFactory } from './models/storeModel.ts';
import { server } from './server.ts';

export interface SettingsStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
}

export interface HubOptions {
  getDeviceModel: () => Promise<DeviceRepository>;
  closeDeviceModel?: () => Promise<void> | void;
  storeModel: StoreModelFactory;
  serialSettingsStore: SettingsStore;
  workerScriptPath: string;
  staticDirectory?: string;
  auth?: AuthService;
  host?: string;
  port?: number;
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
  workerScriptPath,
  staticDirectory,
  auth,
  host,
  port,
}: HubOptions): Hub => {
  const runtime = new DeviceRuntime<DeviceConnectionRecord>({
    loadDevices: async () => (await getDeviceModel()).getAll({ includeCredentials: true }),
    createConnections: devices => new VuespDevices(devices),
  });

  const core = new Core({ workerScriptPath });
  const http = server({
    staticDirectory,
    deviceRuntime: runtime,
    getDeviceModel,
    storeModel,
    serialSettingsStore,
    auth,
    host,
    port,
  });

  const start = async () => {
    await runtime.start();
    await http.createExpress();
    await core.init();
  };

  const stop = async () => {
    const errors: unknown[] = [];
    for (const shutdown of [
      http.closeExpress,
      () => core.shutdown(),
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
