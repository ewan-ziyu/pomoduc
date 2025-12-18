const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
    setMiniMode: (isMini) => ipcRenderer.send('set-mini-mode', isMini),
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
});
