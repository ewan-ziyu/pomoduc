import React from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { formatTime } from '../utils/formatTime';

const MiniView = ({ onSwitchMode }) => {
    const { timeLeft, isActive, toggleTimer, mode } = useTimer();

    return (
        <div className="mini-mode" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center', // Center them to bring them closer
            gap: '3rem', // This number controls the EXACT distance between text and buttons
            padding: '0 1rem',
            background: 'rgba(255, 255, 255, 0.95)', // Slightly transparent
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--secondary-color)',
            borderRadius: '8px', // Rounded rectangle
            WebkitAppRegion: 'drag', // DRAGGABLE
            boxSizing: 'border-box'
        }}>

            {/* Timer Display */}
            <div style={{
                fontSize: '1.7rem', // Slightly smaller for 50px height
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--text-color)',
                cursor: 'default',
                lineHeight: 1,
                textShadow: '0px 0px 1px rgba(0, 0, 0, 0.2)',
            }}>
                {formatTime(timeLeft)}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', WebkitAppRegion: 'no-drag' }}>
                <button onClick={toggleTimer} style={{
                    background: mode === 'break' ? '#90EE90' : 'var(--text-color)', // Light green for break
                    color: mode === 'break' ? '#333' : 'white',
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'background-color 0.3s'
                }}>
                    {isActive ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
                </button>

                <button onClick={onSwitchMode} style={{
                    background: 'transparent',
                    color: 'var(--text-color)',
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: 0.7
                }}>
                    <Maximize2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default MiniView;
