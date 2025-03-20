import React, { useState, useEffect } from 'react';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Diet.css';

function Diet() {
    const [activeTab, setActiveTab] = useState('daily');
    const [dietData, setDietData] = useState([]);
    const [processedData, setProcessedData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        annual: [],
    });

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
        updateSummaryData(processedData[activeTab]);
    }, [activeTab, processedData]);    

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
    
        // DAILY
        const pastNDays = 7; 
        const dailyGraphData = {};

        for (let i = 0; i < pastNDays; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            dailyGraphData[dateKey] = { date: dateKey, calories: 0, protein: 0, carbs: 0, fats: 0 };
        }

        data.forEach(entry => {
            const entryDate = new Date(entry.entry_time).toISOString().split('T')[0];
            if (dailyGraphData[entryDate]) {
                dailyGraphData[entryDate].calories += Number(entry.calories) || 0;
                dailyGraphData[entryDate].protein += Number(entry.protein_g) || 0;
                dailyGraphData[entryDate].carbs += Number(entry.carbs_g) || 0;
                dailyGraphData[entryDate].fats += Number(entry.fats_g) || 0;
            }
        });

        const sortedDailyGraphData = Object.values(dailyGraphData).sort((a, b) => a.date.localeCompare(b.date));
    
        const pastNWeeks = 7;
        const weeklyGraphData = [];

        for (let i = pastNWeeks - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i * 7);  
            const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;

            weeklyGraphData.push({ week: weekKey, calories: 0, protein: 0, carbs: 0, fats: 0 });
        }

        filteredWeeklyData.forEach(entry => {
            const date = new Date(entry.entry_time);
            const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
            const foundEntry = weeklyGraphData.find(d => d.week === weekKey);

            if (foundEntry) {
                foundEntry.calories += Number(entry.calories) || 0;
                foundEntry.protein += Number(entry.protein_g) || 0;
                foundEntry.carbs += Number(entry.carbs_g) || 0;
                foundEntry.fats += Number(entry.fats_g) || 0;
            }
        });
    
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
            daily: sortedDailyGraphData,
            weekly: weeklyGraphData,
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

    return (
        <>
            <SideBar />
            <div className="diet-container">
                <h1 className="dashboard-title">Diet Overview</h1>

                <div className="diet-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={processedData[activeTab]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={activeTab === 'daily' ? 'date' : activeTab === 'weekly' ? 'week' : activeTab === 'monthly' ? 'month' : 'year'} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="calories" stroke="#007bff" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="diet-tabs">
                    <button onClick={() => setActiveTab('daily')} className={activeTab === 'daily' ? 'active' : ''}>Daily</button>
                    <button onClick={() => setActiveTab('weekly')} className={activeTab === 'weekly' ? 'active' : ''}>Weekly</button>
                    <button onClick={() => setActiveTab('monthly')} className={activeTab === 'monthly' ? 'active' : ''}>Monthly</button>
                    <button onClick={() => setActiveTab('annual')} className={activeTab === 'annual' ? 'active' : ''}>Annual</button>
                    <button onClick={() => setActiveTab('past')} className={activeTab === 'past' ? 'active' : ''}>Past Data</button>
                </div>

                {activeTab !== 'past' && (
                <div className="diet-summary">
                <h2>Summary ({activeTab.charAt(0).toUpperCase() + activeTab.slice(1)})</h2>
                <p><strong>Total Calories:</strong> {summaryData.totalCalories}</p>
                {activeTab !== 'daily' && <p><strong>Average Calories Per {activeTab === 'weekly' ? 'Day' : activeTab === 'monthly' ? 'Month' : 'Year'}:</strong> {Number(summaryData.avgCalories).toFixed(2)}</p>}
                <p><strong>Total Protein:</strong> {summaryData.totalProtein}g</p>
                {activeTab !== 'daily' && <p><strong>Average Protein Per {activeTab === 'weekly' ? 'Day' : activeTab === 'monthly' ? 'Month' : 'Year'}:</strong> {Number(summaryData.avgProtein).toFixed(2)}g</p>}
                <p><strong>Total Carbs:</strong> {summaryData.totalCarbs}g</p>
                {activeTab !== 'daily' && <p><strong>Average Carbs Per {activeTab === 'weekly' ? 'Day' : activeTab === 'monthly' ? 'Month' : 'Year'}:</strong> {Number(summaryData.avgCarbs).toFixed(2)}g</p>}
                <p><strong>Total Fats:</strong> {summaryData.totalFats}g</p>
                {activeTab !== 'daily' && <p><strong>Average Fats Per {activeTab === 'weekly' ? 'Day' : activeTab === 'monthly' ? 'Month' : 'Year'}:</strong> {Number(summaryData.avgFats).toFixed(2)}g</p>}
            </div>            
                )}

                <div className="diet-content">
                    {activeTab === 'past' && <PastDiet pastData={dietData} />}
                </div>
            </div>
        </>
    );
}

function PastDiet({ pastData }) {
    return (
        <div className="diet-card">
            <h3>Past Diet Entries</h3>
            {pastData.length === 0 ? (
                <p>No past diet entries found.</p>
            ) : (
                <table className="diet-table">
                    <thead>
                        <tr>
                            <th>Meal Type</th>
                            <th>Calories</th>
                            <th>Protein (g)</th>
                            <th>Carbs (g)</th>
                            <th>Fats (g)</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pastData.map((entry, index) => (
                            <tr key={index}>
                                <td>{entry.meal_type}</td>
                                <td>{entry.calories}</td>
                                <td>{entry.protein_g}</td>
                                <td>{entry.carbs_g}</td>
                                <td>{entry.fats_g}</td>
                                <td>{new Date(entry.entry_time).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Diet;
