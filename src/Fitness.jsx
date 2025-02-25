import React, { useState } from 'react';
import SideBar from './SideBar.jsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import './Fitness.css';

function Fitness() {
    const [activeTab, setActiveTab] = useState('daily');

    const data = {
        daily: [
            { time: '6AM', minutes: 10 },
            { time: '9AM', minutes: 30 },
            { time: '12PM', minutes: 45 },
            { time: '3PM', minutes: 20 },
            { time: '6PM', minutes: 60 },
            { time: '9PM', minutes: 30 }
        ],
        weekly: [
            { day: 'Mon', minutes: 60 },
            { day: 'Tue', minutes: 45 },
            { day: 'Wed', minutes: 30 },
            { day: 'Thu', minutes: 50 },
            { day: 'Fri', minutes: 75 },
            { day: 'Sat', minutes: 90 },
            { day: 'Sun', minutes: 20 }
        ],
        monthly: [
            { week: 'Week 1', minutes: 350 },
            { week: 'Week 2', minutes: 400 },
            { week: 'Week 3', minutes: 280 },
            { week: 'Week 4', minutes: 500 }
        ],
        annual: [
            { month: 'Jan', minutes: 1600 },
            { month: 'Feb', minutes: 1400 },
            { month: 'Mar', minutes: 1700 },
            { month: 'Apr', minutes: 1800 },
            { month: 'May', minutes: 1500 },
            { month: 'Jun', minutes: 1200 },
            { month: 'Jul', minutes: 1100 },
            { month: 'Aug', minutes: 1400 },
            { month: 'Sep', minutes: 1700 },
            { month: 'Oct', minutes: 1900 },
            { month: 'Nov', minutes: 2000 },
            { month: 'Dec', minutes: 2100 }
        ]
    };

    return (
        <>
            <SideBar />
            <div className="fitness-container">
                <h1 className="fitness-title">Fitness Overview</h1>

                <div className="fitness-chart">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data[activeTab]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={activeTab === 'daily' ? 'time' : activeTab === 'weekly' ? 'day' : activeTab === 'monthly' ? 'week' : 'month'} />
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
                </div>

                <div className="fitness-content">
                    {activeTab === 'daily' && <DailyFitness />}
                    {activeTab === 'weekly' && <WeeklyFitness />}
                    {activeTab === 'monthly' && <MonthlyFitness />}
                    {activeTab === 'annual' && <AnnualFitness />}
                </div>
            </div>
        </>
    );
}

function DailyFitness() {
    return (
        <div className="fitness-card">
            <h3>Daily Activity</h3>
            <p>Time Exercised: <strong>90 minutes</strong></p>
            <p>Exercises: <strong>Running, Strength Training</strong></p>
            <p>Meets Health Standard? <strong>✅ Yes</strong></p>
        </div>
    );
}

function WeeklyFitness() {
    return (
        <div className="fitness-card">
            <h3>Weekly Summary</h3>
            <p>Total Exercise Time: <strong>450 minutes</strong></p>
            <p>Most Frequent Workout: <strong>Jogging</strong></p>
            <p>Meets Health Standard? <strong>✅ Yes</strong></p>
        </div>
    );
}

function MonthlyFitness() {
    return (
        <div className="fitness-card">
            <h3>Monthly Summary</h3>
            <p>Total Exercise Time: <strong>1800 minutes</strong></p>
            <p>Most Active Week: <strong>Week 3</strong></p>
            <p>Meets Health Standard? <strong>✅ Yes</strong></p>
        </div>
    );
}

function AnnualFitness() {
    return (
        <div className="fitness-card">
            <h3>Annual Overview</h3>
            <p>Total Exercise Time: <strong>20,000 minutes</strong></p>
            <p>Most Active Month: <strong>October</strong></p>
            <p>Meets Health Standard? <strong>✅ Yes</strong></p>
        </div>
    );
}

export default Fitness;
