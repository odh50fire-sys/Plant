const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clearCacheAndReload: () => ipcRenderer.send('app:clear-cache-reload'),
  isElectron: true
});
