import { app, BrowserWindow, dialog } from 'electron';
import Store from 'electron-store';
import started from 'electron-squirrel-startup';
import path from 'node:path';

import { createHub } from '../server/host.ts';
import { createAuthService } from '../server/auth/authService.ts';
import { closeDeviceModel, getDeviceModel, storeModel } from '../server/models/index.ts';

if (started) {
  app.quit();
}

const appPath = app.getAppPath();
const workerScriptPath = path.join(
  app.isPackaged ? `${appPath}.unpacked` : appPath,
  '.vite',
  'build',
  'worker-script.cjs',
);

const hub = createHub({
  staticDirectory: path.join(appPath, 'public'),
  getDeviceModel,
  closeDeviceModel,
  storeModel,
  serialSettingsStore: new Store<Record<string, unknown>>(),
  workerScriptPath,
  auth: createAuthService({ dataDirectory: app.getPath('userData') }),
  host: process.env.VUESP_HOST || undefined,
  port: process.env.VUESP_PORT ? Number(process.env.VUESP_PORT) : undefined,
});

let mainWindow;
let shutdownPromise: Promise<void> | undefined;
let allowQuit = false;
let isQuitting = false;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(appPath, 'favicon.ico'),
    webPreferences: {
      preload: path.join(appPath, '.vite', 'build', 'preload.cjs'),
    },
  });

  mainWindow.menuBarVisible = false

  console.log(MAIN_WINDOW_VITE_DEV_SERVER_URL);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(appPath, '.vite', 'renderer', MAIN_WINDOW_VITE_NAME, 'index.html'));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

const startupPromise = app.whenReady().then(async () => {
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
    await startupPromise.catch(() => undefined);
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
