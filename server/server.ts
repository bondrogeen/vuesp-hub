import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import type { DeviceRuntime } from '../core/application/deviceRuntime.ts';
import type { AuthService } from './auth/authService.ts';
import { requireAuth, socketAuth } from './auth/middleware.ts';
import { createAuthRouter } from './routes/authRoutes.ts';
import { createRouter } from './routes/index.ts';
import proxy from './routes/proxy.ts';
import type { DeviceRepository } from './models/deviceRepository.ts';
import type { StoreModelFactory } from './models/storeModel.ts';
import { socketDevice } from './sockets/device.ts';
import { socketSerial } from './sockets/serial.ts';
import { socketStream } from './sockets/stream.ts';

const defaultPort = 3005;
const defaultHost = '127.0.0.1';

interface SettingsStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
}

interface ServerOptions {
  staticDirectory?: string;
  deviceRuntime: DeviceRuntime<unknown>;
  getDeviceModel: () => Promise<DeviceRepository>;
  storeModel: StoreModelFactory;
  serialSettingsStore: SettingsStore;
  auth?: AuthService;
  host?: string;
  port?: number;
}

export const server = ({
  staticDirectory,
  deviceRuntime,
  getDeviceModel,
  storeModel,
  serialSettingsStore,
  auth,
  host = defaultHost,
  port = defaultPort,
}: ServerOptions) => {
  let httpServer: ReturnType<typeof createServer> | undefined;
  let ioDevice: Server | undefined;
  let ioStream: Server | undefined;
  let ioSerial: Server | undefined;
  let detachDeviceSocket: (() => void) | undefined;

  const createExpress = async () => {
    await getDeviceModel();
    const app = express();

    app.use(express.json());
    if (staticDirectory) app.use(express.static(staticDirectory));

    httpServer = createServer(app);
    ioDevice = new Server(httpServer, { path: '/ws/device/', cors: { origin: '*', methods: ['GET', 'POST'] } });
    ioStream = new Server(httpServer, { path: '/ws/stream/', cors: { origin: '*', methods: ['GET', 'POST'] } });
    ioSerial = new Server(httpServer, { path: '/ws/serial/', cors: { origin: '*', methods: ['GET', 'POST'] } });

    if (auth) {
      ioDevice.use(socketAuth(auth));
      ioStream.use(socketAuth(auth));
      ioSerial.use(socketAuth(auth));
    }

    const apiRouter = createRouter({ getDeviceModel, storeModel });
    if (auth) {
      app.use('/api/v1/auth', createAuthRouter(auth));
      app.use('/api/v1', requireAuth(auth), apiRouter);
      app.use('/proxy', requireAuth(auth), proxy);
    } else {
      app.use('/api/v1', apiRouter);
      app.use('/proxy', proxy);
    }

    if (staticDirectory) {
      app.use((request, response, next) => {
        if (request.method !== 'GET' || request.path.startsWith('/api/') || request.path.startsWith('/proxy') || request.path.startsWith('/ws/')) {
          return next();
        }
        response.sendFile('index.html', { root: staticDirectory }, error => {
          if (error) next();
        });
      });
    }

    detachDeviceSocket = socketDevice(ioDevice, deviceRuntime);
    socketStream(ioStream);
    socketSerial(ioSerial, serialSettingsStore);

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
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

  const closeSocketServer = (io?: Server) =>
    new Promise<void>(resolve => {
      if (!io) return resolve();
      io.disconnectSockets(true);
      io.close(() => resolve());
    });

  const closeExpress = async () => {
    detachDeviceSocket?.();
    detachDeviceSocket = undefined;

    await Promise.all([closeSocketServer(ioDevice), closeSocketServer(ioStream), closeSocketServer(ioSerial)]);
    ioDevice = undefined;
    ioStream = undefined;
    ioSerial = undefined;

    if (httpServer) {
      httpServer.closeAllConnections?.();
      httpServer.closeIdleConnections?.();
      if (httpServer.listening) {
        await new Promise<void>((resolve, reject) => {
          httpServer?.close(error => error ? reject(error) : resolve());
        });
      }
      httpServer = undefined;
    }
  };

  return {
    createExpress,
    closeExpress,
  };
};
