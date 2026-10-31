import { app, BrowserWindow, dialog } from 'electron';
import Store from 'electron-store';
import started from 'electron-squirrel-startup';
import path from 'node:path';

import { server } from '../server/server.ts';
import { closeDeviceModel, getDeviceModel, storeModel } from '../server/models/index.ts';
import Core from '../core/core.ts';

if (started) {
  app.quit();
}

const appPath = app.getAppPath();
const { createExpress, closeExpress } = server({
  staticDirectory: path.join(appPath, 'public'),
  getDeviceModel,
  closeDeviceModel,
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


app.whenReady().then(async () => {
  await createExpress();
  await core.init();

  createWindow();


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(error => {
  console.error('Application startup failed:', error);
  dialog.showErrorBox('Vuesp could not start', error instanceof Error ? error.message : String(error));
  app.quit();
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await core.shutdown();
    await closeExpress()
    app.quit();
  }
});
