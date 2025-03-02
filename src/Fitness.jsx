import React, { useState, useEffect } from 'react';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Fitness.css';

function Fitness() {
    const [activeTab, setActiveTab] = useState('daily');
    const [fitnessData, setFitnessData] = useState([]);
    const [processedData, setProcessedData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        annual: [],
    });
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
        updateSummaryData(processedData[activeTab]);
    }, [activeTab, processedData]);    

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
    
        const dailyStats = {
            date: now.toISOString().split('T')[0],
            minutes: 0,
            steps: 0,
            calories: 0,
        };
    
        filteredDailyData.forEach(entry => {
            dailyStats.minutes += Number(entry.duration_min) || 0;
            dailyStats.steps += Number(entry.steps) || 0;
            dailyStats.calories += Number(entry.calories_burned) || 0;
        });
    
        const weeklyStats = {};
        filteredWeeklyData.forEach(entry => {
            const weekKey = `${new Date(entry.entry_time).getFullYear()}-W${getWeekNumber(new Date(entry.entry_time))}`;
            if (!weeklyStats[weekKey]) {
                weeklyStats[weekKey] = { week: weekKey, minutes: 0, steps: 0, calories: 0 };
            }
            weeklyStats[weekKey].minutes += Number(entry.duration_min) || 0;
            weeklyStats[weekKey].steps += Number(entry.steps) || 0;
            weeklyStats[weekKey].calories += Number(entry.calories_burned) || 0;
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
            daily: [dailyStats],
            weekly: Object.values(weeklyStats),
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

    return (
        <>
            <SideBar />
            <div className="fitness-container">
                <h1 className="dashboard-title">Fitness Overview</h1>

                <div className="fitness-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={processedData[activeTab]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={activeTab === 'daily' ? 'date' : activeTab === 'weekly' ? 'week' : activeTab === 'monthly' ? 'month' : 'year'} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="minutes" stroke="#ff5733" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="fitness-tabs">
                    <button onClick={() => setActiveTab('daily')} className={activeTab === 'daily' ? 'active' : ''}>Daily</button>
                    <button onClick={() => setActiveTab('weekly')} className={activeTab === 'weekly' ? 'active' : ''}>Weekly</button>
                    <button onClick={() => setActiveTab('monthly')} className={activeTab === 'monthly' ? 'active' : ''}>Monthly</button>
                    <button onClick={() => setActiveTab('annual')} className={activeTab === 'annual' ? 'active' : ''}>Annual</button>
                    <button onClick={() => setActiveTab('past')} className={activeTab === 'past' ? 'active' : ''}>Past Data</button>
                </div>

                 {activeTab !== 'past' && (
                    <div className="fitness-summary">
                        <h2>Summary ({activeTab.charAt(0).toUpperCase() + activeTab.slice(1)})</h2>
                        <p><strong>Total Exercise Time:</strong> {summaryData.totalMinutes} min</p>
                        {activeTab !== 'daily' && <p><strong>Average Exercise Time Per {activeTab === 'weekly' ? 'Day' : activeTab === 'monthly' ? 'Month' : 'Year'}:</strong> {Number(summaryData.avgMinutes).toFixed(2)} min</p>}
                        <p><strong>Total Steps:</strong> {summaryData.totalSteps}</p>
                        {activeTab !== 'daily' && <p><strong>Average Steps Per {activeTab === 'weekly' ? 'Day' : activeTab === 'monthly' ? 'Month' : 'Year'}:</strong> {Number(summaryData.avgSteps).toFixed(2)}</p>}
                        <p><strong>Total Calories Burned:</strong> {summaryData.totalCalories}</p>
                        {activeTab !== 'daily' && <p><strong>Average Calories Burned Per {activeTab === 'weekly' ? 'Day' : activeTab === 'monthly' ? 'Month' : 'Year'}:</strong> {Number(summaryData.avgCalories).toFixed(2)}</p>}
                    </div>
                 )}


                <div className="fitness-content">
                    {activeTab === 'past' && <PastFitness pastData={fitnessData} />}
                </div>
            </div>
        </>
    );
}

function PastFitness({ pastData }) {
    return (
        <div className="fitness-card">
            <h3>Past Fitness Entries</h3>
            {pastData.length === 0 ? (
                <p>No past fitness entries found.</p>
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
                        {pastData.map((entry, index) => (
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
