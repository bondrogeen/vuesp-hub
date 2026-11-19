import dgram from 'node:dgram';
import path from 'node:path';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import type { DeviceRuntime } from '@core/application/deviceRuntime.ts';
import type Core from '@core/core.ts';
import type { ObjectRegistry } from '@core/application/objectRegistry.ts';
import type { ActionService } from '@core/application/actionService.ts';
import type { IHistoryStore } from '@core/application/historyStore.ts';
import type { AutomationEngine } from '@server/modules/automations/application/automationEngine.ts';
import type { ScriptRuntime } from '@core/application/scriptRuntime.ts';
import type { BackupService } from '@server/modules/backup/application/backupService.ts';
import { applySecurityHeaders } from '@server/shared/security/securityHeaders.ts';
import type { AuditLog } from '@server/modules/audit/application/auditLog.ts';
import type { UpdateManager } from '@server/modules/update/application/updateManager.ts';
import type { IAuthService } from '@server/modules/auth/application/authService.ts';
import { requireAuth, requirePasswordChanged, requireSameOrigin, socketAuth } from '@server/modules/auth/api/middleware.ts';
import { createAuthRouter } from '@server/modules/auth/api/authRoutes.ts';
import { createModuleProxyRouter } from '@server/modules/modules/api/moduleProxyRoutes.ts';
import { MODULE_FRAME_CSP, MODULE_FRAME_HTML, MODULE_FRAME_PATH } from '@server/module-host/frame.ts';
import { createRouter } from './router.ts';
import type { ICloudService } from '@server/modules/cloud/application/cloudService.ts';
import proxy from '@server/modules/proxy/proxy.ts';
import type { IDeviceRepository } from '@server/modules/devices/infrastructure/deviceRepository.ts';
import type { TStoreModelFactory } from '@shared/stores/types.ts';
import type { IAccessRepository } from '@server/modules/access/infrastructure/jsonAccessRepository.ts';
import { createAccessRouter } from '@server/modules/access/api/accessRoutes.ts';
import { socketDevice } from '@server/modules/devices/sockets/device.ts';
import { socketSerial } from '@server/modules/serial/sockets/serial.ts';
import { createMobileRouter } from '@server/modules/mobile/api/mobileRoutes.ts';
import type { TModuleHost } from '@server/module-host/moduleHost.ts';
import type { TModuleCatalog } from '@server/modules/modules/application/moduleCatalog.ts';
import { createModuleRouter } from '@server/modules/modules/api/moduleRoutes.ts';

const defaultPort = 3005;
const defaultHost = '127.0.0.1';

interface ISettingsStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set(key: string, value: unknown): void;
}

interface ServerOptions {
  staticDirectory?: string;
  deviceRuntime: DeviceRuntime<unknown>;
  getDeviceModel: () => Promise<IDeviceRepository>;
  storeModel: TStoreModelFactory;
  serialSettingsStore: ISettingsStore;
  auth?: IAuthService;
  access?: IAccessRepository;
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
  access,
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
  host = defaultHost,
  port = defaultPort,
}: ServerOptions) => {
  let httpServer: ReturnType<typeof createServer> | undefined;
  let ioDevice: Server | undefined;
  let ioSerial: Server | undefined;
  let detachDeviceSocket: (() => void) | undefined;
  let beaconSocket: ReturnType<typeof dgram.createSocket> | undefined;
  let beaconTimer: ReturnType<typeof setInterval> | undefined;

  const createExpress = async () => {
    await getDeviceModel();
    const app = express();

    app.use((_request, response, next) => {
      applySecurityHeaders((name, value) => response.setHeader(name, value));
      next();
    });
    app.use(express.json());
    if (moduleHost) {
      app.get(MODULE_FRAME_PATH, (_request: Request, response: Response) => {
        response.setHeader('Content-Security-Policy', MODULE_FRAME_CSP);
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.send(MODULE_FRAME_HTML);
      });
    }

    app.get('/healthz', (_request: Request, response: Response) => {
      response.json({ status: core?.getHealth().status ?? 'unknown' });
    });
    if (staticDirectory) app.use(express.static(staticDirectory));

    if (moduleHost) {
      // Module UI bundles are static ESM entries served from the installed
      // package. Public routes use /modules/<group>/<slug>/web/* and never
      // expose the module's server or data directories.
      app.use('/modules', async (request: Request, response: Response, next: NextFunction) => {
        const resolved = await moduleHost.resolve(`/modules${request.path}`);
        if (!resolved) return next();
        // Module UI runs in an opaque-origin iframe; its ES modules and assets
        // are public code, so cross-origin loading is allowed.
        response.setHeader('Access-Control-Allow-Origin', '*');

        const { info, relative } = resolved;
        const web = info.manifest.web;
        const entry = typeof web === 'string' ? web : web?.entry;
        if (!entry) return next();

        const webRoot = path.dirname(entry);
        const innerPath = path.posix.normalize(decodeURIComponent(relative).replace(/^\/+/, ''));
        if (!innerPath.startsWith(`${webRoot}/`)) return next();

        const filePath = path.resolve(info.directory, innerPath);
        const allowedRoot = path.resolve(info.directory, webRoot);
        if (!filePath.startsWith(`${allowedRoot}${path.sep}`)) {
          response.status(403).json({ error: 'Forbidden' });
          return;
        }
        const relativeToWeb = innerPath.slice(webRoot.length + 1);
        response.sendFile(relativeToWeb, { root: allowedRoot }, error => {
          if (error && !response.headersSent) response.status(404).end();
        });
      });
    }

    httpServer = createServer(app);
    // Cross-origin WebSocket upgrades are not used by the hub itself.
    const socketOptions = { cors: { origin: '*', methods: ['GET', 'POST'] }, destroyUpgrade: !moduleHost };
    ioDevice = new Server(httpServer, { path: '/ws/device/', ...socketOptions });
    ioSerial = new Server(httpServer, { path: '/ws/serial/', ...socketOptions });

    if (auth) {
      ioDevice.use(socketAuth(auth));
      ioSerial.use(socketAuth(auth));
    }

    if (moduleHost) {
      httpServer.on('upgrade', (request, socket, head) => {
        const url = request.url ?? '/';
        const pathname = url.split('?')[0] ?? '/';
        if (!pathname.startsWith('/modules/')) {
          // Socket.IO handles its own paths; anything else is not a valid
          // upgrade and must not keep a socket open.
          if (!pathname.startsWith('/ws/device/') && !pathname.startsWith('/ws/serial/')) socket.destroy();
          return;
        }

        void moduleHost.resolve(pathname).then(resolved => {
          if (!resolved) {
            socket.destroy();
            return;
          }
          moduleHost.upgrade(resolved.info.manifest.id, request, socket, head, resolved.base);
        }).catch(error => {
          console.error('Module upgrade failed:', error);
          socket.destroy();
        });
      });
    }

    if (moduleHost) {
      // Backward-compatible API alias while Alisa/Smart Home move to the Yandex module.
      app.use('/api/v1/alisa/music/stream', (request, response) => {
        moduleHost.proxy('vuesp-hub.yandex', request, response, '/api/v1');
      });
      const alisaAlias = (request: Request, response: Response): void => {
        const user = (request as Request & { auth?: { id?: number; username?: string; role?: string } }).auth;
        if (user?.id !== undefined) request.headers['x-vuesp-user-id'] = String(user.id);
        if (user?.username) request.headers['x-vuesp-username'] = user.username;
        if (user?.role) request.headers['x-vuesp-role'] = user.role;
        moduleHost.proxy('vuesp-hub.yandex', request, response, '/api/v1');
      };
      app.use(
        '/api/v1/alisa',
        ...(auth ? [requireAuth(auth), requirePasswordChanged] : []),
        alisaAlias
      );
    }

    const apiRouter = createRouter({ getDeviceModel, storeModel, auth, cloud, moduleHost, moduleCatalog, core, objects, actions, history, automation, scripts, backup, audit, update });
    // Mobile LAN access has its own long-lived token and must be mounted
    // before the admin-session middleware for /api/v1.
    if (cloud) app.use('/api/v1/mobile', createMobileRouter(cloud));
    // Module UI proxy runs before the hub session check: module pages use a
    // short-lived token scoped to their own module id.
    if (moduleHost) app.use('/api/v1/modules', createModuleProxyRouter({ moduleHost, auth }));
    if (auth) {
      app.use('/api/v1/auth', createAuthRouter(auth));
      if (access) app.use('/api/v1/access', requireAuth(auth), requirePasswordChanged, createAccessRouter(access, auth));
      app.use('/api/v1', requireSameOrigin, requireAuth(auth), requirePasswordChanged, apiRouter);
      app.use('/proxy', requireSameOrigin, requireAuth(auth), requirePasswordChanged, proxy);
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

    detachDeviceSocket = socketDevice(ioDevice, deviceRuntime, objects);
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

    if (cloud) {
      const socket = dgram.createSocket('udp4');
      beaconSocket = socket;
      socket.on('error', error => {
        console.warn(`IHub beacon stopped: ${error.message}`);
      });
      socket.bind(() => {
        try {
          socket.setBroadcast(true);
        } catch {
          // Some platforms disallow UDP broadcast; the app then falls back to cloud.
        }
        const announce = () => {
          const status = cloud.status();
          if (!status.hubId) return;
          const payload = Buffer.from(
            JSON.stringify({
              type: 'vuesp-hub',
              hubId: status.hubId,
              name: status.name,
              port,
              version: 1,
            })
          );
          socket.send(payload, 12346, '255.255.255.255', () => {
            // Discovery is best-effort.
          });
        };
        announce();
        beaconTimer = setInterval(announce, 5000);
        beaconTimer.unref?.();
      });
    }
  };

  const closeSocketServer = (io?: Server) =>
    new Promise<void>(resolve => {
      if (!io) return resolve();
      io.disconnectSockets(true);
      io.close(() => resolve());
    });

  const closeExpress = async () => {
    if (beaconTimer) clearInterval(beaconTimer);
    beaconTimer = undefined;
    if (beaconSocket) {
      try {
        beaconSocket.close();
      } catch {
        // Ignore a socket that is already closed.
      }
    }
    beaconSocket = undefined;
    detachDeviceSocket?.();
    detachDeviceSocket = undefined;

    await Promise.all([closeSocketServer(ioDevice), closeSocketServer(ioSerial)]);
    ioDevice = undefined;
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
