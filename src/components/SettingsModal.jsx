import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTimer } from '../context/TimerContext';

const SettingsModal = ({ isOpen, onClose }) => {
    const { settings, setSettings } = useTimer();
    const [localSettings, setLocalSettings] = useState(settings);

    if (!isOpen) return null;

    const handleSave = () => {
        setSettings(localSettings);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'var(--surface-color)', padding: '2rem', borderRadius: '16px',
                width: '90%', maxWidth: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2>Settings</h2>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Focus Duration (minutes)
                    </label>
                    <input
                        type="number"
                        value={localSettings.focusDuration}
                        onChange={(e) => setLocalSettings({ ...localSettings, focusDuration: parseInt(e.target.value) || 1 })}
                        style={{
                            width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--secondary-color)',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Break Duration (minutes)
                    </label>
                    <input
                        type="number"
                        value={localSettings.breakDuration || 4}
                        onChange={(e) => setLocalSettings({ ...localSettings, breakDuration: parseInt(e.target.value) || 1 })}
                        style={{
                            width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--secondary-color)',
                            fontSize: '1rem'
                        }}
                    />
                </div>


                {/*
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Day Start Time (Current: {localSettings.dayStart})
                    </label>
                    <input
                        type="time"
                        value={localSettings.dayStart}
                        onChange={(e) => setLocalSettings({ ...localSettings, dayStart: e.target.value })}
                        style={{
                            width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--secondary-color)',
                            fontSize: '1rem'
                        }}
                    />
                </div>
                */}

                <button onClick={handleSave} style={{
                    width: '100%', padding: '0.75rem', background: 'var(--text-color)', color: 'white',
                    borderRadius: '8px', fontSize: '1rem', marginTop: '1rem'
                }}>
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default SettingsModal;
