const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  store: {
    get(key) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property, val) {
      ipcRenderer.send('electron-store-set', property, val);
    },
    getAll() {
      return ipcRenderer.sendSync('electron-store-get-all');
    },
    setAll(newStore) {
      ipcRenderer.send('electron-store-set-all', newStore);
    }
    // Other method you want to add like has(), reset(), etc.
  },
  getCurrentWifi: () => ipcRenderer.invoke('get-current-wifi'),
  connectToWifi: (opts) => ipcRenderer.invoke('connect-to-wifi', opts),
});