import { app, BrowserWindow, dialog } from 'electron';
import Store from 'electron-store';
import started from 'electron-squirrel-startup';
import path from 'node:path';

import { server } from '../server/server.ts';
import { closeDeviceModel, getDeviceModel, storeModel } from '../server/models/index.ts';
import Core from '../core/core.ts';
import { DeviceRuntime } from '../core/application/deviceRuntime.ts';
import { VuespDevices } from '../server/devices/vuespDevices.ts';
import type { DeviceConnectionRecord } from '../shared/device.ts';

if (started) {
  app.quit();
}

const appPath = app.getAppPath();
const deviceRuntime = new DeviceRuntime<DeviceConnectionRecord>({
  loadDevices: async () => (await getDeviceModel()).getAll({ includeCredentials: true }),
  createConnections: devices => new VuespDevices(devices),
});
const { createExpress, closeExpress } = server({
  staticDirectory: path.join(appPath, 'public'),
  deviceRuntime,
  getDeviceModel,
  storeModel,
  serialSettingsStore: new Store<Record<string, unknown>>(),
});
const core = new Core({
  workerScriptPath: path.join(
    app.isPackaged ? `${appPath}.unpacked` : appPath,
    '.vite',
    'build',
    'worker-script.cjs',
  ),
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

  // mainWindow.loadURL(`http://localhost:${port}`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};


const startupPromise = app.whenReady().then(async () => {
  await deviceRuntime.start();
  if (isQuitting) return;
  await createExpress();
  if (isQuitting) return;
  await core.init();
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

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', event => {
  if (allowQuit) return;
  event.preventDefault();
  isQuitting = true;
  shutdownPromise ??= (async () => {
    const errors: unknown[] = [];
    await startupPromise.catch(() => undefined);
    for (const shutdown of [
      closeExpress,
      () => core.shutdown(),
      () => deviceRuntime.stop(),
      closeDeviceModel,
    ]) {
      try {
        await shutdown();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length) throw new AggregateError(errors, 'One or more application services failed to shut down');
  })();

  void shutdownPromise.then(
    () => {
      allowQuit = true;
      app.quit();
    },
    error => {
      console.error('Application shutdown failed:', error);
      dialog.showErrorBox('Vuesp shutdown failed', error instanceof Error ? error.message : String(error));
      allowQuit = true;
      app.quit();
    },
  );
});
