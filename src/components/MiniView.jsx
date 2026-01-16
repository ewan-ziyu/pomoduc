import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Maximize2, RotateCcw, Settings } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { formatTime } from '../utils/formatTime';

const MiniView = ({ onSwitchMode }) => {
    const { timeLeft, isActive, toggleTimer, resetTimer, mode } = useTimer();
    const [opacity, setOpacity] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);

    // Initial opacity sync
    useEffect(() => {
        if (window.electron) {
            window.electron.setOpacity(opacity);
        }
    }, []);

    // Handle Window Expansion for Settings
    useEffect(() => {
        if (window.electron) {
            window.electron.setMiniExpand(showSettings);
        }
    }, [showSettings]);

    const handleOpacityChange = (e) => {
        // Calculate opacity based on click/drag position in the slider
        const rect = e.currentTarget.getBoundingClientRect();
        const height = rect.height;
        const relativeY = e.clientY - rect.top;

        // 0 at top (100% opacity), height at bottom (10% opacity)
        // We want top to be 1.0 and bottom to be 0.1
        // So we map 0 -> 1.0 and height -> 0.1

        let newOpacity = 1 - (relativeY / height) * 0.9;

        // Clamp values
        if (newOpacity > 1) newOpacity = 1;
        if (newOpacity < 0.1) newOpacity = 0.1;

        setOpacity(newOpacity);
        if (window.electron) {
            window.electron.setOpacity(newOpacity);
        }
    };

    const handleMouseMove = (e) => {
        if (e.buttons === 1) { // Left mouse button pressed
            handleOpacityChange(e);
        }
    };

    // Close settings when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target) && !event.target.closest('.settings-toggle')) {
                setShowSettings(false);
            }
        };

        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
        }}>
            <div className="mini-mode" style={{
                width: '100%',
                height: '50px', // Fixed height for the bar part
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '0 1rem',
                background: `rgba(255, 255, 255, ${opacity})`,
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--secondary-color)',
                borderRadius: '8px',
                WebkitAppRegion: 'drag',
                boxSizing: 'border-box',
                position: 'relative'
            }}>

                {/* Timer Display */}
                <div style={{
                    fontSize: '1.7rem',
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
                {/* Controls */}
                <div style={{ display: 'flex', gap: '0.4rem', WebkitAppRegion: 'no-drag', alignItems: 'center' }}>
                    <button onClick={toggleTimer} style={{
                        background: mode === 'break' ? '#90EE90' : '#747474ff', // Softer gray
                        color: mode === 'break' ? '#000000ff' : 'white',
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'background-color 0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '2px' }} />}
                    </button>

                    <button onClick={resetTimer} style={{
                        background: 'transparent',
                        color: '#888888', // Light gray
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        border: '0.5px solid #cccccc', // Subtle border
                        transition: 'all 0.2s'
                    }}>
                        <RotateCcw size={16} />
                    </button>

                    {/* Settings Button */}
                    <div style={{ position: 'relative' }}>
                        <button
                            className="settings-toggle"
                            onClick={() => setShowSettings(!showSettings)}
                            style={{
                                background: 'transparent',
                                color: '#b7b7b7ff',
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                border: '0.5px solid #cccccc',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Settings size={18} />
                        </button>

                        {/* Opacity Slider Popup */}
                        {showSettings && (
                            <div
                                ref={settingsRef}
                                style={{
                                    position: 'absolute',
                                    bottom: '45px', // Upward from the button
                                    right: '-5px',
                                    width: '30px',
                                    height: '100px',
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '15px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: '10px 0',
                                    zIndex: 1000,
                                    border: '1px solid #eee'
                                }}
                            >
                                <div
                                    onMouseDown={handleOpacityChange}
                                    onMouseMove={handleMouseMove}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Track */}
                                    <div style={{
                                        width: '4px',
                                        height: '100%',
                                        background: '#e0e0e0',
                                        borderRadius: '2px'
                                    }} />

                                    {/* Thumb */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: `${((1 - opacity) / 0.9) * 100}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: '12px',
                                        height: '12px',
                                        background: '#888888',
                                        borderRadius: '50%',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        pointerEvents: 'none'
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={onSwitchMode} style={{
                        background: 'transparent',
                        color: '#888888',
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        border: 'none',
                    }}>
                        <Maximize2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiniView;
