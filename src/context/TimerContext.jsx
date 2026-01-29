import React, { createContext, useState, useEffect, useContext, useRef } from 'react';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

const DEFAULT_SETTINGS = {
    focusDuration: 25,
    breakDuration: 4,
    dayStart: "00:00",
    dayEnd: "23:59"
};

export const TimerProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);

    // Settings
    const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);

    // Tasks
    const [tasks, setTasksState] = useState([{ id: 1, name: 'General', color: '#ff6b6b' }]);
    const [activeTaskId, setActiveTaskId] = useState(1);

    // Stats
    const [stats, setStatsState] = useState({
        date: new Date().toLocaleDateString(),
        totalPomodoros: 0,
        totalMinutes: 0,
        byTask: {}
    });

    // History
    const [history, setHistoryState] = useState([]);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.focusDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // 'focus' | 'break'
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const timerRef = useRef(null);

    // Helper to get the "business date"
    const getBusinessDate = (startStr) => {
        if (!startStr) return new Date().toLocaleDateString();
        const now = new Date();
        const [h, m] = startStr.split(':').map(Number);
        const splitTime = new Date(now);
        splitTime.setHours(h, m || 0, 0, 0);

        if (now < splitTime) {
            const prevDay = new Date(now);
            prevDay.setDate(prevDay.getDate() - 1);
            return prevDay.toLocaleDateString();
        }
        return now.toLocaleDateString();
    };

    // Initialize DB and Migration
    useEffect(() => {
        const initData = async () => {
            try {
                if (!window.electron || !window.electron.db) {
                    console.warn('Electron DB not found, falling back to defaults (likely dev browser)');
                    setLoading(false);
                    return;
                }

                let dbSettings = await window.electron.db.getSettings();
                const hasLocalStorage = localStorage.getItem('pomoduc_settings') || localStorage.getItem('pomoduc_history');

                // Migration logic
                if (!dbSettings && hasLocalStorage) {
                    console.log('Migrating localStorage to SQLite...');
                    const legacyHistory = JSON.parse(localStorage.getItem('pomoduc_history') || '[]');
                    const legacyTasks = JSON.parse(localStorage.getItem('pomoduc_tasks') || '[]');
                    const legacySettings = JSON.parse(localStorage.getItem('pomoduc_settings') || 'null');
                    const legacyStats = JSON.parse(localStorage.getItem('pomoduc_stats') || 'null');

                    await window.electron.db.bulkMigrate({
                        history: legacyHistory,
                        tasks: legacyTasks,
                        settings: legacySettings,
                        stats: legacyStats
                    });

                    dbSettings = await window.electron.db.getSettings();

                    // Clear legacy data
                    localStorage.removeItem('pomoduc_settings');
                    localStorage.removeItem('pomoduc_tasks');
                    localStorage.removeItem('pomoduc_history');
                    localStorage.removeItem('pomoduc_stats');
                    localStorage.removeItem('pomoduc_active_task');
                }

                if (dbSettings) setSettingsState({ ...DEFAULT_SETTINGS, ...dbSettings });

                const dbTasks = await window.electron.db.getTasks();
                if (dbTasks && dbTasks.length > 0) setTasksState(dbTasks);

                const dbHistory = await window.electron.db.getHistory();
                if (dbHistory) setHistoryState(dbHistory);

                const currentBusinessDate = getBusinessDate(dbSettings?.dayStart || DEFAULT_SETTINGS.dayStart);
                const dbStats = await window.electron.db.getStats(currentBusinessDate);
                if (dbStats) {
                    setStatsState(dbStats);
                } else {
                    setStatsState({
                        date: currentBusinessDate,
                        totalPomodoros: 0,
                        totalMinutes: 0,
                        byTask: {}
                    });
                }

                // Active Task (kept in localStorage for simplicity as it's session-local, or we could move to DB)
                const savedActiveId = localStorage.getItem('pomoduc_active_task');
                if (savedActiveId) setActiveTaskId(JSON.parse(savedActiveId));

                // Initial Timer Sync
                const finalFocus = dbSettings?.focusDuration || DEFAULT_SETTINGS.focusDuration;
                setTimeLeft(finalFocus * 60);

            } catch (err) {
                console.error('Failed to initialize database:', err);
            } finally {
                setLoading(false);
            }
        };

        initData();
    }, []);

    // Sync activeTaskId to localStorage (UI session state)
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('pomoduc_active_task', JSON.stringify(activeTaskId));
        }
    }, [activeTaskId, loading]);

    // Sync methods (Wrappers to update DB and State)
    const setSettings = async (newSettings) => {
        setSettingsState(newSettings);
        if (window.electron?.db) await window.electron.db.setSettings(newSettings);
    };

    const setTasks = async (newTasks) => {
        setTasksState(newTasks);
        if (window.electron?.db) await window.electron.db.setTasks(newTasks);
    };

    const setStats = async (newStats) => {
        if (typeof newStats === 'function') {
            setStatsState(prev => {
                const next = newStats(prev);
                if (window.electron?.db) window.electron.db.updateStats(next);
                return next;
            });
        } else {
            setStatsState(newStats);
            if (window.electron?.db) await window.electron.db.updateStats(newStats);
        }
    };

    // Reset timer when settings change (if not active)
    useEffect(() => {
        if (!isActive) {
            if (mode === 'focus') setTimeLeft(settings.focusDuration * 60);
            if (mode === 'break') setTimeLeft(settings.breakDuration * 60);
        }
    }, [settings.focusDuration, settings.breakDuration, mode]);

    // Check new day for stats
    useEffect(() => {
        const checkRollover = async () => {
            const currentBusinessDate = getBusinessDate(settings.dayStart);
            if (stats.date !== currentBusinessDate) {
                const newStats = {
                    date: currentBusinessDate,
                    totalPomodoros: 0,
                    totalMinutes: 0,
                    byTask: {}
                };
                setStatsState(newStats);
                if (window.electron?.db) await window.electron.db.updateStats(newStats);
            }
        };

        const interval = setInterval(checkRollover, 60000);
        return () => clearInterval(interval);
    }, [stats.date, settings.dayStart]);


    const toggleTimer = () => {
        if (isActive && mode === 'focus') {
            const mins = Math.floor(elapsedSeconds / 60);
            if (mins >= 10) {
                updateStats(mins);
            }
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        if (mode === 'focus') {
            const mins = Math.floor(elapsedSeconds / 60);
            if (mins >= 10) {
                updateStats(mins);
            }
        }
        setIsActive(false);
        setMode('focus');
        setTimeLeft(settings.focusDuration * 60);
        setElapsedSeconds(0);
    };

    const updateStats = async (providedDuration) => {
        // If providedDuration is passed, use it, otherwise calculate from elapsedSeconds
        // If it's a normal completion, providedDuration would be Math.floor(elapsedSeconds / 60)
        const durationToRecord = providedDuration !== undefined ? providedDuration : Math.floor(elapsedSeconds / 60);

        if (mode !== 'focus' || durationToRecord < 10) return;

        const now = new Date();
        const activeTaskObj = tasks.find(t => t.id === activeTaskId) || { name: 'Unknown' };

        const newRecord = {
            id: Date.now(),
            endTime: now.toISOString(),
            startTime: new Date(now.getTime() - durationToRecord * 60000).toISOString(),
            duration: durationToRecord,
            taskId: activeTaskId,
            taskName: activeTaskObj.name
        };

        // Update History
        setHistoryState(prev => [newRecord, ...prev]);
        if (window.electron?.db) await window.electron.db.addHistory(newRecord);

        // Update daily stats
        const nextStats = { ...stats };
        nextStats.byTask = { ...nextStats.byTask };
        nextStats.byTask[activeTaskId] = (nextStats.byTask[activeTaskId] || 0) + durationToRecord;
        nextStats.totalPomodoros += 1;
        nextStats.totalMinutes += durationToRecord;

        setStats(nextStats);
        setElapsedSeconds(prev => Math.max(0, prev - durationToRecord * 60));
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
                if (mode === 'focus') {
                    setElapsedSeconds(prev => prev + 1);
                }
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            const finalMins = Math.floor(elapsedSeconds / 60);
            updateStats(finalMins);

            const nextMode = mode === 'focus' ? 'break' : 'focus';
            setMode(nextMode);
            const nextDuration = nextMode === 'focus' ? settings.focusDuration : settings.breakDuration;
            setTimeLeft(nextDuration * 60);
            setElapsedSeconds(0);
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, activeTaskId, mode, settings, tasks, stats, elapsedSeconds]);

    const addTask = async (name, color) => {
        const newTask = { id: Date.now(), name, color };
        const newTasks = [...tasks, newTask];
        setTasks(newTasks);
    };

    const deleteTask = async (id) => {
        const newTasks = tasks.filter(t => t.id !== id);
        setTasks(newTasks);
        if (activeTaskId === id && newTasks.length > 0) {
            setActiveTaskId(newTasks[0].id);
        }
    };

    const manualAddRecord = async (record) => {
        const newRecord = {
            id: Date.now(),
            ...record
        };

        setHistoryState(prev => [newRecord, ...prev]);
        if (window.electron?.db) await window.electron.db.addHistory(newRecord);

        const recordDate = new Date(record.startTime).toLocaleDateString();
        const currentBusinessDate = getBusinessDate(settings.dayStart);

        if (recordDate === currentBusinessDate) {
            const nextStats = { ...stats };
            nextStats.byTask = { ...nextStats.byTask };
            nextStats.byTask[record.taskId] = (nextStats.byTask[record.taskId] || 0) + record.duration;
            nextStats.totalPomodoros += 1;
            nextStats.totalMinutes += record.duration;
            setStats(nextStats);
        }
    };

    const updateRecord = async (id, updates) => {
        const recordToUpdate = history.find(r => r.id === id);
        if (!recordToUpdate) return;

        const oldDuration = recordToUpdate.duration || 0;
        const newDuration = updates.duration;
        const durationDiff = newDuration - oldDuration;

        setHistoryState(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
        if (window.electron?.db) await window.electron.db.updateHistory(id, updates);

        const recordDate = new Date(recordToUpdate.startTime).toLocaleDateString();
        const currentBusinessDate = getBusinessDate(settings.dayStart);

        if (recordDate === currentBusinessDate) {
            const nextStats = { ...stats };
            nextStats.byTask = { ...nextStats.byTask };
            nextStats.byTask[recordToUpdate.taskId] = Math.max(0, (nextStats.byTask[recordToUpdate.taskId] || 0) + durationDiff);
            nextStats.totalMinutes = Math.max(0, nextStats.totalMinutes + durationDiff);
            setStats(nextStats);
        }
    };

    const deleteRecord = async (id) => {
        const recordToDelete = history.find(r => r.id === id);
        if (!recordToDelete) return;

        setHistoryState(prev => prev.filter(r => r.id !== id));
        if (window.electron?.db) await window.electron.db.deleteHistory(id);

        const recordDate = new Date(recordToDelete.startTime).toLocaleDateString();
        const currentBusinessDate = getBusinessDate(settings.dayStart);

        if (recordDate === currentBusinessDate) {
            const nextStats = { ...stats };
            nextStats.byTask = { ...nextStats.byTask };
            const duration = recordToDelete.duration || 0;

            if (nextStats.byTask[recordToDelete.taskId]) {
                nextStats.byTask[recordToDelete.taskId] = Math.max(0, nextStats.byTask[recordToDelete.taskId] - duration);
            }

            nextStats.totalPomodoros = Math.max(0, nextStats.totalPomodoros - 1);
            nextStats.totalMinutes = Math.max(0, nextStats.totalMinutes - duration);
            setStats(nextStats);
        }
    };

    const getActiveTask = () => tasks.find(t => t.id === activeTaskId) || tasks[0];

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a1a1a',
                color: '#fff',
                fontFamily: 'Inter, sans-serif'
            }}>
                Loading Database...
            </div>
        );
    }

    return (
        <TimerContext.Provider value={{
            settings, setSettings,
            tasks, addTask, deleteTask,
            activeTaskId, setActiveTaskId, getActiveTask,
            stats, history, manualAddRecord, deleteRecord, updateRecord,
            timeLeft, isActive, toggleTimer, resetTimer, mode
        }}>
            {children}
        </TimerContext.Provider>
    );
};
