const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
    setOpacity: (opacity) => ipcRenderer.send('set-opacity', opacity),
    setMiniMode: (isMini) => ipcRenderer.send('set-mini-mode', isMini),
    setMiniExpand: (expanded) => ipcRenderer.send('set-mini-expand', expanded),
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),

    // Database
    db: {
        getHistory: () => ipcRenderer.invoke('db-get-history'),
        addHistory: (record) => ipcRenderer.invoke('db-add-history', record),
        updateHistory: (id, updates) => ipcRenderer.invoke('db-update-history', id, updates),
        deleteHistory: (id) => ipcRenderer.invoke('db-delete-history', id),

        getTasks: () => ipcRenderer.invoke('db-get-tasks'),
        setTasks: (tasks) => ipcRenderer.invoke('db-set-tasks', tasks),

        getSettings: () => ipcRenderer.invoke('db-get-settings'),
        setSettings: (settings) => ipcRenderer.invoke('db-set-settings', settings),

        getStats: (date) => ipcRenderer.invoke('db-get-stats', date),
        updateStats: (stats) => ipcRenderer.invoke('db-update-stats', stats),

        bulkMigrate: (data) => ipcRenderer.invoke('db-bulk-migrate', data)
    }
});
