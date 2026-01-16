const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: 500,  // Increased width
        height: 720, // Increased height to prevent cutoff
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        frame: false, // Frameless for custom UI
        transparent: true, // Enable transparency for shaped windows
        resizable: true,
        hasShadow: true,
        alwaysOnTop: false,
        icon: path.join(__dirname, '../public/icon.png')
    });

    // Load dev server or build
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
    mainWindow.loadURL(startUrl);

    ipcMain.on('set-opacity', (event, opacity) => {
        mainWindow.setOpacity(opacity);
    });

    ipcMain.on('resize-window', (event, { width, height }) => {
        mainWindow.setSize(width, height);
    });

    // Handler for improved mini-mode expansion
    ipcMain.on('set-mini-expand', (event, expanded) => {
        const { x, y, width, height } = mainWindow.getBounds();
        const collapsedHeight = 50;
        const expandedHeight = 200; // Enough space for slider

        if (expanded) {
            // Expand upwards: New Y = Current Y - (TargetHeight - CurrentHeight)
            // But we must be careful. If we are already expanded, don't change.
            if (height < expandedHeight) {
                const newY = y - (expandedHeight - height);
                mainWindow.setBounds({ x, y: newY, width, height: expandedHeight });
            }
        } else {
            // Collapse downwards: New Y = Current Y + (CurrentHeight - TargetHeight)
            if (height > collapsedHeight) {
                const newY = y + (height - collapsedHeight);
                mainWindow.setBounds({ x, y: newY, width, height: collapsedHeight });
            }
        }
    });

    ipcMain.on('set-mini-mode', (event, isMini) => {
        if (isMini) {
            const { x, y, width, height } = mainWindow.getBounds();
            const miniWidth = 260;
            const miniHeight = 50;

            // Calculate new position: Bottom-Left alignment
            let newX = x;
            let newY = y + height - miniHeight;

            // Ensure it stays within screen bounds
            const display = screen.getDisplayMatching({ x, y, width, height });
            const { x: bx, y: by, width: bw, height: bh } = display.workArea;

            // Clamp X
            if (newX < bx) newX = bx;
            if (newX + miniWidth > bx + bw) newX = bx + bw - miniWidth;

            // Clamp Y
            if (newY < by) newY = by;
            if (newY + miniHeight > by + bh) newY = by + bh - miniHeight;

            mainWindow.setBounds({ x: newX, y: newY, width: miniWidth, height: miniHeight });
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
        } else {
            const width = 500;
            const height = 720;

            // Get current mini window position
            const { x, y, width: miniWidth, height: miniHeight } = mainWindow.getBounds();

            // Calculate new position: Bottom-Left alignment
            // Main window's bottom-left should match Mini window's bottom-left
            // newX = x
            // newY + height = y + miniHeight => newY = y + miniHeight - height
            let newX = x;
            let newY = y + miniHeight - height;

            // Ensure it stays within screen bounds
            const display = screen.getDisplayMatching({ x, y, width: miniWidth, height: miniHeight });
            const { x: bx, y: by, width: bw, height: bh } = display.workArea;

            // Clamp X
            if (newX < bx) newX = bx;
            if (newX + width > bx + bw) newX = bx + bw - width;

            // Clamp Y
            if (newY < by) newY = by;
            if (newY + height > by + bh) newY = by + bh - height;

            mainWindow.setBounds({ x: newX, y: newY, width, height });
            mainWindow.setAlwaysOnTop(false);
        }
    });

    // Window Controls
    ipcMain.on('minimize-window', () => mainWindow.minimize());
    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) mainWindow.unmaximize();
        else mainWindow.maximize();
    });
    ipcMain.on('close-window', () => mainWindow.close());
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
