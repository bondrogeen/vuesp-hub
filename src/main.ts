import { app, BrowserWindow, dialog, session, shell } from 'electron';
import Store from 'electron-store';
import started from 'electron-squirrel-startup';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createCameraStore } from '@server/modules/cameras/application/cameraStore.ts';
import { createHub } from '@server/app/host.ts';
import { createAuthService } from '@server/modules/auth/application/authService.ts';
import { createJsonAccessRepository } from '@server/modules/access/infrastructure/jsonAccessRepository.ts';
import { closeDeviceModel, getDeviceModel, secretProvider } from './adapters/deviceModel.ts';
import storeModel from './adapters/storeModel.ts';

const appPath = app.getAppPath();
const workerScriptPath = path.join(
  app.isPackaged ? `${appPath}.unpacked` : appPath,
  '.vite',
  'build',
  'worker-script.cjs',
);

const dataDirectory = app.getPath('userData');
const cloudUrl = process.env.VUESP_CLOUD_URL?.trim();
const cloudToken = process.env.VUESP_CLOUD_TOKEN?.trim();

let mainWindow: BrowserWindow | undefined;
let startupPromise: Promise<void> | undefined;
let shutdownPromise: Promise<void> | undefined;
let allowQuit = false;
let isQuitting = false;

const isSafeExternalUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const isAllowedNavigation = (value: string): boolean => {
  try {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      return new URL(value).origin === new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).origin;
    }

    const target = new URL(value);
    if (target.protocol !== 'file:') return false;

    const rendererRoot = path.join(appPath, '.vite', 'renderer');
    return fileURLToPath(target).startsWith(rendererRoot);
  } catch {
    return false;
  }
};

const registerSecurityHandlers = (): void => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      if (isSafeExternalUrl(url)) void shell.openExternal(url);
      return { action: 'deny' };
    });

    contents.on('will-navigate', (event, navigationUrl) => {
      if (!isAllowedNavigation(navigationUrl)) event.preventDefault();
    });
  });
};

const createWindow = (): void => {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(appPath, 'favicon.ico'),
    webPreferences: {
      preload: path.join(appPath, '.vite', 'build', 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow = window;
  window.menuBarVisible = false;
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined;
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(path.join(appPath, '.vite', 'renderer', MAIN_WINDOW_VITE_NAME, 'index.html'));
  }

  if (!app.isPackaged) {
    window.webContents.openDevTools();
  }
};

const start = (): void => {
  const hub = createHub({
    staticDirectory: path.join(appPath, 'public'),
    getDeviceModel,
    closeDeviceModel,
    storeModel,
    serialSettingsStore: new Store<Record<string, unknown>>(),
    cameraStore: createCameraStore({ dataDirectory }),
    workerScriptPath,
    auth: createAuthService({ dataDirectory }),
    access: createJsonAccessRepository({ dataDirectory }),
    dataDirectory,
    secretProvider,
    telemetry: cloudUrl && cloudToken
      ? { url: cloudUrl, token: cloudToken, hubName: process.env.VUESP_CLOUD_HUB_NAME?.trim() || undefined, dataDirectory }
      : undefined,
    host: process.env.VUESP_HOST || undefined,
    port: process.env.VUESP_PORT ? Number(process.env.VUESP_PORT) : undefined,
  });

  startupPromise = app.whenReady().then(async () => {
    registerSecurityHandlers();
    await hub.start();
    if (isQuitting) return;

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  void startupPromise.catch(error => {
    console.error('Application startup failed:', error);
    if (!isQuitting) {
      dialog.showErrorBox('Vuesp could not start', error instanceof Error ? error.message : String(error));
    }
    app.quit();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', event => {
    if (allowQuit) return;
    event.preventDefault();
    isQuitting = true;

    shutdownPromise ??= (async () => {
      if (startupPromise) await startupPromise.catch(() => undefined);
      await Promise.race([
        hub.stop(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Hub shutdown timed out')), 5000)),
      ]);
    })();

    void shutdownPromise.then(
      () => {
        allowQuit = true;
        app.quit();
      },
      error => {
        // Never trap the user in an unclosable window: force exit even if a
        // device socket or worker did not shut down cleanly.
        console.error('Application shutdown failed:', error);
        allowQuit = true;
        app.exit(0);
      },
    );
  });
};

if (started) {
  app.quit();
} else if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  start();
}
