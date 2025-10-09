import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

import Store from 'electron-store';
import wifi from 'node-wifi';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

wifi.init({ iface: null });

const store = new Store();
let mainWindow;


function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
    },
  });

  const isDev = false;

  const startURL = isDev
    ? 'http://localhost:3001'
    : `file://${path.join(__dirname, './build/index.html')}`;

  // mainWindow.webContents.openDevTools();
  mainWindow.loadURL(startURL);


  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val);
});
ipcMain.on('electron-store-get-all', (event) => {
  event.returnValue = store.store;
});
ipcMain.on('electron-store-set-all', (event, newStore) => {
  store.store = newStore;
});

ipcMain.handle('get-current-wifi', async () => {
  const connections = await wifi.getCurrentConnections();
  return connections;
});
ipcMain.handle('connect-to-wifi', async (event, opts) => {
  await wifi.scan();
  await wifi.connect({ ssid: opts.ssid, password: opts.password });
});
ipcMain.handle('get-wifi-quality', async () => {
  const connections = await wifi.getCurrentConnections();
  if (connections.length === 0) return 0;
  return connections[0].quality;
});