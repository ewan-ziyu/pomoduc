import React, { useState } from 'react';
import { TimerProvider } from './context/TimerContext';
import MainView from './components/MainView';
import MiniView from './components/MiniView';
import TitleBar from './components/TitleBar';
import './App.css';

function App() {
  const [viewMode, setViewMode] = useState('full'); // 'full' | 'mini'

  const handleSwitchMode = (mode) => {
    setViewMode(mode);
    if (window.electron) {
      window.electron.setMiniMode(mode === 'mini');
    }
  };

  return (
    <TimerProvider>
      <div className="app-wrapper" style={{
        height: '100vh', width: '100%', display: 'flex', flexDirection: 'column'
      }}>
        {viewMode === 'full' && <TitleBar />}

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {viewMode === 'full' ? (
            <MainView onSwitchMode={() => handleSwitchMode('mini')} />
          ) : (
            <MiniView onSwitchMode={() => handleSwitchMode('full')} />
          )}
        </div>
      </div>
    </TimerProvider>
  );
}

export default App;
