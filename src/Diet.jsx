import React, { useState } from 'react';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Diet.css';

function Diet() {
    const [activeTab, setActiveTab] = useState('daily');

    // Placeholder Data for Different Time Periods
    const data = {
        daily: [
            { date: '6AM', calories: 250 },
            { date: '9AM', calories: 400 },
            { date: '12PM', calories: 700 },
            { date: '3PM', calories: 1000 },
            { date: '6PM', calories: 1500 },
            { date: '9PM', calories: 1800 }
        ],
        weekly: [
            { date: 'Mon', calories: 1800 },
            { date: 'Tue', calories: 1900 },
            { date: 'Wed', calories: 2200 },
            { date: 'Thu', calories: 2000 },
            { date: 'Fri', calories: 1750 },
            { date: 'Sat', calories: 1600 },
            { date: 'Sun', calories: 1950 }
        ],
        monthly: [
            { date: 'Week 1', calories: 1850 },
            { date: 'Week 2', calories: 1900 },
            { date: 'Week 3', calories: 2000 },
            { date: 'Week 4', calories: 1750 }
        ],
        annual: [
            { date: 'Jan', calories: 1950 },
            { date: 'Feb', calories: 1850 },
            { date: 'Mar', calories: 2000 },
            { date: 'Apr', calories: 2100 },
            { date: 'May', calories: 1900 },
            { date: 'Jun', calories: 1800 },
            { date: 'Jul', calories: 1700 },
            { date: 'Aug', calories: 1850 },
            { date: 'Sep', calories: 1950 },
            { date: 'Oct', calories: 2050 },
            { date: 'Nov', calories: 2150 },
            { date: 'Dec', calories: 2200 }
        ]
    };

    return (
        <>
            <SideBar />
            <div className="diet-container">
                <h1 className="diet-title">Diet Overview</h1>

                {/* 📈 Dynamic Line Chart */}
                <div className="diet-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data[activeTab]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="calories" stroke="#007bff" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Custom Tabs System */}
                <div className="diet-tabs">
                    <button onClick={() => setActiveTab('daily')} className={activeTab === 'daily' ? 'active' : ''}>Daily</button>
                    <button onClick={() => setActiveTab('weekly')} className={activeTab === 'weekly' ? 'active' : ''}>Weekly</button>
                    <button onClick={() => setActiveTab('monthly')} className={activeTab === 'monthly' ? 'active' : ''}>Monthly</button>
                    <button onClick={() => setActiveTab('annual')} className={activeTab === 'annual' ? 'active' : ''}>Annual</button>
                </div>

                {/* Display Active Tab Data */}
                <div className="diet-content">
                    {activeTab === 'daily' && <DailyDiet />}
                    {activeTab === 'weekly' && <WeeklyDiet />}
                    {activeTab === 'monthly' && <MonthlyDiet />}
                    {activeTab === 'annual' && <AnnualDiet />}
                </div>
            </div>
        </>
    );
}

function DailyDiet() {
    return (
        <div className="diet-card">
            <h3>Daily Intake</h3>
            <p>Total Calories: <strong>1,800 kcal</strong></p>
            <p>Protein: <strong>120g</strong></p>
            <p>Carbs: <strong>200g</strong></p>
            <p>Fats: <strong>50g</strong></p>
        </div>
    );
}

function WeeklyDiet() {
    return (
        <div className="diet-card">
            <h3>Weekly Trend</h3>
            <p>Avg Calories per Day: <strong>1,900 kcal</strong></p>
            <p>Highest Intake: <strong>2,200 kcal</strong> (Wednesday)</p>
            <p>Lowest Intake: <strong>1,600 kcal</strong> (Saturday)</p>
        </div>
    );
}

function MonthlyDiet() {
    return (
        <div className="diet-card">
            <h3>Monthly Trend</h3>
            <p>Avg Calories per Day: <strong>1,850 kcal</strong></p>
            <p>Most Consumed Food: <strong>Chicken Breast</strong></p>
            <p>Most Indulgent Day: <strong>Feb 14 (Valentine's Day Cake 🎂)</strong></p>
        </div>
    );
}

function AnnualDiet() {
    return (
        <div className="diet-card">
            <h3>Annual Overview</h3>
            <p>Avg Calories per Month: <strong>1,875 kcal</strong></p>
            <p>Most Healthy Month: <strong>September</strong></p>
            <p>Most Indulgent Month: <strong>December (Holidays!)</strong></p>
        </div>
    );
}

export default Diet;
