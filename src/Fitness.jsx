import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import './Fitness.css';

function Fitness() {
    const navigate = useNavigate();
    const [activeMainTab, setActiveMainTab] = useState('overview');
    const [activeTimeTab, setActiveTimeTab] = useState('daily'); 
    const [fitnessData, setFitnessData] = useState([]);
    const [processedData, setProcessedData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        annual: [],
    });
    const overviewTabRef = useRef(null);
    const pastLogTabRef = useRef(null);
    const [indicatorStyle, setIndicatorStyle] = useState({});

    const [summaryData, setSummaryData] = useState({
        totalMinutes: 0, avgMinutes: 0,
        totalSteps: 0, avgSteps: 0,
        totalCalories: 0, avgCalories: 0,
        periodCount: 0,
    });

    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    const [isFetching, setIsFetching] = useState(false);

    const fetchData = () => {
        if (isFetching) return;
        setIsFetching(true);
        fetch("/api/entries/fitness/past", { method: "GET", credentials: "include" })
            .then((res) => {
                 if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                const validData = Array.isArray(data) ? data : [];
                setFitnessData(validData);
                processFitnessData(validData);
                console.log(validData);
            })
            .catch((error) => {
                 console.error("Error fetching past fitness data:", error);
                 setNotification({ show: true, message: 'Failed to fetch fitness data.', type: 'error' });
                 setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
            })
            .finally(() => setIsFetching(false));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (activeMainTab === 'overview' && overviewTabRef.current) {
            setIndicatorStyle({
                width: overviewTabRef.current.offsetWidth,
                left: overviewTabRef.current.offsetLeft,
            });
        } else if (activeMainTab === 'pastLog' && pastLogTabRef.current) {
            setIndicatorStyle({
                width: pastLogTabRef.current.offsetWidth,
                left: pastLogTabRef.current.offsetLeft,
            });
        }
    }, [activeMainTab, overviewTabRef.current, pastLogTabRef.current]);

    useEffect(() => {
        updateSummaryData(processedData[activeTimeTab]);
    }, [activeTimeTab, processedData]);

    const processFitnessData = (data) => {
         if (!data || !Array.isArray(data) || data.length === 0) {
             setProcessedData({ daily: [], weekly: [], monthly: [], annual: [] });
             return;
         }

        const now = moment();
        const allEntries = data.map(entry => ({
            ...entry,
            momentTime: moment(entry.entry_time),
            minutes: Number(entry.duration_min) || 0,
            steps: Number(entry.steps) || 0,
            calories: Number(entry.calories_burned) || 0,
        })).filter(entry => entry.momentTime.isValid());

        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const targetDate = moment(now).subtract(i, 'days');
            const dateKey = targetDate.format('YYYY-MM-DD');
            const entriesForDay = allEntries.filter(entry => entry.momentTime.isSame(targetDate, 'day'));

            const totals = entriesForDay.reduce((acc, entry) => {
                acc.minutes += entry.minutes;
                acc.steps += entry.steps;
                acc.calories += entry.calories;
                return acc;
            }, { date: dateKey, displayDate: targetDate.format('MMM D'), minutes: 0, steps: 0, calories: 0 });

            dailyData.push(totals);
        }

        const weeklyData = [];
        for (let i = 7; i >= 0; i--) {
            const targetWeekStart = moment(now).subtract(i, 'weeks').startOf('isoWeek');
            const targetWeekEnd = moment(targetWeekStart).endOf('isoWeek');
            const weekKey = targetWeekStart.format('YYYY-[W]WW');

            const entriesForWeek = allEntries.filter(entry =>
                entry.momentTime.isBetween(targetWeekStart, targetWeekEnd, null, '[]')
            );

            const totals = entriesForWeek.reduce((acc, entry) => {
                acc.minutes += entry.minutes;
                acc.steps += entry.steps;
                acc.calories += entry.calories;
                return acc;
            }, { week: weekKey, displayWeek: `Wk ${targetWeekStart.format('MMM D')}`, minutes: 0, steps: 0, calories: 0 });

            weeklyData.push(totals);
        }

        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const targetMonth = moment(now).subtract(i, 'months');
            const monthKey = targetMonth.format('YYYY-MM');

            const entriesForMonth = allEntries.filter(entry =>
                entry.momentTime.format('YYYY-MM') === monthKey
            );

            const totals = entriesForMonth.reduce((acc, entry) => {
                acc.minutes += entry.minutes;
                acc.steps += entry.steps;
                acc.calories += entry.calories;
                return acc;
            }, { month: monthKey, displayMonth: targetMonth.format('MMM YYYY'), minutes: 0, steps: 0, calories: 0 });

            monthlyData.push(totals);
        }

        const annualData = [];
        const currentYear = now.year();
        const currentMonth = now.month();

        for (let i = 0; i <= currentMonth; i++) {
             const targetMonth = moment().year(currentYear).month(i);
             const monthKey = targetMonth.format('YYYY-MM');

            const entriesForMonth = allEntries.filter(entry =>
                entry.momentTime.year() === currentYear && entry.momentTime.month() === i
            );

            const totals = entriesForMonth.reduce((acc, entry) => {
                acc.minutes += entry.minutes;
                acc.steps += entry.steps;
                acc.calories += entry.calories;
                return acc;
            }, { month: monthKey, displayMonth: targetMonth.format('MMM'), minutes: 0, steps: 0, calories: 0 });

            annualData.push(totals);
        }

        setProcessedData({
            daily: dailyData,
            weekly: weeklyData,
            monthly: monthlyData,
            annual: annualData,
        });
    };

    const updateSummaryData = (data) => {
        if (!data || data.length === 0) {
            setSummaryData({
                totalMinutes: 0, avgMinutes: 0,
                totalSteps: 0, avgSteps: 0,
                totalCalories: 0, avgCalories: 0,
                periodCount: 0,
            });
            return;
        }

        let totalMinutes = 0;
        let totalSteps = 0;
        let totalCalories = 0;

        data.forEach(entry => {
            totalMinutes += entry.minutes || 0;
            totalSteps += entry.steps || 0;
            totalCalories += entry.calories || 0;
        });

        const periodCount = data.length;

        setSummaryData({
            totalMinutes,
            avgMinutes: periodCount > 0 ? totalMinutes / periodCount : 0,
            totalSteps,
            avgSteps: periodCount > 0 ? totalSteps / periodCount : 0,
            totalCalories,
            avgCalories: periodCount > 0 ? totalCalories / periodCount : 0,
            periodCount,
        });
    };

    const getTimePeriodLabel = () => {
        switch(activeTimeTab) {
            case 'daily': return '(per Day)';
            case 'weekly': return '(per Week)';
            case 'monthly': return '(per Month)';
            case 'annual': return '(per Month)';
            default: return '';
        }
    };

     const getXAxisDataKey = () => {
        switch(activeTimeTab) {
            case 'daily': return 'displayDate';
            case 'weekly': return 'displayWeek';
            case 'monthly': return 'displayMonth';
            case 'annual': return 'displayMonth';
            default: return 'date'; // fallback
        }
     };

    const handleNavigateToImport = () => {
        navigate('/import', { state: { formType: 'fitness' } });
    };

    const handleDeleteEntry = async (entryId) => {
        if (!entryId) {
             console.error("Delete failed: Entry ID is missing.");
             setNotification({ show: true, message: 'Cannot delete entry: ID missing.', type: 'error' });
             setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
             return;
        }
        try {
            const response = await fetch(`/api/entries/fitness/${entryId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                 fetchData(); 
                 setNotification({
                    show: true,
                    message: 'Fitness entry deleted successfully',
                    type: 'success'
                 });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setNotification({
                    show: true,
                    message: errorData.error || `Failed to delete entry (status: ${response.status})`,
                    type: 'error'
                });
            }
        } catch (error) {
            console.error("Error deleting fitness entry:", error);
            setNotification({
                show: true,
                message: 'An error occurred while deleting the entry',
                type: 'error'
            });
        }

        setTimeout(() => {
            setNotification({ show: false, message: '', type: '' });
        }, 3000);
    };


    return (
        <>
            <SideBar />
            <div className="fitness-container">
                {notification.show && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}
                <div className="fitness-header">
                    <h1 className="fitness-title">Fitness Overview</h1>
                    <button className="add-fitness-button" onClick={handleNavigateToImport}>
                        + Add Fitness Entry
                    </button>
                </div>

                <div className="fitness-main-tabs">
                    <div
                        ref={overviewTabRef}
                        className={`fitness-main-tab ${activeMainTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveMainTab('overview')}
                    >
                        Overview
                    </div>
                    <div
                        ref={pastLogTabRef}
                        className={`fitness-main-tab ${activeMainTab === 'pastLog' ? 'active' : ''}`}
                        onClick={() => setActiveMainTab('pastLog')}
                    >
                        Past Log
                    </div>
                    <div className="tab-indicator" style={indicatorStyle}></div>
                </div>

                {activeMainTab === 'overview' && (
                    <div className="fitness-overview-content">
                        <div className="fitness-chart-container">
                            <div className="fitness-chart">
                                <ResponsiveContainer width="100%" height={300}>
                                     {processedData[activeTimeTab] && processedData[activeTimeTab].length > 0 ? (
                                        <LineChart data={processedData[activeTimeTab]} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                                            <XAxis
                                                dataKey={getXAxisDataKey()}
                                                tick={{ fontSize: 10 }}
                                                interval={0}
                                            />
                                            <YAxis yAxisId="left" stroke="#ff5733" />
                                            {/* <YAxis yAxisId="right" orientation="right" stroke="#8884d8" /> */}
                                            <Tooltip />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="minutes" name="Minutes" stroke="#ff5733" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
                                             {/* <Line yAxisId="right" type="monotone" dataKey="steps" name="Steps" stroke="#8884d8" strokeWidth={1} dot={false}/> */}
                                             {/* <Line yAxisId="right" type="monotone" dataKey="calories" name="Calories Burned" stroke="#82ca9d" strokeWidth={1} dot={false}/> */}
                                        </LineChart>
                                     ) : (
                                         <div className="no-data-message">No data available for the selected period.</div>
                                     )}
                                </ResponsiveContainer>
                            </div>

                            <div className="fitness-time-tabs">
                                <button onClick={() => setActiveTimeTab('daily')} className={activeTimeTab === 'daily' ? 'active' : ''}>Daily</button>
                                <button onClick={() => setActiveTimeTab('weekly')} className={activeTimeTab === 'weekly' ? 'active' : ''}>Weekly</button>
                                <button onClick={() => setActiveTimeTab('monthly')} className={activeTimeTab === 'monthly' ? 'active' : ''}>Monthly</button>
                                <button onClick={() => setActiveTimeTab('annual')} className={activeTimeTab === 'annual' ? 'active' : ''}>Annual</button>
                            </div>
                        </div>

                        <div className="fitness-summary">
                            <h2>Summary ({activeTimeTab.charAt(0).toUpperCase() + activeTimeTab.slice(1)})</h2>
                            <table className="fitness-summary-table">
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>Total</th>
                                        {summaryData.periodCount > 0 && <th>Average {getTimePeriodLabel()}</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Exercise Time (min)</strong></td>
                                        <td>{Math.round(summaryData.totalMinutes)}</td>
                                        {summaryData.periodCount > 0 && <td>{Number(summaryData.avgMinutes).toFixed(1)}</td>}
                                    </tr>
                                    <tr>
                                        <td><strong>Steps</strong></td>
                                        <td>{Math.round(summaryData.totalSteps)}</td>
                                         {summaryData.periodCount > 0 && <td>{Number(summaryData.avgSteps).toFixed(1)}</td>}
                                    </tr>
                                    <tr>
                                        <td><strong>Calories Burned</strong></td>
                                        <td>{Math.round(summaryData.totalCalories)}</td>
                                         {summaryData.periodCount > 0 && <td>{Number(summaryData.avgCalories).toFixed(1)}</td>}
                                    </tr>
                                </tbody>
                            </table>
                             {summaryData.periodCount === 0 && <p>No summary data available.</p>}
                        </div>
                    </div>
                 )}

                {activeMainTab === 'pastLog' && (
                    <PastFitness
                        pastData={fitnessData}
                        handleDeleteEntry={handleDeleteEntry}
                     />
                )}
            </div>
        </>
    );
}

function PastFitness({ pastData, handleDeleteEntry }) {
    const [periodFilter, setPeriodFilter] = useState('all');
    const [filteredData, setFilteredData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    useEffect(() => {
        const dataToFilter = Array.isArray(pastData) ? pastData : [];

        if (dataToFilter.length === 0) {
            setFilteredData([]);
            return;
        }

        let filtered = [...dataToFilter].map(entry => ({
            ...entry,
            entry_time_obj: new Date(entry.entry_time) 
        }));

        filtered.sort((a, b) => b.entry_time_obj - a.entry_time_obj);

        const selectedMoment = moment(selectedDate).startOf('day');

        switch (periodFilter) {
            case 'daily':
                filtered = filtered.filter(entry =>
                    moment(entry.entry_time_obj).isSame(selectedMoment, 'day')
                );
                break;
            case 'weekly':
                const weekStart = selectedMoment.clone().startOf('isoWeek');
                const weekEnd = selectedMoment.clone().endOf('isoWeek');
                filtered = filtered.filter(entry =>
                    moment(entry.entry_time_obj).isBetween(weekStart, weekEnd, null, '[]')
                );
                break;
            case 'monthly':
                filtered = filtered.filter(entry =>
                    moment(entry.entry_time_obj).isSame(selectedMoment, 'month')
                );
                break;
            case 'annual':
                filtered = filtered.filter(entry =>
                    moment(entry.entry_time_obj).isSame(selectedMoment, 'year')
                );
                break;
            case 'all':
            default:
                break;
        }

        setFilteredData(filtered);
    }, [pastData, periodFilter, selectedDate]);

    const handleDateChange = (e) => {
        const { type, value } = e.target;
        let newDate = new Date(selectedDate);

        try {
             if (type === 'date') {
                 newDate = moment(value, 'YYYY-MM-DD').toDate();
             } else if (type === 'week') {
                 const [year, week] = value.split('-W');
                 newDate = moment().year(parseInt(year, 10)).isoWeek(parseInt(week, 10)).startOf('isoWeek').toDate();
             } else if (type === 'month') {
                 newDate = moment(value, 'YYYY-MM').startOf('month').toDate();
             } else if (type === 'number') { // year
                 newDate = moment().year(parseInt(value, 10)).startOf('year').toDate();
             }
        } catch (error) {
             console.error("Error parsing date input:", error);
             newDate = new Date(selectedDate);
        }

        if (!isNaN(newDate)) { 
           setSelectedDate(newDate);
        } else {
             console.error("Invalid date created:", newDate);
             setSelectedDate(new Date(selectedDate)); 
        }
    };

    const handleCalendarDateChange = (newDate) => {
        setSelectedDate(newDate);
        // setPeriodFilter('daily');
        setShowCalendar(false);
    };

    const toggleCalendar = () => {
        setShowCalendar(prev => !prev);
    };

    const getDatePickerProps = () => {
        const mDate = moment(selectedDate);
        if (!mDate.isValid()) { 
             console.warn("Selected date is invalid, resetting to today.");
             setSelectedDate(new Date()); 
             return { type: 'date', value: moment().format('YYYY-MM-DD') }; 
        }

        switch (periodFilter) {
            case 'daily':
                return { type: 'date', value: mDate.format('YYYY-MM-DD') };
            case 'weekly':
                 return { type: 'week', value: `${mDate.isoWeekYear()}-W${String(mDate.isoWeek()).padStart(2, '0')}` };
            case 'monthly':
                return { type: 'month', value: mDate.format('YYYY-MM') };
            case 'annual':
                 return { type: 'number', value: mDate.year(), min: 2000, max: moment().year() + 5 };
            default:
                return { type: 'date', value: mDate.format('YYYY-MM-DD') };
        }
    };

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;
        const formattedDate = moment(date).format('YYYY-MM-DD');
        const dataExists = Array.isArray(pastData) && pastData.some(entry =>
            moment(entry.entry_time).format('YYYY-MM-DD') === formattedDate
        );
        return dataExists ? <div className="fitness-calendar-dot"></div> : null;
    };


    return (
        <div className="fitness-card">
            <h3>Past Fitness Entries</h3>

            <div className="log-filter-container">
                 <div className="period-filter">
                    {['daily', 'weekly', 'monthly', 'annual', 'all'].map(period => (
                        <div
                            key={period}
                            className={`period-option ${periodFilter === period ? 'active' : ''} fitness-period`}
                            onClick={() => setPeriodFilter(period)}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </div>
                    ))}
                </div>

                 <div className="fitness-calendar-controls">
                    {periodFilter !== 'all' && (
                        <div className="date-selector">
                            <label>Select {periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1)}:</label>
                            <input
                                {...getDatePickerProps()}
                                onChange={handleDateChange}
                                max={periodFilter === 'date' ? moment().format('YYYY-MM-DD') : undefined}
                            />
                        </div>
                    )}

                    <button
                        className="show-calendar-button" 
                        onClick={toggleCalendar}
                        aria-expanded={showCalendar}
                    >
                        {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                    </button>
                </div>

                 {showCalendar && (
                    <div className="fitness-calendar-container"> 
                        <Calendar
                            onChange={handleCalendarDateChange}
                            value={selectedDate}
                            tileContent={tileContent}
                            className="fitness-calendar" 
                            maxDate={new Date()}
                        />
                    </div>
                )}
            </div>

            {filteredData.length === 0 ? (
                 <p>No fitness entries found for the selected period.</p>
            ) : (
                 <div className="fitness-table-container">
                    <table className="fitness-table">
                        <thead>
                            <tr>
                                <th>Exercise Type</th>
                                <th>Duration (min)</th>
                                <th>Calories Burned</th>
                                <th>Steps</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((entry) => (
                                <tr key={entry.entry_id || `entry-${Math.random()}`}>
                                    <td>{entry.exercise_type || 'N/A'}</td>
                                    <td>{entry.duration_min || 0}</td>
                                    <td>{entry.calories_burned || "N/A"}</td>
                                    <td>{entry.steps || "N/A"}</td>
                                    <td>{entry.entry_time_obj ? entry.entry_time_obj.toLocaleDateString() : 'Invalid Date'}</td>
                                    <td>{entry.entry_time_obj ? entry.entry_time_obj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                                    <td>
                                         <button
                                            onClick={() => handleDeleteEntry(entry.entry_id)}
                                            className="delete-button"
                                            aria-label={`Delete fitness entry from ${entry.entry_time_obj ? entry.entry_time_obj.toLocaleString() : 'invalid date'}`}
                                            disabled={!entry.entry_id} 
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            )}
        </div>
    );
}

export default Fitness;