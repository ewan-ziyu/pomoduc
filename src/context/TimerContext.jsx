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
  // Settings
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pomoduc_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Tasks
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('pomoduc_tasks');
    // Default "General" task if none
    return saved ? JSON.parse(saved) : [{ id: 1, name: 'General', color: '#ff6b6b' }];
  });
  const [activeTaskId, setActiveTaskId] = useState(() => {
    const saved = localStorage.getItem('pomoduc_active_task');
    return saved ? JSON.parse(saved) : 1;
  });

  // Stats
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('pomoduc_stats');
    return saved ? JSON.parse(saved) : {
      date: new Date().toLocaleDateString(),
      totalPomodoros: 0,
      totalMinutes: 0,
      byTask: {}
    };
  });

  // History
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('pomoduc_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Timer State
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break' (optional ext)

  const timerRef = useRef(null);

  // Persistence Effects
  useEffect(() => localStorage.setItem('pomoduc_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('pomoduc_tasks', JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem('pomoduc_active_task', JSON.stringify(activeTaskId)), [activeTaskId]);
  useEffect(() => localStorage.setItem('pomoduc_stats', JSON.stringify(stats)), [stats]);
  useEffect(() => localStorage.setItem('pomoduc_history', JSON.stringify(history)), [history]);

  // Reset timer when settings change (if not active)
  useEffect(() => {
    if (!isActive) {
      if (mode === 'focus') setTimeLeft(settings.focusDuration * 60);
      if (mode === 'break') setTimeLeft(settings.breakDuration * 60);
    }
  }, [settings.focusDuration, settings.breakDuration, mode]);

  // Helper to get the "business date" based on dayStart
  const getBusinessDate = (startStr) => {
    if (!startStr) return new Date().toLocaleDateString();
    const now = new Date();
    const [h, m] = startStr.split(':').map(Number);
    const splitTime = new Date(now);
    splitTime.setHours(h, m || 0, 0, 0);

    // If now is before the split time, it belongs to the previous day
    if (now < splitTime) {
      const prevDay = new Date(now);
      prevDay.setDate(prevDay.getDate() - 1);
      return prevDay.toLocaleDateString();
    }
    return now.toLocaleDateString();
  };

  // Check new day for stats
  useEffect(() => {
    const currentBusinessDate = getBusinessDate(settings.dayStart);
    if (stats.date !== currentBusinessDate) {
      setStats({
        date: currentBusinessDate,
        totalPomodoros: 0,
        totalMinutes: 0,
        byTask: {}
      });
    }
  }, [settings.dayStart]); // Check when settings change or on mount (interval?)

  // In a real app, we might want an interval to check for day rollover, 
  // but for now checking on specific actions or mount is okay.
  // Let's add an interval to check every minute for rollover
  useEffect(() => {
    const interval = setInterval(() => {
      const currentBusinessDate = getBusinessDate(settings.dayStart);
      if (stats.date !== currentBusinessDate) {
        setStats(prev => ({
          date: currentBusinessDate,
          totalPomodoros: 0,
          totalMinutes: 0,
          byTask: {}
        }));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [stats.date, settings.dayStart]);


  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    // Always switch to focus mode on reset/loop click
    setMode('focus');
    setTimeLeft(settings.focusDuration * 60);
  };

  const updateStats = () => {
    // Rule: Work time less than 10 minutes is not included in stats
    // Rule: Break time is not included (covered by mode check)
    if (mode !== 'focus' || settings.focusDuration < 10) return;

    // Create history record
    const now = new Date();
    const taskDuration = settings.focusDuration;
    const activeTaskObj = tasks.find(t => t.id === activeTaskId) || { name: 'Unknown' };

    const newRecord = {
      id: Date.now(),
      endTime: now.toISOString(),
      startTime: new Date(now.getTime() - taskDuration * 60000).toISOString(),
      duration: taskDuration, // in minutes
      taskId: activeTaskId,
      taskName: activeTaskObj.name
    };

    setHistory(prev => [...prev, newRecord]);

    // Update daily stats (legacy support + optimization)
    setStats(prev => {
      const newByTask = { ...prev.byTask };
      newByTask[activeTaskId] = (newByTask[activeTaskId] || 0) + taskDuration;

      return {
        ...prev,
        totalPomodoros: prev.totalPomodoros + 1,
        totalMinutes: prev.totalMinutes + taskDuration,
        byTask: newByTask
      };
    });
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer finished
      setIsActive(false);
      updateStats(); // This function now needs to check mode internally or be moved

      // Switch Mode Logic
      const nextMode = mode === 'focus' ? 'break' : 'focus';
      setMode(nextMode);
      const nextDuration = nextMode === 'focus' ? settings.focusDuration : settings.breakDuration;
      setTimeLeft(nextDuration * 60);
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, activeTaskId, mode, settings]);

  const addTask = (name, color) => {
    const newTask = { id: Date.now(), name, color };
    setTasks([...tasks, newTask]);
    // Auto-select new task?
    // setActiveTaskId(newTask.id); 
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (activeTaskId === id && tasks.length > 0) {
      setActiveTaskId(tasks[0].id);
    }
  };

  const getActiveTask = () => tasks.find(t => t.id === activeTaskId) || tasks[0];

  return (
    <TimerContext.Provider value={{
      settings, setSettings,
      tasks, addTask, deleteTask,
      activeTaskId, setActiveTaskId, getActiveTask,
      stats, history,
      timeLeft, isActive, toggleTimer, resetTimer, mode
    }}>
      {children}
    </TimerContext.Provider>
  );
};
