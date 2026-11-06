import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import type { DeviceRuntime } from '../../core/application/deviceRuntime.ts';
import type { AuthService } from '../modules/auth/application/authService.ts';
import { requireAuth, socketAuth } from '../modules/auth/api/middleware.ts';
import { createAuthRouter } from '../modules/auth/api/authRoutes.ts';
import { createRouter } from './router.ts';
import proxy from '../modules/proxy/proxy.ts';
import type { CameraStore } from '../modules/cameras/application/cameraStore.ts';
import type { DeviceRepository } from '../modules/devices/infrastructure/deviceRepository.ts';
import type { StoreModelFactory } from '../shared/stores/types.ts';
import { socketDevice } from '../modules/devices/sockets/device.ts';
import { socketSerial } from '../modules/serial/sockets/serial.ts';
import { createCameraStreamManager, socketStream } from '../modules/cameras/sockets/stream.ts';

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
  cameraStore: CameraStore;
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
  cameraStore,
  auth,
  host = defaultHost,
  port = defaultPort,
}: ServerOptions) => {
  let httpServer: ReturnType<typeof createServer> | undefined;
  let ioDevice: Server | undefined;
  let ioStream: Server | undefined;
  let ioSerial: Server | undefined;
  let detachDeviceSocket: (() => void) | undefined;
  const streamManager = createCameraStreamManager({ cameraStore });

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

    const apiRouter = createRouter({ getDeviceModel, storeModel, cameraStore, streamManager });
    if (auth) {
      app.use('/api/v1/auth', createAuthRouter(auth));
      app.use('/api/v1', requireAuth(auth), apiRouter);
      app.use('/proxy', requireAuth(auth), proxy);
    } else {
      app.use('/api/v1', apiRouter);
      app.use('/proxy', proxy);
    }

    app.use('/api', (_request: Request, response: Response) => {
      response.status(404).json({ error: 'Not found' });
    });

    app.use('/proxy', (_request: Request, response: Response) => {
      response.status(404).json({ error: 'Not found' });
    });

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

    app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
      if (response.headersSent) {
        next(error);
        return;
      }

      console.error(`${request.method} ${request.originalUrl} failed:`, error);
      response.status(500).json({ error: 'Internal server error' });
    });

    detachDeviceSocket = socketDevice(ioDevice, deviceRuntime);
    socketStream(ioStream, streamManager);
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
    streamManager.stopAll();
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
