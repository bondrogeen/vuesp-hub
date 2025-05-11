import { app, BrowserWindow } from 'electron';
import express from 'express';

import path from 'node:path';
import started from 'electron-squirrel-startup';

import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { socketDevice } from '../server/socketDevice.mjs'
import { socketStream } from '../server/socketStream.mjs'
import router from '../server/routes/index.mjs'


const port = 3005

if (started) {
  app.quit();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let httpServer;

async function createExpress() {
  // const express = await import('express');
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'src/public')));

  httpServer = createServer(app);
  const ioDevice = new Server(httpServer, { path: "/ws/device/", cors: { origin: "*", methods: ["GET", "POST"] } });
  const ioStream = new Server(httpServer, { path: "/ws/stream/", cors: { origin: "*", methods: ["GET", "POST"] } });

  app.use('/api/v1', router);
  socketDevice(ioDevice);
  socketStream(ioStream);


  httpServer.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}

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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.whenReady().then(() => {
  createExpress();
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    httpServer.close();
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

