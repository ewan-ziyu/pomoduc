import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const TitleBar = () => {
    // Only render in Electron mode
    if (!window.electron) return null;

    const buttonStyle = {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '46px',
        height: '32px',
        cursor: 'pointer',
        WebkitAppRegion: 'no-drag', // Buttons must be clickable
        transition: 'background-color 0.2s',
    };

    return (
        <div style={{
            height: '32px',
            background: 'var(--surface-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            WebkitAppRegion: 'drag', // Allow dragging
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            borderBottom: '1px solid var(--secondary-color)'
        }}>
            <div style={{ paddingLeft: '1rem', fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>
                Pomoduc
            </div>
            <div style={{ display: 'flex' }}>
                <button
                    onClick={() => window.electron.minimize()}
                    style={buttonStyle}
                    className="titlebar-btn hover:bg-gray-100"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={() => window.electron.maximize()}
                    style={buttonStyle}
                    className="titlebar-btn hover:bg-gray-100"
                >
                    <Square size={14} />
                </button>
                <button
                    onClick={() => window.electron.close()}
                    style={{ ...buttonStyle, marginRight: 0 }}
                    className="titlebar-btn close hover:bg-red-500 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
