const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    onNetworkStatusChange: (callback) => ipcRenderer.on('network-status', callback)
});
