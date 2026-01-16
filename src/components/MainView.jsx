import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, Settings, SquareArrowOutDownLeft, ChartColumnBig, Clock } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { formatTime, formatDuration } from '../utils/formatTime';
import SettingsModal from './SettingsModal';
import StatsView from './StatsView';

const MainView = ({ onSwitchMode }) => {
    const {
        timeLeft, isActive, toggleTimer, resetTimer,
        tasks, addTask, deleteTask, activeTaskId, setActiveTaskId, getActiveTask,
        stats, mode // Get mode
    } = useTimer();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [view, setView] = useState('timer'); // 'timer' | 'stats'
    const activeTask = getActiveTask();

    const handleAddTask = (e) => {
        e.preventDefault();
        if (newTaskName.trim()) {
            addTask(newTaskName, '#ff6b6b'); // Default color for now
            setNewTaskName('');
        }
    };

    const iconBtnStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '8px',
        transition: 'all 0.2s',
        color: 'var(--text-color)',
        opacity: 0.8
    };

    return (
        <div className="app-container" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                    {view === 'stats' ? 'Statistics' : (mode === 'break' ? 'Break Time' : 'Pomodoro')}
                </h1>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                        onClick={() => setView(view === 'timer' ? 'stats' : 'timer')}
                        title={view === 'timer' ? "View Stats" : "Back to Timer"}
                        className="header-icon-btn"
                        style={iconBtnStyle}
                    >
                        {view === 'timer' ? <ChartColumnBig size={20} /> : <Clock size={20} />}
                    </button>
                    <button
                        onClick={onSwitchMode}
                        title="Mini Mode"
                        className="header-icon-btn"
                        style={iconBtnStyle}
                    >
                        <SquareArrowOutDownLeft size={20} />
                    </button>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="header-icon-btn"
                        style={iconBtnStyle}
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {view === 'stats' ? (
                <StatsView />
            ) : (
                <>
                    {/* Timer Display */}
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '2rem'
                    }}>
                        <div style={{
                            fontSize: '6rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                            color: 'var(--text-color)', marginBottom: '1rem'
                        }}>
                            {formatTime(timeLeft)}
                        </div>
                        <div style={{
                            fontSize: '1.1rem', color: 'var(--text-color)', opacity: 0.7, marginBottom: '2rem',
                            background: '#eee', padding: '0.25rem 1rem', borderRadius: '20px'
                        }}>
                            {activeTask.name}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={toggleTimer} style={{
                                background: mode === 'break' ? '#90EE90' : (isActive ? 'var(--secondary-color)' : 'var(--text-color)'),
                                color: isActive && mode !== 'break' ? 'var(--text-color)' : (mode === 'break' ? '#333' : 'white'),
                                width: '64px', height: '64px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                                border: 'none', cursor: 'pointer'
                            }}>
                                {isActive ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
                            </button>
                            <button onClick={resetTimer} style={{
                                background: 'transparent', border: '2px solid var(--secondary-color)',
                                color: 'var(--text-color)',
                                width: '64px', height: '64px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <RotateCcw size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Tasks & Stats Section */}
                    <div style={{ padding: '1.5rem', background: '#fafafa', borderTop: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tasks</h3>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                Today: {stats.totalPomodoros} ({formatDuration(stats.totalMinutes)})
                            </span>
                        </div>

                        <div style={{ maxHeight: '120px', overflowY: 'auto', marginBottom: '1rem' }}>
                            {tasks.map(task => (
                                <div key={task.id}
                                    onClick={() => setActiveTaskId(task.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '8px',
                                        background: activeTaskId === task.id ? 'white' : 'transparent',
                                        border: activeTaskId === task.id ? '1px solid #ddd' : '1px solid transparent',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>{task.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {/* Task Duration */}
                                        <span style={{ fontSize: '0.75rem', color: '#999', marginRight: '4px' }}>
                                            {formatDuration(stats.byTask[task.id] || 0)}
                                        </span>
                                        {task.id !== 1 && (
                                            <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} style={{ color: '#999' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Add new task..."
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                style={{
                                    flex: 1, padding: '0.5rem', borderRadius: '8px',
                                    border: '1px solid var(--secondary-color)', background: 'white'
                                }}
                            />
                            <button type="submit" style={{
                                background: 'var(--text-color)', color: 'white',
                                width: '36px', height: '36px', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Plus size={20} />
                            </button>
                        </form>
                    </div>
                </>
            )}

            <style>{`
                .header-icon-btn:hover {
                    background: #f0f0f0 !important;
                    opacity: 1 !important;
                    transform: translateY(-1px);
                }
                .header-icon-btn:active {
                    transform: translateY(0);
                    background: #e8e8e8 !important;
                }
            `}</style>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default MainView;
