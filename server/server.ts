import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { DeviceRuntime } from '../core/application/deviceRuntime.ts';
import { VuespDevices } from './devices/vuespDevices.ts';
import { createRouter } from './routes/index.ts';
import proxy from './routes/proxy.ts';
import type { DeviceRepository } from './models/deviceRepository.ts';
import type { StoreModelFactory } from './models/storeModel.ts';
import { socketDevice } from './sockets/device.ts';
import { socketSerial } from './sockets/serial.ts';
import { socketStream } from './sockets/stream.ts';

const port = 3005;
const host = '127.0.0.1';

interface SettingsStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
}

interface ServerOptions {
  staticDirectory?: string;
  getDeviceModel: () => Promise<DeviceRepository>;
  closeDeviceModel: () => Promise<void>;
  storeModel: StoreModelFactory;
  serialSettingsStore: SettingsStore;
}

type StoredDevice = ReturnType<DeviceRepository['getAll']>[number];

export const server = ({
  staticDirectory,
  getDeviceModel,
  closeDeviceModel,
  storeModel,
  serialSettingsStore,
}: ServerOptions) => {
  let httpServer: ReturnType<typeof createServer> | undefined;
  let deviceRuntime: DeviceRuntime<StoredDevice> | undefined;
  let detachDeviceSocket: (() => void) | undefined;

  const createExpress = async () => {
    await getDeviceModel();
    deviceRuntime = new DeviceRuntime({
      loadDevices: async () => (await getDeviceModel()).getAll({ includeCredentials: true }),
      createConnections: devices => new VuespDevices(devices),
    });
    const app = express();

    app.use(express.json());
    if (staticDirectory) app.use(express.static(staticDirectory));

    httpServer = createServer(app);
    const ioDevice = new Server(httpServer, { path: '/ws/device/', cors: { origin: '*', methods: ['GET', 'POST'] } });
    const ioStream = new Server(httpServer, { path: '/ws/stream/', cors: { origin: '*', methods: ['GET', 'POST'] } });
    const ioSerial = new Server(httpServer, { path: '/ws/serial/', cors: { origin: '*', methods: ['GET', 'POST'] } });

    app.use('/api/v1', createRouter({ getDeviceModel, storeModel }));
    app.use('/proxy', proxy);
    detachDeviceSocket = socketDevice(ioDevice, deviceRuntime);
    socketStream(ioStream);
    socketSerial(ioSerial, serialSettingsStore);

    await new Promise<void>((resolve, reject) => {
      const onError = error => {
        httpServer?.off('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        httpServer?.off('error', onError);
        console.log(`Server started on http://${host}:${port}`);
        resolve();
      };
      httpServer?.once('error', onError);
      httpServer?.once('listening', onListening);
      httpServer?.listen(port, host);
    });
  };

  const closeExpress = async () => {
    detachDeviceSocket?.();
    detachDeviceSocket = undefined;
    await deviceRuntime?.stop();
    deviceRuntime = undefined;
    if (httpServer?.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer?.close(error => error ? reject(error) : resolve());
      });
    }
    await closeDeviceModel();
  };

  return {
    createExpress,
    closeExpress,
  };
};
