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
        transparent: false,
        resizable: true,
        hasShadow: true,
        alwaysOnTop: false,
        icon: path.join(__dirname, '../public/icon.png')
    });

    // Load dev server or build
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
    mainWindow.loadURL(startUrl);

    ipcMain.on('resize-window', (event, { width, height }) => {
        mainWindow.setSize(width, height);
    });

    ipcMain.on('set-mini-mode', (event, isMini) => {
        if (isMini) {
            mainWindow.setSize(260, 50); // Slimmer bar shape
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
        } else {
            const width = 500;
            const height = 720;

            // Get current position to keep it roughly where the user left it
            let { x, y } = mainWindow.getBounds();

            // Get the screen where the window currently is
            const display = screen.getDisplayMatching({ x, y, width: 260, height: 50 });
            const { x: bx, y: by, width: bw, height: bh } = display.workArea;

            // Adjust X if it goes off the right edge
            if (x + width > bx + bw) {
                x = bx + bw - width;
            }
            // Adjust X if it goes off the left edge (unlikely but safe)
            if (x < bx) {
                x = bx;
            }

            // Adjust Y if it goes off the bottom edge
            if (y + height > by + bh) {
                y = by + bh - height;
            }
            // Adjust Y if it goes off the top edge
            if (y < by) {
                y = by;
            }

            // Apply safe bounds
            mainWindow.setBounds({ x, y, width, height });
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
