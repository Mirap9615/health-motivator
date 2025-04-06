import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Diet.css';
import Calendar from 'react-calendar';

function Diet() {
    const navigate = useNavigate();
    const [activeMainTab, setActiveMainTab] = useState('overview');
    const [activeTimeTab, setActiveTimeTab] = useState('daily');
    const [dietData, setDietData] = useState([]);
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
        totalCalories: 0,
        avgCalories: 0,
        totalProtein: 0,
        avgProtein: 0,
        totalCarbs: 0,
        avgCarbs: 0,
        totalFats: 0,
        avgFats: 0,
    });    

    useEffect(() => {
        fetch("/api/entries/diet/past", { method: "GET", credentials: "include" })
            .then((res) => res.json())
            .then((data) => {
                setDietData(data);
                processDietData(data);
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

    const processDietData = (data) => {
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
    
        // DAILY (24 hours)
        const dailyGraphData = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const hourlyData = {};

        // Initialize hourly slots for the past 24 hours
        for (let i = 0; i < 24; i++) {
            const hour = new Date(now);
            hour.setHours(now.getHours() - i);
            const hourKey = hour.toISOString().split(':')[0] + ':00';
            hourlyData[hourKey] = { 
                time: hourKey,
                calories: 0, 
                protein: 0, 
                carbs: 0, 
                fats: 0 
            };
        }

        // Process last 24 hours data
        filteredDailyData.forEach(entry => {
            const entryDate = new Date(entry.entry_time);
            const hourKey = entryDate.toISOString().split(':')[0] + ':00';
            
            if (hourlyData[hourKey]) {
                hourlyData[hourKey].calories += Number(entry.calories) || 0;
                hourlyData[hourKey].protein += Number(entry.protein_g) || 0;
                hourlyData[hourKey].carbs += Number(entry.carbs_g) || 0;
                hourlyData[hourKey].fats += Number(entry.fats_g) || 0;
            }
        });

        const sortedHourlyData = Object.values(hourlyData).sort((a, b) => 
            new Date(a.time) - new Date(b.time)
        );

        // WEEKLY (7 days)
        const weeklyGraphData = {};
        
        // Initialize the past 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            
            weeklyGraphData[dateKey] = { 
                date: dateKey, 
                calories: 0, 
                protein: 0, 
                carbs: 0, 
                fats: 0 
            };
        }

        // Process weekly data
        filteredWeeklyData.forEach(entry => {
            const entryDate = new Date(entry.entry_time).toISOString().split('T')[0];
            if (weeklyGraphData[entryDate]) {
                weeklyGraphData[entryDate].calories += Number(entry.calories) || 0;
                weeklyGraphData[entryDate].protein += Number(entry.protein_g) || 0;
                weeklyGraphData[entryDate].carbs += Number(entry.carbs_g) || 0;
                weeklyGraphData[entryDate].fats += Number(entry.fats_g) || 0;
            }
        });

        const sortedWeeklyData = Object.values(weeklyGraphData)
            .sort((a, b) => a.date.localeCompare(b.date));
    
        // MONTHLY
        const monthlyStats = {};
        filteredMonthlyData.forEach(entry => {
            const date = new Date(entry.entry_time);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { month: monthKey, calories: 0, protein: 0, carbs: 0, fats: 0 };
            }
    
            monthlyStats[monthKey].calories += Number(entry.calories) || 0;
            monthlyStats[monthKey].protein += Number(entry.protein_g) || 0;
            monthlyStats[monthKey].carbs += Number(entry.carbs_g) || 0;
            monthlyStats[monthKey].fats += Number(entry.fats_g) || 0;
        });
    
        // ANNUAL
        const annualStats = {};
        filteredAnnualData.forEach(entry => {
            const date = new Date(entry.entry_time);
            const yearKey = `${date.getFullYear()}`;
    
            if (!annualStats[yearKey]) {
                annualStats[yearKey] = { year: yearKey, calories: 0, protein: 0, carbs: 0, fats: 0 };
            }
    
            annualStats[yearKey].calories += Number(entry.calories) || 0;
            annualStats[yearKey].protein += Number(entry.protein_g) || 0;
            annualStats[yearKey].carbs += Number(entry.carbs_g) || 0;
            annualStats[yearKey].fats += Number(entry.fats_g) || 0;
        });
    
        setProcessedData({
            daily: sortedHourlyData,
            weekly: sortedWeeklyData,
            monthly: Object.values(monthlyStats),
            annual: Object.values(annualStats),
        });
    };    

    const updateSummaryData = (data) => {
        if (!data || data.length === 0) {
            setSummaryData({
                totalCalories: 0,
                avgCalories: 0,
                totalProtein: 0,
                avgProtein: 0,
                totalCarbs: 0,
                avgCarbs: 0,
                totalFats: 0,
                avgFats: 0,
            });
            return;
        }
    
        let totalCalories = data.reduce((sum, entry) => sum + (Number(entry.calories) || 0), 0);
        let totalProtein = data.reduce((sum, entry) => sum + (Number(entry.protein) || 0), 0);
        let totalCarbs = data.reduce((sum, entry) => sum + (Number(entry.carbs) || 0), 0);
        let totalFats = data.reduce((sum, entry) => sum + (Number(entry.fats) || 0), 0);
    
        let totalPeriods = data.length; 
    
        setSummaryData({
            totalCalories,
            avgCalories: totalPeriods > 0 ? totalCalories / totalPeriods : 0,
            totalProtein,
            avgProtein: totalPeriods > 0 ? totalProtein / totalPeriods : 0,
            totalCarbs,
            avgCarbs: totalPeriods > 0 ? totalCarbs / totalPeriods : 0,
            totalFats,
            avgFats: totalPeriods > 0 ? totalFats / totalPeriods : 0,
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

    const handleNavigateToImport = () => {
        navigate('/import', { state: { formType: 'diet' } });
    };

    const handleDeleteEntry = (entryId) => {
        console.log(`Attempting to delete entry with ID: ${entryId}`);
        fetch(`/api/entries/diet/${entryId}`, { method: 'DELETE', credentials: 'include' })
            .then((response) => {
                if (response.ok) {
                    setDietData((prevData) => prevData.filter(entry => entry.id !== entryId));
                    console.log(`Entry with ID: ${entryId} deleted successfully.`);
                } else {
                    console.error("Error deleting entry:", response.statusText);
                    alert("Failed to delete entry. Please try again.");
                }
            })
            .catch((error) => {
                console.error("Error deleting entry:", error);
                alert("An error occurred while trying to delete the entry.");
            });
    };

    return (
        <>
            <SideBar />
            <div className="diet-container">
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
                                    <LineChart data={processedData[activeTimeTab]}>
                            <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={activeTimeTab === 'daily' ? 'time' : activeTimeTab === 'weekly' ? 'date' : activeTimeTab === 'monthly' ? 'month' : 'year'} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="calories" stroke="#007bff" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
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
                            
                            {activeTimeTab === 'daily' ? (
                                <table className="diet-summary-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Calories</th>
                                            <th>Protein (g)</th>
                                            <th>Carbs (g)</th>
                                            <th>Fats (g)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Total</strong></td>
                                            <td>{Math.round(summaryData.totalCalories)}</td>
                                            <td>{Math.round(summaryData.totalProtein)}</td>
                                            <td>{Math.round(summaryData.totalCarbs)}</td>
                                            <td>{Math.round(summaryData.totalFats)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <table className="diet-summary-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Calories</th>
                                            <th>Protein (g)</th>
                                            <th>Carbs (g)</th>
                                            <th>Fats (g)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Total</strong></td>
                                            <td>{Math.round(summaryData.totalCalories)}</td>
                                            <td>{Math.round(summaryData.totalProtein)}</td>
                                            <td>{Math.round(summaryData.totalCarbs)}</td>
                                            <td>{Math.round(summaryData.totalFats)}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Average {getTimePeriodLabel()}</strong></td>
                                            <td>{Number(summaryData.avgCalories).toFixed(1)}</td>
                                            <td>{Number(summaryData.avgProtein).toFixed(1)}</td>
                                            <td>{Number(summaryData.avgCarbs).toFixed(1)}</td>
                                            <td>{Number(summaryData.avgFats).toFixed(1)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
            </div>            
                )}

                {activeMainTab === 'pastLog' && (
                    <PastDiet pastData={dietData} />
                )}
            </div>
        </>
    );
}

function PastDiet({ pastData }) {
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showSummary, setShowSummary] = useState(false);
    const [periodFilter, setPeriodFilter] = useState('all');
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date());
    
    // Calculate macros for the filtered data
    const calculateMacros = () => {
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fats = 0;
        
        filteredData.forEach(entry => {
            calories += parseFloat(entry.calories) || 0;
            protein += parseFloat(entry.protein_g) || 0;
            carbs += parseFloat(entry.carbs_g) || 0;
            fats += parseFloat(entry.fats_g) || 0;
        });
        
        return { calories, protein, carbs, fats };
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
    
    // Handle calendar date change
    const handleCalendarChange = (date) => {
        setCalendarDate(date);
        setSelectedDate(date);
        setPeriodFilter('daily');
    };
    
    // Toggle summary visibility
    const toggleSummary = () => {
        setShowSummary(prev => !prev);
    };
    
    // Get the macros for the current filtered data
    const macros = calculateMacros();
    
    // Tile content for calendar
    const tileContent = ({ date }) => {
        const dateStr = date.toISOString().split('T')[0];
        const hasEntry = pastData.some(entry => {
            const entryDate = new Date(entry.entry_time).toISOString().split('T')[0];
            return entryDate === dateStr;
        });
        
        if (!hasEntry) return null;
        
        return (
            <div className="calendar-tile-content">
                <div className="meal-dot recorded"></div>
            </div>
        );
    };
    
    return (
        <div className="past-diet-container">
            <h3 className="past-diet-title">
                <span className="icon">📅</span>
                Past Diet Log
            </h3>

            <button 
                className="calendar-toggle-button"
                onClick={() => setShowCalendar(!showCalendar)}
            >
                <svg viewBox="0 0 24 24">
                    <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                </svg>
                {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </button>

            <div className={`calendar-container ${showCalendar ? 'visible' : ''}`}>
                <Calendar
                    onChange={handleCalendarChange}
                    value={selectedDate}
                    tileContent={tileContent}
                />
            </div>

            <div className="period-filter">
                <div 
                    className={`period-option ${periodFilter === 'daily' ? 'active' : ''}`}
                    onClick={() => setPeriodFilter('daily')}
                >
                    Daily
                </div>
                <div 
                    className={`period-option ${periodFilter === 'weekly' ? 'active' : ''}`}
                    onClick={() => setPeriodFilter('weekly')}
                >
                    Weekly
                </div>
                <div 
                    className={`period-option ${periodFilter === 'monthly' ? 'active' : ''}`}
                    onClick={() => setPeriodFilter('monthly')}
                >
                    Monthly
                </div>
                <div 
                    className={`period-option ${periodFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPeriodFilter('all')}
                >
                    All
                </div>
            </div>

            <div className="past-meals-content">
                {filteredData.length === 0 ? (
                    <div className="empty-section-message">
                        <p>No diet entries found for the selected period.</p>
                        <p className="suggestion-text">Try selecting a different time period or add new entries.</p>
                    </div>
                ) : (
                    <>
                        {filteredData.map((entry, index) => (
                            <div key={index} className="meal-card" data-meal-type={entry.meal_type}>
                                <div className="meal-card-header">
                                    <h4>{entry.meal_type}</h4>
                                    <div className="meal-datetime">
                                        <span className="meal-date">
                                            {new Date(entry.entry_time).toLocaleDateString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <span className="meal-time">
                                            {new Date(entry.entry_time).toLocaleTimeString([], { 
                                                hour: '2-digit', 
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <div className="meal-card-macros">
                                    <div className="macro-item">
                                        <div className="macro-value">{entry.calories}</div>
                                        <div className="macro-label">Calories</div>
                                    </div>
                                    <div className="macro-item">
                                        <div className="macro-value">{entry.protein_g}g</div>
                                        <div className="macro-label">Protein</div>
                                    </div>
                                    <div className="macro-item">
                                        <div className="macro-value">{entry.carbs_g}g</div>
                                        <div className="macro-label">Carbs</div>
                                    </div>
                                    <div className="macro-item">
                                        <div className="macro-value">{entry.fats_g}g</div>
                                        <div className="macro-label">Fats</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            className={`summary-toggle-button ${showSummary ? 'open' : ''}`}
                            onClick={() => setShowSummary(!showSummary)}
                        >
                            {showSummary ? 'Hide Summary' : 'Show Summary'}
                            <span className="summary-stats">
                                ({filteredData.length} meals, {Math.round(macros.calories)} calories)
                            </span>
                        </button>
                        
                        {showSummary && (
                            <div className="past-diet-summary">
                                <h4>Past Diet Summary</h4>
                                <p>
                                    <span>Total Calories</span>
                                    <span>{Math.round(macros.calories)}</span>
                                </p>
                                <p>
                                    <span>Total Protein</span>
                                    <span>{Math.round(macros.protein)}g</span>
                                </p>
                                <p>
                                    <span>Total Carbs</span>
                                    <span>{Math.round(macros.carbs)}g</span>
                                </p>
                                <p>
                                    <span>Total Fats</span>
                                    <span>{Math.round(macros.fats)}g</span>
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Diet;
