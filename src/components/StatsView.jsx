import React, { useState, useMemo } from 'react';
import { useTimer } from '../context/TimerContext';
import { formatDuration } from '../utils/formatTime';

const StatsView = () => {
    const { history, settings } = useTimer();
    const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'

    // Helper to filter history for a specific date range
    const getHistoryForDate = (date) => {
        const targetDate = date.toLocaleDateString();
        return history.filter(item => {
            const itemDate = new Date(item.endTime).toLocaleDateString();
            return itemDate === targetDate;
        });
    };

    // Helper to get last 7 days data
    const weeklyData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString();
            const dayName = d.toLocaleDateString(navigator.language, { weekday: 'short' });

            const daySessions = history.filter(item => {
                // Use endTime for attribution
                return new Date(item.endTime).toLocaleDateString() === dateStr;
            });

            const totalMinutes = daySessions.reduce((acc, curr) => acc + curr.duration, 0);
            days.push({ dayName, totalMinutes, dateStr });
        }
        return days;
    }, [history]);

    // Today's Stats
    const today = new Date();
    const todaySessions = getHistoryForDate(today);
    const todayMinutes = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);
    const todayCount = todaySessions.length;

    // Timeline Calculation
    // We map 00:00 - 24:00 to 0% - 100%
    const timelineItems = useMemo(() => {
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        return todaySessions.map(session => {
            const sessionStart = new Date(session.startTime);
            const sessionEnd = new Date(session.endTime);

            // Calculate intersection with today
            const effectiveStart = sessionStart < startOfDay ? startOfDay : sessionStart;
            const effectiveEnd = sessionEnd > endOfDay ? endOfDay : sessionEnd;

            if (effectiveEnd <= effectiveStart) return null;

            // Convert to minutes from midnight (0 - 1440)
            const getMins = (d) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;

            const startMins = getMins(effectiveStart);
            const endMins = getMins(effectiveEnd);
            const totalDayMinutes = 24 * 60;

            const left = (startMins / totalDayMinutes) * 100;
            const width = ((endMins - startMins) / totalDayMinutes) * 100;

            return {
                ...session,
                left: `${left}%`,
                width: `${width}%`
            };
        }).filter(Boolean);
    }, [todaySessions]);

    return (
        <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div style={{
                    background: '#eee', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px'
                }}>
                    <button
                        onClick={() => setViewMode('daily')}
                        style={{
                            padding: '0.4rem 1.2rem', borderRadius: '6px', border: 'none',
                            background: viewMode === 'daily' ? 'white' : 'transparent',
                            boxShadow: viewMode === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Daily
                    </button>
                    <button
                        onClick={() => setViewMode('weekly')}
                        style={{
                            padding: '0.4rem 1.2rem', borderRadius: '6px', border: 'none',
                            background: viewMode === 'weekly' ? 'white' : 'transparent',
                            boxShadow: viewMode === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Weekly
                    </button>
                </div>
            </div>

            {viewMode === 'daily' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Today's Focus</div>
                        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-color)' }}>
                            {Math.floor(todayMinutes / 60)}<span style={{ fontSize: '1rem' }}>h</span> {todayMinutes % 60}<span style={{ fontSize: '1rem' }}>m</span>
                        </div>
                        <div style={{ fontSize: '1rem', color: '#999', marginTop: '0.5rem' }}>
                            {todayCount} sessions
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Timeline (24h)</div>
                        {/* Timeline Container */}
                        <div style={{
                            position: 'relative', height: '40px', background: '#f0f0f0', borderRadius: '6px',
                            overflow: 'hidden'
                        }}>
                            {/* Hour Markers (0, 6, 12, 18) - Optional but helpful */}
                            {[0, 6, 12, 18, 24].map(h => (
                                <div key={h} style={{
                                    position: 'absolute', left: `${(h / 24) * 100}%`, height: '100%',
                                    borderLeft: '1px solid #ddd', fontSize: '0.7rem', color: '#aaa',
                                    paddingLeft: '4px', paddingTop: '22px'
                                }}>
                                    {h !== 24 ? h : ''}
                                </div>
                            ))}

                            {timelineItems.map(item => (
                                <div key={item.id}
                                    title={`${item.taskName}: ${new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    style={{
                                        position: 'absolute',
                                        left: item.left,
                                        width: Math.max(parseFloat(item.width), 0.5) + '%', // Min width for visibility
                                        height: '60%', top: '20%',
                                        background: 'var(--text-color)',
                                        borderRadius: '4px',
                                        cursor: 'help'
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                            <span>00:00</span>
                            <span>12:00</span>
                            <span>23:59</span>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'weekly' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '300px', paddingBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                    {weeklyData.map((day, i) => {
                        const maxMins = Math.max(...weeklyData.map(d => d.totalMinutes), 60); // Scale based on max, min 60
                        const heightPct = (day.totalMinutes / maxMins) * 100;

                        return (
                            <div key={i} style={{
                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%'
                            }}>
                                <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>{day.totalMinutes > 0 ? day.totalMinutes : ''}</div>
                                <div style={{
                                    width: '100%', height: `${Math.max(heightPct, 2)}%`,
                                    background: day.totalMinutes > 0 ? 'var(--text-color)' : '#eee',
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.5s ease'
                                }} />
                                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>{day.dayName}</div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StatsView;
