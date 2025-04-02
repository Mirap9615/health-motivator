import React, { useState, useEffect, useRef } from 'react';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Fitness.css';

function Fitness() {
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
        totalMinutes: 0,
        avgMinutes: 0,
        totalSteps: 0,
        avgSteps: 0,
        totalCalories: 0,
        avgCalories: 0,
    });    

    useEffect(() => {
        fetch("/api/entries/fitness/past", { method: "GET", credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                setFitnessData(data);
                processFitnessData(data);
            })
            .catch((error) => console.error("Error fetching past data:", error));
    }, []);

    useEffect(() => {
        // Update the sliding indicator position when the active tab changes
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
    }, [activeMainTab]);

    useEffect(() => {
        updateSummaryData(processedData[activeTimeTab]);
    }, [activeTimeTab, processedData]);    

    const processFitnessData = (data) => {
        if (!data.length) return;
    
        const now = new Date();
        const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const past31Days = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
        const past365Days = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
        const filteredDailyData = data.filter(entry => {
            const entryDate = new Date(entry.entry_time);
            return entryDate >= past24Hours && entryDate <= now;
        });
    
        const filteredWeeklyData = data.filter(entry => {
            const entryDate = new Date(entry.entry_time);
            return entryDate >= past7Days && entryDate <= now;
        });
    
        const filteredMonthlyData = data.filter(entry => {
            const entryDate = new Date(entry.entry_time);
            return entryDate >= past31Days && entryDate <= now;
        });
    
        const filteredAnnualData = data.filter(entry => {
            const entryDate = new Date(entry.entry_time);
            return entryDate >= past365Days && entryDate <= now;
        });
    
        const pastNDays = 7;
        const dailyGraphData = [];

        for (let i = pastNDays - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            dailyGraphData.push({ date: dateKey, minutes: 0, steps: 0, calories: 0 });
        }

        filteredDailyData.forEach(entry => {
            const entryDate = new Date(entry.entry_time).toISOString().split('T')[0];
            const foundEntry = dailyGraphData.find(d => d.date === entryDate);

            if (foundEntry) {
                foundEntry.minutes += Number(entry.duration_min) || 0;
                foundEntry.steps += Number(entry.steps) || 0;
                foundEntry.calories += Number(entry.calories_burned) || 0;
            }
        });

        const pastNWeeks = 7;
        const weeklyGraphData = [];

        for (let i = pastNWeeks - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i * 7); 
            const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;

            weeklyGraphData.push({ week: weekKey, minutes: 0, steps: 0, calories: 0 });
        }

        filteredWeeklyData.forEach(entry => {
            const date = new Date(entry.entry_time);
            const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
            const foundEntry = weeklyGraphData.find(d => d.week === weekKey);

            if (foundEntry) {
                foundEntry.minutes += Number(entry.duration_min) || 0;
                foundEntry.steps += Number(entry.steps) || 0;
                foundEntry.calories += Number(entry.calories_burned) || 0;
            }
        });

        const monthlyStats = {};
        filteredMonthlyData.forEach(entry => {
            const monthKey = `${new Date(entry.entry_time).getFullYear()}-${new Date(entry.entry_time).getMonth() + 1}`;
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { month: monthKey, minutes: 0, steps: 0, calories: 0 };
            }
            monthlyStats[monthKey].minutes += Number(entry.duration_min) || 0;
            monthlyStats[monthKey].steps += Number(entry.steps) || 0;
            monthlyStats[monthKey].calories += Number(entry.calories_burned) || 0;
        });
    
        const annualStats = {};
        filteredAnnualData.forEach(entry => {
            const yearKey = `${new Date(entry.entry_time).getFullYear()}`;
            if (!annualStats[yearKey]) {
                annualStats[yearKey] = { year: yearKey, minutes: 0, steps: 0, calories: 0 };
            }
            annualStats[yearKey].minutes += Number(entry.duration_min) || 0;
            annualStats[yearKey].steps += Number(entry.steps) || 0;
            annualStats[yearKey].calories += Number(entry.calories_burned) || 0;
        });
    
        setProcessedData({
            daily: dailyGraphData,
            weekly: weeklyGraphData,
            monthly: Object.values(monthlyStats),
            annual: Object.values(annualStats),
        });
    };
    

    const updateSummaryData = (data) => {
        if (!data || data.length === 0) {
            setSummaryData({
                totalMinutes: 0,
                avgMinutes: 0,
                totalSteps: 0,
                avgSteps: 0,
                totalCalories: 0,
                avgCalories: 0,
            });
            return;
        }
    
        let totalMinutes = data.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0);
        let totalSteps = data.reduce((sum, entry) => sum + (Number(entry.steps) || 0), 0);
        let totalCalories = data.reduce((sum, entry) => sum + (Number(entry.calories) || 0), 0);
    
        let totalPeriods = data.length;
    
        setSummaryData({
            totalMinutes,
            avgMinutes: totalPeriods > 0 ? totalMinutes / totalPeriods : 0,
            totalSteps,
            avgSteps: totalPeriods > 0 ? totalSteps / totalPeriods : 0,
            totalCalories,
            avgCalories: totalPeriods > 0 ? totalCalories / totalPeriods : 0,
        });
    };    

    const getWeekNumber = (date) => {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    // Helper function to get time period label based on active tab
    const getTimePeriodLabel = () => {
        switch(activeTimeTab) {
            case 'weekly':
                return '(Daily)';
            case 'monthly':
                return '(Monthly)';
            case 'annual':
                return '(Annually)';
            default:
                return '';
        }
    };

    return (
        <>
            <SideBar />
            <div className="fitness-container">
                <h1 className="fitness-title">Fitness Overview</h1>

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
                                    <LineChart data={processedData[activeTimeTab]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={activeTimeTab === 'daily' ? 'date' : activeTimeTab === 'weekly' ? 'week' : activeTimeTab === 'monthly' ? 'month' : 'year'} />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="minutes" stroke="#ff5733" strokeWidth={2} dot={{ r: 4 }} />
                                    </LineChart>
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
                            
                            {activeTimeTab === 'daily' ? (
                                <table className="fitness-summary-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Exercise Time (min)</th>
                                            <th>Steps</th>
                                            <th>Calories Burned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Total</strong></td>
                                            <td>{Math.round(summaryData.totalMinutes)}</td>
                                            <td>{Math.round(summaryData.totalSteps)}</td>
                                            <td>{Math.round(summaryData.totalCalories)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <table className="fitness-summary-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Exercise Time (min)</th>
                                            <th>Steps</th>
                                            <th>Calories Burned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Total</strong></td>
                                            <td>{Math.round(summaryData.totalMinutes)}</td>
                                            <td>{Math.round(summaryData.totalSteps)}</td>
                                            <td>{Math.round(summaryData.totalCalories)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Average {getTimePeriodLabel()}</strong></td>
                                            <td>{Number(summaryData.avgMinutes).toFixed(1)}</td>
                                            <td>{Number(summaryData.avgSteps).toFixed(1)}</td>
                                            <td>{Number(summaryData.avgCalories).toFixed(1)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {activeMainTab === 'pastLog' && (
                    <PastFitness pastData={fitnessData} />
                )}
            </div>
        </>
    );
}

function PastFitness({ pastData }) {
    const [periodFilter, setPeriodFilter] = useState('all');
    const [filteredData, setFilteredData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // Filter data based on selected period and date
    useEffect(() => {
        if (!pastData.length) {
            setFilteredData([]);
            return;
        }
        
        let filtered = [...pastData];
        const now = new Date(selectedDate);
        
        // Start by sorting all data by date (newest first)
        filtered.sort((a, b) => new Date(b.entry_time) - new Date(a.entry_time));
        
        switch (periodFilter) {
            case 'daily':
                // Filter to show only entries from the selected day
                filtered = filtered.filter(entry => {
                    const entryDate = new Date(entry.entry_time);
                    return entryDate.getDate() === now.getDate() && 
                           entryDate.getMonth() === now.getMonth() && 
                           entryDate.getFullYear() === now.getFullYear();
                });
                break;
                
            case 'weekly':
                // Filter to show only entries from the selected week
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay()); // Start of the week (Sunday)
                weekStart.setHours(0, 0, 0, 0);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6); // End of the week (Saturday)
                weekEnd.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(entry => {
                    const entryDate = new Date(entry.entry_time);
                    return entryDate >= weekStart && entryDate <= weekEnd;
                });
                break;
                
            case 'monthly':
                // Filter to show only entries from the selected month
                filtered = filtered.filter(entry => {
                    const entryDate = new Date(entry.entry_time);
                    return entryDate.getMonth() === now.getMonth() && 
                           entryDate.getFullYear() === now.getFullYear();
                });
                break;
                
            case 'annual':
                // Filter to show only entries from the selected year
                filtered = filtered.filter(entry => {
                    const entryDate = new Date(entry.entry_time);
                    return entryDate.getFullYear() === now.getFullYear();
                });
                break;
                
            case 'all':
            default:
                // No additional filtering needed
                break;
        }
        
        setFilteredData(filtered);
    }, [pastData, periodFilter, selectedDate]);
    
    // Handle date selection change
    const handleDateChange = (e) => {
        setSelectedDate(new Date(e.target.value));
    };
    
    // Get appropriate date input type and value based on period filter
    const getDatePickerProps = () => {
        const dateValue = selectedDate.toISOString().split('T')[0];
        
        switch (periodFilter) {
            case 'daily':
                return { type: 'date', value: dateValue };
            case 'weekly':
                return { type: 'week', value: `${selectedDate.getFullYear()}-W${getWeekNumber(selectedDate)}` };
            case 'monthly':
                return { type: 'month', value: `${dateValue.substring(0, 7)}` };
            case 'annual':
                return { type: 'number', value: selectedDate.getFullYear(), min: 2000, max: 2100 };
            default:
                return { type: 'date', value: dateValue };
        }
    };
    
    // Get week number for a date
    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };
    
    // Get appropriate no data message based on the selected period
    const getNoDataMessage = () => {
        const date = new Date(selectedDate);
        
        switch (periodFilter) {
            case 'daily':
                return `No fitness entries found for ${date.toLocaleDateString()}.`;
                
            case 'weekly':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return `No fitness entries found for the week of ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}.`;
                
            case 'monthly':
                return `No fitness entries found for ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`;
                
            case 'annual':
                return `No fitness entries found for ${date.getFullYear()}.`;
                
            case 'all':
            default:
                return "No fitness entries found in your history.";
        }
    };

    return (
        <div className="fitness-card">
            <h3>Past Fitness Entries</h3>
            
            <div className="log-filter-container">
                <div className="period-filter">
                    <div 
                        className={`period-option ${periodFilter === 'daily' ? 'active' : ''} fitness-period`}
                        onClick={() => setPeriodFilter('daily')}
                    >
                        Daily
                    </div>
                    <div 
                        className={`period-option ${periodFilter === 'weekly' ? 'active' : ''} fitness-period`}
                        onClick={() => setPeriodFilter('weekly')}
                    >
                        Weekly
                    </div>
                    <div 
                        className={`period-option ${periodFilter === 'monthly' ? 'active' : ''} fitness-period`}
                        onClick={() => setPeriodFilter('monthly')}
                    >
                        Monthly
                    </div>
                    <div 
                        className={`period-option ${periodFilter === 'annual' ? 'active' : ''} fitness-period`}
                        onClick={() => setPeriodFilter('annual')}
                    >
                        Annual
                    </div>
                    <div 
                        className={`period-option ${periodFilter === 'all' ? 'active' : ''} fitness-period`}
                        onClick={() => setPeriodFilter('all')}
                    >
                        All
                    </div>
                </div>
                
                {periodFilter !== 'all' && (
                    <div className="date-selector">
                        <label>Select {periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1)}:</label>
                        <input 
                            type={getDatePickerProps().type}
                            value={getDatePickerProps().value}
                            min={getDatePickerProps().min}
                            max={getDatePickerProps().max}
                            onChange={handleDateChange}
                        />
                    </div>
                )}
            </div>
            
            {filteredData.length === 0 ? (
                <div className="no-data-message">
                    <p>{getNoDataMessage()}</p>
                </div>
            ) : (
                <table className="fitness-table">
                    <thead>
                        <tr>
                            <th>Exercise Type</th>
                            <th>Duration (min)</th>
                            <th>Calories Burned</th>
                            <th>Steps</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((entry, index) => (
                            <tr key={index}>
                                <td>{entry.exercise_type}</td>
                                <td>{entry.duration_min}</td>
                                <td>{entry.calories_burned || "N/A"}</td>
                                <td>{entry.steps || "N/A"}</td>
                                <td>{new Date(entry.entry_time).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Fitness;
