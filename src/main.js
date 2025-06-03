import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import path from 'node:path';

import { fileURLToPath } from 'url';

import { server } from '../server/server.mjs'
const { createExpress, closeExpress } = server()

if (started) {
  app.quit();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 'max',
    height: 'max',
    icon: path.join(__dirname, "..", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.menuBarVisible = false

  console.log(MAIN_WINDOW_VITE_DEV_SERVER_URL);

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // mainWindow.loadURL(`http://localhost:${port}`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};


app.whenReady().then(() => {
  createExpress();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeExpress()
    app.quit();
  }
});


