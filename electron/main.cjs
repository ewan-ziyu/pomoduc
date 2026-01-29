const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

// Database Setup
const dbPath = path.join(app.getPath('userData'), 'pomoduc.db');
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT
  );
  
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    name TEXT,
    color TEXT
  );
  
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY,
    startTime TEXT,
    endTime TEXT,
    duration INTEGER,
    taskId INTEGER,
    taskName TEXT
  );
  
  CREATE TABLE IF NOT EXISTS stats (
    date TEXT PRIMARY KEY,
    totalPomodoros INTEGER,
    totalMinutes INTEGER,
    byTask TEXT
  );
`);

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
    const isDev = process.env.NODE_ENV === 'development';
    const startUrl = isDev
        ? (process.env.ELECTRON_START_URL || 'http://localhost:5177')
        : `file://${path.join(__dirname, '../dist/index.html')}`;
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

    // --- Database IPC Handlers ---

    // History
    ipcMain.handle('db-get-history', () => {
        return db.prepare('SELECT * FROM history ORDER BY id DESC').all();
    });

    ipcMain.handle('db-add-history', (event, record) => {
        const { id, startTime, endTime, duration, taskId, taskName } = record;
        const stmt = db.prepare('INSERT INTO history (id, startTime, endTime, duration, taskId, taskName) VALUES (?, ?, ?, ?, ?, ?)');
        return stmt.run(id, startTime, endTime, duration, taskId, taskName);
    });

    ipcMain.handle('db-update-history', (event, id, updates) => {
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE history SET ${fields} WHERE id = ?`);
        return stmt.run(...values, id);
    });

    ipcMain.handle('db-delete-history', (event, id) => {
        return db.prepare('DELETE FROM history WHERE id = ?').run(id);
    });

    // Tasks
    ipcMain.handle('db-get-tasks', () => {
        return db.prepare('SELECT * FROM tasks').all();
    });

    ipcMain.handle('db-set-tasks', (event, tasks) => {
        const deleteStmt = db.prepare('DELETE FROM tasks');
        const insertStmt = db.prepare('INSERT INTO tasks (id, name, color) VALUES (?, ?, ?)');
        const transaction = db.transaction((taskList) => {
            deleteStmt.run();
            for (const task of taskList) {
                insertStmt.run(task.id, task.name, task.color);
            }
        });
        return transaction(tasks);
    });

    // Settings
    ipcMain.handle('db-get-settings', () => {
        const row = db.prepare('SELECT data FROM settings WHERE id = 1').get();
        return row ? JSON.parse(row.data) : null;
    });

    ipcMain.handle('db-set-settings', (event, settings) => {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)');
        return stmt.run(JSON.stringify(settings));
    });

    // Stats
    ipcMain.handle('db-get-stats', (event, date) => {
        const row = db.prepare('SELECT * FROM stats WHERE date = ?').get();
        if (row) {
            return {
                ...row,
                byTask: JSON.parse(row.byTask)
            };
        }
        return null;
    });

    ipcMain.handle('db-update-stats', (event, stats) => {
        const stmt = db.prepare('INSERT OR REPLACE INTO stats (date, totalPomodoros, totalMinutes, byTask) VALUES (?, ?, ?, ?)');
        return stmt.run(stats.date, stats.totalPomodoros, stats.totalMinutes, JSON.stringify(stats.byTask));
    });

    // Bulk Migration Helper
    ipcMain.handle('db-bulk-migrate', (event, data) => {
        const { history, tasks, settings, stats } = data;
        const transaction = db.transaction(() => {
            // Settings
            if (settings) {
                db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(settings));
            }
            // Tasks
            if (tasks) {
                db.prepare('DELETE FROM tasks').run();
                const taskStmt = db.prepare('INSERT INTO tasks (id, name, color) VALUES (?, ?, ?)');
                for (const t of tasks) taskStmt.run(t.id, t.name, t.color);
            }
            // History
            if (history) {
                db.prepare('DELETE FROM history').run();
                const histStmt = db.prepare('INSERT INTO history (id, startTime, endTime, duration, taskId, taskName) VALUES (?, ?, ?, ?, ?, ?)');
                for (const r of history) histStmt.run(r.id, r.startTime, r.endTime, r.duration, r.taskId, r.taskName);
            }
            // Stats (legacy/daily)
            if (stats) {
                db.prepare('INSERT OR REPLACE INTO stats (date, totalPomodoros, totalMinutes, byTask) VALUES (?, ?, ?, ?)')
                    .run(stats.date, stats.totalPomodoros, stats.totalMinutes, JSON.stringify(stats.byTask));
            }
        });
        return transaction();
    });
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
