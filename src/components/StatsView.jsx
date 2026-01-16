import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useTimer } from '../context/TimerContext';
import { formatDuration } from '../utils/formatTime';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
    'en-US': enUS,
    'zh-CN': zhCN,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales,
});

const StatsView = () => {
    const { history, settings } = useTimer();
    const [view, setView] = useState(Views.DAY);
    const [date, setDate] = useState(new Date());
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = 1x, up to 5x
    const calendarWrapperRef = useRef(null);

    // Transform history to RBC events
    const events = useMemo(() => {
        return history.map(session => ({
            id: session.id,
            title: session.taskName || 'Focus',
            start: new Date(session.startTime),
            end: new Date(session.endTime),
            resource: session,
        }));
    }, [history]);

    const handleNavigate = useCallback((newDate) => setDate(newDate), []);
    const handleViewChange = useCallback((newView) => setView(newView), []);

    // Date Navigation Handlers
    const goToPrev = () => setDate(prev => addDays(prev, view === Views.DAY ? -1 : -7));
    const goToNext = () => setDate(prev => addDays(prev, view === Views.DAY ? 1 : 7));
    const goToToday = () => setDate(new Date());

    // Zoom on Ctrl + Scroll
    useEffect(() => {
        const wrapper = calendarWrapperRef.current;
        if (!wrapper) return;

        const handleWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.2 : 0.2;
                setZoomLevel(prev => Math.min(Math.max(prev + delta, 1), 5));
            }
        };

        wrapper.addEventListener('wheel', handleWheel, { passive: false });
        return () => wrapper.removeEventListener('wheel', handleWheel);
    }, []);

    // Calendar Time Range based on Settings
    const { minDate, maxDate } = useMemo(() => {
        const [startH, startM] = (settings.dayStart || "00:00").split(':').map(Number);
        const [endH, endM] = (settings.dayEnd || "23:59").split(':').map(Number);

        const min = new Date();
        min.setHours(startH, startM, 0, 0);

        const max = new Date();
        max.setHours(endH, endM, 59, 999);

        return { minDate: min, maxDate: max };
    }, [settings.dayStart, settings.dayEnd]);

    // Calculate daily totals for the currently displayed week
    const weeklyTotals = useMemo(() => {
        if (view !== Views.WEEK) return [];
        const start = startOfWeek(date, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => {
            const day = addDays(start, i);
            const dayStr = format(day, 'yyyy-MM-dd');
            const total = history.reduce((acc, session) => {
                const sessionDate = format(new Date(session.startTime), 'yyyy-MM-dd');
                return sessionDate === dayStr ? acc + session.duration : acc;
            }, 0);
            return total;
        });
    }, [date, history, view]);

    // Custom styles for the calendar
    const calendarStyles = useMemo(() => ({
        height: view === Views.WEEK ? 'calc(100vh - 250px)' : 'calc(100vh - 180px)',
        '--zoom-factor': zoomLevel,
    }), [zoomLevel, view]);

    return (
        <div className="stats-container" style={{
            padding: '1rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header / Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '8px'
            }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleViewChange(Views.DAY)} className={`view-btn ${view === Views.DAY ? 'active' : ''}`}>Daily</button>
                    <button onClick={() => handleViewChange(Views.WEEK)} className={`view-btn ${view === Views.WEEK ? 'active' : ''}`}>Weekly</button>
                </div>

                {/* Date Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button onClick={goToPrev} className="nav-arrow-btn">←</button>
                    <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        color: 'var(--text-color)',
                        padding: '0 4px'
                    }}>
                        {format(date, view === Views.DAY ? 'MMM dd, yyyy' : "'Week of' MMM dd")}
                    </div>
                    <button onClick={goToNext} className="nav-arrow-btn">→</button>
                </div>

                <button onClick={goToToday} className="today-btn">Today</button>
            </div>

            {/* Weekly Bar Chart Summary */}
            {view === Views.WEEK && (
                <div className="weekly-bar-summary" style={{
                    display: 'flex',
                    height: '60px',
                    marginBottom: '10px',
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: '5px'
                }}>
                    <div className="gutter-spacer" style={{ width: '80px' }} />
                    {weeklyTotals.map((total, i) => {
                        const maxMins = Math.max(...weeklyTotals, 60);
                        const heightPct = (total / maxMins) * 100;
                        return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.65rem', color: '#888', marginBottom: '2px' }}>
                                    {total > 0 ? formatDuration(total) : ''}
                                </span>
                                <div style={{
                                    width: '30%',
                                    height: `${Math.max(heightPct, 0)}%`,
                                    background: 'var(--text-color)',
                                    opacity: 0.2,
                                    borderRadius: '2px 2px 0 0'
                                }} />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Calendar Wrapper */}
            <div ref={calendarWrapperRef} className="calendar-wrapper" style={calendarStyles}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    onView={handleViewChange}
                    date={date}
                    onNavigate={handleNavigate}
                    views={[Views.DAY, Views.WEEK]}
                    toolbar={false}
                    step={15}
                    timeslots={4}
                    min={minDate}
                    max={maxDate}
                    components={{
                        event: ({ event }) => (
                            <div className="custom-event" title={`${event.title}: ${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`}>
                                <div className="event-title">{event.title}</div>
                                {zoomLevel > 2 && <div className="event-time">{format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}</div>}
                            </div>
                        )
                    }}
                />
            </div>

            <style>{`
                .view-btn {
                    padding: 0.4rem 1.2rem;
                    border: none;
                    background: #f0f0f0;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                .view-btn.active {
                    background: var(--text-color);
                    color: white;
                }
                
                .nav-arrow-btn {
                    background: none;
                    border: 1px solid #eee;
                    border-radius: 4px;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 1rem;
                }
                .nav-arrow-btn:hover {
                    background: #f9f9f9;
                    border-color: #ddd;
                }
                
                .today-btn {
                    padding: 0.2rem 0.6rem;
                    background: white;
                    border: 2px solid #6d6d6dff;
                    border-radius: 24px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .today-btn:hover {
                    background: #ddddddff;
                }
                
                /* 左侧时间轴标签样式 */
                .rbc-label {
                    font-size: 0.75rem;
                    color: #888;
                    font-weight: 200;
                    padding-right: 20px !important;
                }

                /* 固定 gutter 宽度以配合上方柱状图对齐 */
                .rbc-time-gutter {
                    width: 80px !important;
                }
                
                /* Zoom Implementation */
                .calendar-wrapper .rbc-time-content {
                    overflow-y: auto;
                }
                .calendar-wrapper .rbc-timeslot-group {
                    min-height: calc(40px * var(--zoom-factor)) !important;
                }
                
                /* Glassmorphism Events */
                .calendar-wrapper .rbc-event {
                    background: rgba(var(--accent-rgb, 0,0,0), 0.05) !important;
                    border: 1px solid rgba(var(--accent-rgb, 0,0,0), 0.1) !important;
                    backdrop-filter: blur(4px);
                    color: var(--text-color) !important;
                    border-radius: 1px !important;
                    padding: 2px 8px !important;
                    transition: transform 0.2s;
                }
                .calendar-wrapper .rbc-event:hover {
                    transform: scale(1.01);
                    z-index: 10;
                    box-shadow: 0 4px 12px rgba(144, 144, 144, 0.1);
                }
                .custom-event {
                    height: 100%;
                    display: flex;
                    flex-direction: row; /* 改为横向排列 */
                    align-items: center;
                    gap: 8px;
                    overflow: hidden;
                }
                .event-title {
                    font-weight: 400;
                    font-size: 0.8rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .event-time {
                    font-size: 0.7rem;
                    color: #888;
                    white-space: nowrap;
                }

                /* RBC Overrides */
                .rbc-calendar {
                    font-family: inherit;
                }
                .rbc-header {
                    padding: 10px 0 !important;
                    font-weight: 600 !important;
                    border-bottom: 2px solid #f0f0f0 !important;
                }
                .rbc-time-header.rbc-overflowing {
                    border-right: none !important;
                }
                .rbc-current-time-indicator {
                    background-color: #ff4757;
                }
                .rbc-time-view {
                    border: none !important;
                }
                .rbc-day-slot {
                    background: transparent !important;
                }

                /* 隐藏不需要的全天事件行（空出的白条） */
                .rbc-time-header .rbc-allday-cell {
                    display: none !important;
                }
                .rbc-time-header-content {
                    border-left: none !important;
                }
            `}</style>
        </div>
    );
};

export default StatsView;
