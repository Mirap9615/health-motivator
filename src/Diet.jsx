import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment'; 
import './Diet.css';

function Diet() {
    const navigate = useNavigate();
    const [activeMainTab, setActiveMainTab] = useState('overview');
    const [activeTimeTab, setActiveTimeTab] = useState('daily'); // default to daily 
    const [dietData, setDietData] = useState([]);
    const [processedData, setProcessedData] = useState({
        daily: [], // last 7 days, aggregated daily
        weekly: [], // last 8 weeks, aggregated weekly
        monthly: [], // last 12 months, aggregated monthly
        annual: [], // current year, aggregated monthly
    });
    const overviewTabRef = useRef(null);
    const pastLogTabRef = useRef(null);
    const [indicatorStyle, setIndicatorStyle] = useState({});

    const [summaryData, setSummaryData] = useState({
        totalCalories: 0, avgCalories: 0,
        totalProtein: 0, avgProtein: 0,
        totalCarbs: 0, avgCarbs: 0,
        totalFats: 0, avgFats: 0,
        periodCount: 0, 
    });

    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    const [isFetching, setIsFetching] = useState(false);

    const fetchData = () => {
        if (isFetching) return;
        setIsFetching(true);
        fetch("/api/entries/diet/past", { method: "GET", credentials: "include" })
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                const validData = Array.isArray(data) ? data : [];
                setDietData(validData);
                processDietData(validData); 
            })
            .catch((error) => console.error("Error fetching past data:", error))
            .finally(() => setIsFetching(false));
    };

    useEffect(() => {
        fetchData();
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

    const processDietData = (data) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
             setProcessedData({ daily: [], weekly: [], monthly: [], annual: [] });
             return;
        }

        const now = moment();
        const allEntries = data.map(entry => ({
            ...entry,
            momentTime: moment(entry.entry_time), 
            calories: Number(entry.calories) || 0,
            protein: Number(entry.protein_g) || 0,
            carbs: Number(entry.carbs_g) || 0,
            fats: Number(entry.fats_g) || 0,
        })).filter(entry => entry.momentTime.isValid()); 

        const dailyData = [];
        for (let i = 6; i >= 0; i--) {
            const targetDate = moment(now).subtract(i, 'days');
            const dateKey = targetDate.format('YYYY-MM-DD');
            const entriesForDay = allEntries.filter(entry => entry.momentTime.isSame(targetDate, 'day'));

            const totals = entriesForDay.reduce((acc, entry) => {
                acc.calories += entry.calories;
                acc.protein += entry.protein;
                acc.carbs += entry.carbs;
                acc.fats += entry.fats;
                return acc;
            }, { date: dateKey, displayDate: targetDate.format('MMM D'), calories: 0, protein: 0, carbs: 0, fats: 0 });

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
                acc.calories += entry.calories;
                acc.protein += entry.protein;
                acc.carbs += entry.carbs;
                acc.fats += entry.fats;
                return acc;
            }, { week: weekKey, displayWeek: `Wk ${targetWeekStart.format('MMM D')}`, calories: 0, protein: 0, carbs: 0, fats: 0 });

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
                acc.calories += entry.calories;
                acc.protein += entry.protein;
                acc.carbs += entry.carbs;
                acc.fats += entry.fats;
                return acc;
            }, { month: monthKey, displayMonth: targetMonth.format('MMM YYYY'), calories: 0, protein: 0, carbs: 0, fats: 0 });

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
                acc.calories += entry.calories;
                acc.protein += entry.protein;
                acc.carbs += entry.carbs;
                acc.fats += entry.fats;
                return acc;
            }, { month: monthKey, displayMonth: targetMonth.format('MMM'), calories: 0, protein: 0, carbs: 0, fats: 0 });

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
                totalCalories: 0, avgCalories: 0,
                totalProtein: 0, avgProtein: 0,
                totalCarbs: 0, avgCarbs: 0,
                totalFats: 0, avgFats: 0,
                periodCount: 0,
            });
            return;
        }

        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFats = 0;

        data.forEach(entry => {
            totalCalories += entry.calories || 0;
            totalProtein += entry.protein || 0;
            totalCarbs += entry.carbs || 0;
            totalFats += entry.fats || 0;
        });

        const periodCount = data.length; 

        setSummaryData({
            totalCalories,
            avgCalories: periodCount > 0 ? totalCalories / periodCount : 0,
            totalProtein,
            avgProtein: periodCount > 0 ? totalProtein / periodCount : 0,
            totalCarbs,
            avgCarbs: periodCount > 0 ? totalCarbs / periodCount : 0,
            totalFats,
            avgFats: periodCount > 0 ? totalFats / periodCount : 0,
            periodCount,
        });
    };

    const getTimePeriodLabel = () => {
        switch(activeTimeTab) {
            case 'daily':
                return '(per Day)';
            case 'weekly':
                return '(per Week)'; 
            case 'monthly':
                 return '(per Month)'; 
            case 'annual':
                 return '(per Month)'; 
            default:
                return '';
        }
    };

    const handleNavigateToImport = () => {
        navigate('/import', { state: { formType: 'diet' } });
    };

    const handleDeleteEntry = async (entryId) => {
        try {
            const response = await fetch(`/api/entries/diet/${entryId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                 fetchData();
                 // setDietData(prevData => prevData.filter(entry => entry.entry_id !== entryId));
                 // processDietData(dietData.filter(entry => entry.entry_id !== entryId)); // Re-process filtered data

                setNotification({
                    show: true,
                    message: 'Diet entry deleted successfully',
                    type: 'success'
                });
            } else {
                const errorData = await response.json();
                setNotification({
                    show: true,
                    message: errorData.error || 'Failed to delete entry',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error("Error deleting entry:", error);
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

     const getXAxisDataKey = () => {
        switch(activeTimeTab) {
            case 'daily': return 'displayDate'; 
            case 'weekly': return 'displayWeek'; 
            case 'monthly': return 'displayMonth'; 
            case 'annual': return 'displayMonth'; 
            default: return 'date';
        }
     };


    return (
        <>
            <SideBar />
            <div className="diet-container">
                {notification.show && (
                    <div className={`notification ${notification.type}`}>
                        {notification.message}
                    </div>
                )}
                <div className="diet-header">
                    <h1 className="diet-title">Diet Overview</h1>
                    <button className="add-diet-button" onClick={handleNavigateToImport}>
                        + Add Diet Entry
                    </button>
                </div>

                <div className="diet-main-tabs">
                    <div
                        ref={overviewTabRef}
                        className={`diet-main-tab ${activeMainTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveMainTab('overview')}
                    >
                        Overview
                    </div>
                    <div
                        ref={pastLogTabRef}
                        className={`diet-main-tab ${activeMainTab === 'pastLog' ? 'active' : ''}`}
                        onClick={() => setActiveMainTab('pastLog')}
                    >
                        Past Log
                    </div>
                    <div className="tab-indicator" style={indicatorStyle}></div>
                </div>

                {activeMainTab === 'overview' && (
                    <div className="diet-overview-content">
                        <div className="diet-chart-container">
                            <div className="diet-chart">
                                <ResponsiveContainer width="100%" height={300}>
                                    {processedData[activeTimeTab] && processedData[activeTimeTab].length > 0 ? (
                                        <LineChart data={processedData[activeTimeTab]} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                                            <XAxis
                                                dataKey={getXAxisDataKey()}
                                                tick={{ fontSize: 10 }} 
                                                interval={0} 
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="calories" name="Calories" stroke="#007bff" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}/>
                                            {/* <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#82ca9d" strokeWidth={1} dot={false} /> */}
                                            {/* <Line type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#ffc658" strokeWidth={1} dot={false} /> */}
                                            {/* <Line type="monotone" dataKey="fats" name="Fats (g)" stroke="#ff8042" strokeWidth={1} dot={false} /> */}
                                        </LineChart>
                                    ) : (
                                        <div className="no-data-message">No data available for the selected period.</div>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            <div className="diet-time-tabs">
                                <button onClick={() => setActiveTimeTab('daily')} className={activeTimeTab === 'daily' ? 'active' : ''}>Daily</button>
                                <button onClick={() => setActiveTimeTab('weekly')} className={activeTimeTab === 'weekly' ? 'active' : ''}>Weekly</button>
                                <button onClick={() => setActiveTimeTab('monthly')} className={activeTimeTab === 'monthly' ? 'active' : ''}>Monthly</button>
                                <button onClick={() => setActiveTimeTab('annual')} className={activeTimeTab === 'annual' ? 'active' : ''}>Annual</button>
                            </div>
                        </div>

                        <div className="diet-summary">
                            <h2>Summary ({activeTimeTab.charAt(0).toUpperCase() + activeTimeTab.slice(1)})</h2>
                            <table className="diet-summary-table">
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>Total</th>
                                        {summaryData.periodCount > 0 && <th>Average {getTimePeriodLabel()}</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>Calories</strong></td>
                                        <td>{Math.round(summaryData.totalCalories)}</td>
                                        {summaryData.periodCount > 0 && <td>{Number(summaryData.avgCalories).toFixed(1)}</td>}
                                    </tr>
                                    <tr>
                                        <td><strong>Protein (g)</strong></td>
                                        <td>{Math.round(summaryData.totalProtein)}</td>
                                         {summaryData.periodCount > 0 && <td>{Number(summaryData.avgProtein).toFixed(1)}</td>}
                                    </tr>
                                    <tr>
                                        <td><strong>Carbs (g)</strong></td>
                                        <td>{Math.round(summaryData.totalCarbs)}</td>
                                         {summaryData.periodCount > 0 && <td>{Number(summaryData.avgCarbs).toFixed(1)}</td>}
                                    </tr>
                                    <tr>
                                        <td><strong>Fats (g)</strong></td>
                                        <td>{Math.round(summaryData.totalFats)}</td>
                                         {summaryData.periodCount > 0 && <td>{Number(summaryData.avgFats).toFixed(1)}</td>}
                                    </tr>
                                </tbody>
                            </table>
                             {summaryData.periodCount === 0 && <p>No summary data available.</p>}
                        </div>
                    </div>
                )}

                {activeMainTab === 'pastLog' && (
                    <PastDiet pastData={dietData} handleDeleteEntry={handleDeleteEntry} />
                )}
            </div>
        </>
    );
}

function PastDiet({ pastData, handleDeleteEntry }) {
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
                    moment(entry.entry_time_obj).isBetween(weekStart, weekEnd, null, '[]') // inclusive
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
             } else if (type === 'number') { 
                 newDate = moment().year(parseInt(value, 10)).startOf('year').toDate();
             }
        } catch (error) {
             console.error("Error parsing date input:", error);
             newDate = new Date(selectedDate);
        }

        setSelectedDate(newDate);
    };


    const handleCalendarDateChange = (newDate) => {
        setSelectedDate(newDate);
        if (periodFilter !== 'daily') {
           // setPeriodFilter('daily'); 
        }
        setShowCalendar(false); 
    };

    const toggleCalendar = () => {
        setShowCalendar(prev => !prev);
    };

    const getDatePickerProps = () => {
        const mDate = moment(selectedDate);
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

        return dataExists ? <div className="diet-calendar-dot"></div> : null;
    };


    return (
        <div className="diet-card">
            <h3>Past Diet Entries</h3>

            <div className="log-filter-container">
                <div className="period-filter">
                    {['daily', 'weekly', 'monthly', 'annual', 'all'].map(period => (
                        <div
                            key={period}
                            className={`period-option ${periodFilter === period ? 'active' : ''} diet-period`}
                            onClick={() => setPeriodFilter(period)}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </div>
                    ))}
                </div>

                <div className="diet-calendar-controls">
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
                    <div className="diet-calendar-container">
                        <Calendar
                            onChange={handleCalendarDateChange}
                            value={selectedDate}
                            tileContent={tileContent}
                            className="diet-calendar"
                            maxDate={new Date()} 
                        />
                    </div>
                )}
            </div>

            {filteredData.length === 0 ? (
                <p>No diet entries found for the selected period.</p>
            ) : (
                <div className="diet-table-container">
                    <table className="diet-table">
                        <thead>
                            <tr>
                                <th>Meal Type</th>
                                <th>Calories</th>
                                <th>Protein (g)</th>
                                <th>Carbs (g)</th>
                                <th>Fats (g)</th>
                                <th>Date</th>
                                <th>Time</th> 
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((entry) => (
                                <tr key={entry.entry_id}> 
                                    <td>{entry.meal_type || 'N/A'}</td>
                                    <td>{entry.calories || 0}</td>
                                    <td>{entry.protein_g || 0}</td>
                                    <td>{entry.carbs_g || 0}</td>
                                    <td>{entry.fats_g || 0}</td>
                                    <td>{entry.entry_time_obj ? entry.entry_time_obj.toLocaleDateString() : 'Invalid Date'}</td>
                                     <td>{entry.entry_time_obj ? entry.entry_time_obj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteEntry(entry.entry_id)}
                                            className="delete-button"
                                            aria-label={`Delete entry from ${entry.entry_time_obj ? entry.entry_time_obj.toLocaleString() : 'invalid date'}`}
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

export default Diet;