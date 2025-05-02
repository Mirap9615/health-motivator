import React, { useState, useEffect, useCallback } from "react";
import SideBar from "./SideBar.jsx";
import "./Dashboard.css";
import DashboardPie from "./DashboardPie.jsx";
import DashboardChecklist from "./DashboardChecklist.jsx";
import DashboardBar from "./DashboardBar.jsx";
import DietScore from "./DashboardDietScore.jsx";
import DashboardExerciseScore from "./DashboardExerciseScore.jsx";
import DashboardTotalScore from "./DashboardTotalScore.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

const DAILY_CALORIE_GOAL = 2500;
const WORKOUT_GOAL_MINUTES = 40;
const STEP_GOAL = 8000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const INITIAL_CHART_DATA = () => DAY_NAMES.map(day => ({ day, calories: 0 }));

const calculateDailyAverages = (entries, fields) => {
    const totals = {};
    fields.forEach(field => { totals[field] = 0; });

    if (!Array.isArray(entries) || entries.length === 0) {
        return totals;
    }

    const validEntries = entries.filter(entry => entry && typeof entry.entry_time === 'string');
    if (validEntries.length === 0) {
        return totals;
    }

    const dailyAggregates = {};
    validEntries.forEach(entry => {
        const dateKey = entry.entry_time.split("T")[0];
        if (!dailyAggregates[dateKey]) {
            dailyAggregates[dateKey] = {};
            fields.forEach(field => { dailyAggregates[dateKey][field] = 0; });
        }
        fields.forEach(field => {
            const value = (entry && typeof entry[field] === 'number') ? entry[field] : 0;
            dailyAggregates[dateKey][field] += value;
        });
    });

    const dayCount = Object.keys(dailyAggregates).length;
    if (dayCount === 0) {
        return totals;
    }

    fields.forEach(field => {
        let totalSum = 0;
        Object.values(dailyAggregates).forEach(dayData => {
            totalSum += dayData[field];
        });
        totals[field] = totalSum / dayCount;
    });

    return totals;
};

const computeHealthScore = (userStats) => {
    const stats = {
        steps: userStats?.steps ?? 0,
        duration_min: userStats?.duration_min ?? 0,
        calories: userStats?.calories ?? 0,
        protein_g: userStats?.protein_g ?? 0,
    };

    let score = 0;

    if (stats.steps >= STEP_GOAL) score += 20;
    else if (stats.steps >= STEP_GOAL * 0.75) score += 15;
    else if (stats.steps >= STEP_GOAL * 0.5) score += 10;
    else score += 5;

    if (stats.duration_min >= WORKOUT_GOAL_MINUTES) score += 20;
    else if (stats.duration_min >= WORKOUT_GOAL_MINUTES * 0.75) score += 15;
    else if (stats.duration_min >= WORKOUT_GOAL_MINUTES * 0.5) score += 10;
    else score += 5;

    if (DAILY_CALORIE_GOAL > 0 && stats.calories > 0) {
        if (stats.calories <= DAILY_CALORIE_GOAL + 100 && stats.calories >= DAILY_CALORIE_GOAL - 100) score += 20;
        else if (Math.abs(stats.calories - DAILY_CALORIE_GOAL) <= 250) score += 15;
        else score += 10;
    } else {
        score += 5;
    }

    if (stats.protein_g >= 90) score += 20;
    else if (stats.protein_g >= 75) score += 15;
    else score += 10;

    if (stats.steps >= STEP_GOAL && stats.duration_min >= WORKOUT_GOAL_MINUTES) score += 10;
    if (DAILY_CALORIE_GOAL > 0 && stats.calories > 0 && stats.calories <= DAILY_CALORIE_GOAL + 100 && stats.calories >= DAILY_CALORIE_GOAL - 100) score += 10;

    return Math.min(100, Math.max(0, Math.round(score)));
};

const processChartData = (fitnessEntries, dietEntries) => {
    const today = new Date();
    const pastWeekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        return date;
    });

    const fitnessChart = INITIAL_CHART_DATA();
    const dietChart = INITIAL_CHART_DATA();

    const isDateInPastWeek = (entryDate) => {
        return pastWeekDates.some(pastDate =>
            pastDate.getDate() === entryDate.getDate() &&
            pastDate.getMonth() === entryDate.getMonth() &&
            pastDate.getFullYear() === entryDate.getFullYear()
        );
    };

    if (Array.isArray(fitnessEntries)) {
        fitnessEntries.forEach(entry => {
            if (!entry?.entry_time) return;
            const entryDate = new Date(entry.entry_time);
            if (isNaN(entryDate.getTime())) return;

            if (isDateInPastWeek(entryDate)) {
                const dayIndex = entryDate.getDay();
                if (fitnessChart[dayIndex]) {
                    fitnessChart[dayIndex].calories += Number(entry.calories_burned) || 0;
                }
            }
        });
    }

    if (Array.isArray(dietEntries)) {
        dietEntries.forEach(entry => {
            if (!entry?.entry_time) return;
            const entryDate = new Date(entry.entry_time);
            if (isNaN(entryDate.getTime())) return;

            if (isDateInPastWeek(entryDate)) {
                const dayIndex = entryDate.getDay();
                if (dietChart[dayIndex]) {
                    dietChart[dayIndex].calories += Number(entry.calories) || 0;
                }
            }
        });
    }

    return { fitnessChart, dietChart };
};


const Dashboard = () => {
    const [userData, setUserData] = useState(null);
    const [healthScore, setHealthScore] = useState(0);
    const [dietEntries, setDietEntries] = useState([]);
    const [fitnessEntries, setFitnessEntries] = useState([]);
    const [fitnessChartData, setFitnessChartData] = useState(INITIAL_CHART_DATA);
    const [dietChartData, setDietChartData] = useState(INITIAL_CHART_DATA);
    const [activeMetricTab, setActiveMetricTab] = useState('diet');
    const [selectedPieView, setSelectedPieView] = useState('daily');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setUserData(null);
        setHealthScore(0);
        setFitnessChartData(INITIAL_CHART_DATA());
        setDietChartData(INITIAL_CHART_DATA());
        setFitnessEntries([]);
        setDietEntries([]);

        try {
            const [fitnessRes, dietRes] = await Promise.all([
                fetch("/api/entries/fitness/past", { credentials: 'include' }),
                fetch("/api/entries/diet/past", { credentials: 'include' })
            ]);

            if (!fitnessRes.ok) throw new Error(`Fitness data fetch failed: ${fitnessRes.statusText || fitnessRes.status}`);
            if (!dietRes.ok) throw new Error(`Diet data fetch failed: ${dietRes.statusText || dietRes.status}`);

            const fitnessDataResponse = await fitnessRes.json();
            const dietDataResponse = await dietRes.json();

            const safeFitnessData = Array.isArray(fitnessDataResponse) ? fitnessDataResponse : [];
            const safeDietData = Array.isArray(dietDataResponse) ? dietDataResponse : [];

            setFitnessEntries(safeFitnessData);
            setDietEntries(safeDietData);

            const fitnessSummary = calculateDailyAverages(safeFitnessData, ["steps", "duration_min", "calories_burned"]);
            const dietSummary = calculateDailyAverages(safeDietData, ["calories", "protein_g", "carbs_g", "fats_g"]);
            const calculatedUserStats = { ...fitnessSummary, ...dietSummary };

            const calculatedHealthScore = computeHealthScore(calculatedUserStats);
            const { fitnessChart, dietChart } = processChartData(safeFitnessData, safeDietData);

            setUserData(calculatedUserStats);
            setHealthScore(calculatedHealthScore);
            setFitnessChartData(fitnessChart);
            setDietChartData(dietChart);

        } catch (err) {
            console.error("Error fetching or processing dashboard data:", err);
            setError(err.message || "Failed to load dashboard data.");
            setUserData(null);
            setHealthScore(0);
            setFitnessEntries([]);
            setDietEntries([]);
            setFitnessChartData(INITIAL_CHART_DATA());
            setDietChartData(INITIAL_CHART_DATA());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="dashboard-container dashboard-error">
                 <SideBar />
                 <div className="dashboard-content error-content" style={{ padding: '20px', textAlign: 'center' }}>
                     <h2>Error Loading Dashboard</h2>
                     <p>{error}</p>
                     <button onClick={fetchDashboardData} style={{ padding: '10px 20px', marginTop: '15px', cursor: 'pointer' }}>
                         Try Again
                     </button>
                </div>
            </div>
        );
    }

   if (!userData) {
       return (
           <div className="dashboard-container dashboard-no-data">
               <SideBar />
               <div className="dashboard-content no-data-content" style={{ padding: '20px', textAlign: 'center' }}>
                   <h2>Welcome!</h2>
                   <p>No dashboard data could be loaded. Start logging your activities or try again later.</p>
                   <button onClick={fetchDashboardData} style={{ padding: '10px 20px', marginTop: '15px', cursor: 'pointer' }}>
                       Reload Data
                   </button>
               </div>
           </div>
       );
   }

    const currentCalories = userData?.calories ?? 0;
    const calorieDifference = currentCalories - DAILY_CALORIE_GOAL;
    const calorieStatus = DAILY_CALORIE_GOAL > 0 ? (calorieDifference > 0 ? `${Math.round(calorieDifference)} kcal over` : `Within target`) : 'Goal not set';

    return (
        <div className="dashboard-container">
            <SideBar />
            <div className="dashboard-content">
                <div className="dashboard-grid-container">
                    <div className="left cell">
                        <div className="section-toggle-container">
                            <button
                                className={`section-toggle-btn ${activeMetricTab === 'diet' ? 'section-active' : ''}`}
                                onClick={() => setActiveMetricTab('diet')} >
                                Diet
                            </button>
                            <button
                                className={`section-toggle-btn ${activeMetricTab === 'exercise' ? 'section-active' : ''}`}
                                onClick={() => setActiveMetricTab('exercise')} >
                                Exercise
                            </button>
                        </div>
                        {activeMetricTab === 'diet' && <DietScore score={healthScore} />}
                        {activeMetricTab === 'exercise' && <DashboardExerciseScore />}
                        {activeMetricTab === 'diet' && (
                            <>
                                <div className="toggle-container">
                                    <button
                                        className={`toggle-btn ${selectedPieView === 'daily' ? 'active' : ''}`}
                                        onClick={() => setSelectedPieView('daily')} >
                                        Daily
                                    </button>
                                    <button
                                        className={`toggle-btn ${selectedPieView === 'weekly' ? 'active' : ''}`}
                                        onClick={() => setSelectedPieView('weekly')} >
                                        Weekly
                                    </button>
                                </div>
                                <h3 style={{ textAlign: "center" }}>
                                    {selectedPieView === "daily" ? "Daily" : "Weekly"} Macros Count
                                </h3>
                                <DashboardPie timeView={selectedPieView} dietEntries={dietEntries} />
                            </>
                        )}
                    </div>
                    <div className="cell middle top">
                        <DashboardTotalScore score={healthScore} />
                    </div>
                    <div className="cell middle bottom">
                        <DashboardBar
                            dataLabel="Exercise (cal)"
                            dataColor="#8884d8"
                            chartData={fitnessChartData} />
                        <DashboardBar
                            dataLabel="Diet (cal)"
                            dataColor="#00C49F"
                            chartData={dietChartData} />
                    </div>
                    <div className="right cell">
                        <DashboardChecklist />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;