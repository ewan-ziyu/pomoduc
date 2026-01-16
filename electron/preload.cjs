const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
    setOpacity: (opacity) => ipcRenderer.send('set-opacity', opacity),
    setMiniMode: (isMini) => ipcRenderer.send('set-mini-mode', isMini),
    setMiniExpand: (expanded) => ipcRenderer.send('set-mini-expand', expanded),
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
});
