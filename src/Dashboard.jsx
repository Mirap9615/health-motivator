import React, { useState, useEffect } from "react";
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

// Day names for the bar charts
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [healthScore, setHealthScore] = useState(0);
  const [selected, setSelected] = useState('daily');
  const [fitnessData, setFitnessData] = useState([]);
  const [dietData, setDietData] = useState([]);
  const [fitnessChartData, setFitnessChartData] = useState([]);
  const [dietChartData, setDietChartData] = useState([]);
  const [activeMetricTab, setActiveMetricTab] = useState('diet');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const fitnessRes = await fetch("/api/entries/fitness/past");
        const fitnessDataResponse = await fitnessRes.json();
        setFitnessData(fitnessDataResponse);
        
        const dietRes = await fetch("/api/entries/diet/past");
        const dietDataResponse = await dietRes.json();
        setDietData(dietDataResponse);

        const fitnessSummary = calculateDailyAverages(fitnessDataResponse, ["steps", "duration_min", "calories_burned"]);
        const dietSummary = calculateDailyAverages(dietDataResponse, ["calories", "protein_g", "carbs_g", "fats_g"]);

        const userStats = { ...fitnessSummary, ...dietSummary };
        setUserData(userStats);

        setHealthScore(computeHealthScore(userStats));

        processChartData(fitnessDataResponse, dietDataResponse);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const processChartData = (fitnessEntries, dietEntries) => {
    const today = new Date();
    const pastWeekDates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      pastWeekDates.unshift(date); 
    }
    
    pastWeekDates.sort((a, b) => a.getDay() - b.getDay());
    
    const fitnessChart = DAY_NAMES.map(day => ({ day, calories: 0 }));
    const dietChart = DAY_NAMES.map(day => ({ day, calories: 0 }));
    
    if (fitnessEntries && fitnessEntries.length > 0) {
      fitnessEntries.forEach(entry => {
        const entryDate = new Date(entry.entry_time);
        const dayOfWeek = entryDate.getDay(); // 0 = Sunday
        
        const isWithinPastWeek = pastWeekDates.some(date => 
          date.getDate() === entryDate.getDate() && 
          date.getMonth() === entryDate.getMonth() && 
          date.getFullYear() === entryDate.getFullYear()
        );
        
        if (isWithinPastWeek) {
          fitnessChart[dayOfWeek].calories += Number(entry.calories_burned) || 0;
        }
      });
    }
    
    if (dietEntries && dietEntries.length > 0) {
      dietEntries.forEach(entry => {
        const entryDate = new Date(entry.entry_time);
        const dayOfWeek = entryDate.getDay();
      
        const isWithinPastWeek = pastWeekDates.some(date => 
          date.getDate() === entryDate.getDate() && 
          date.getMonth() === entryDate.getMonth() && 
          date.getFullYear() === entryDate.getFullYear()
        );
        
        if (isWithinPastWeek) {
          dietChart[dayOfWeek].calories += Number(entry.calories) || 0;
        }
      });
    }
    
    setFitnessChartData(fitnessChart);
    setDietChartData(dietChart);
  };

  if (!userData) {
    return <LoadingSpinner />;
  }

  const calorieDifference = userData.calories - DAILY_CALORIE_GOAL;
  const calorieStatus = calorieDifference > 0 ? `${calorieDifference} kcal over` : ` Within target`;

  return (
    <div className="dashboard-container">
      <SideBar />
      <div className="dashboard-content">
        <div className="dashboard-grid-container">
            <div className="left cell">
            <div className="section-toggle-container">
              <button 
                className={`section-toggle-btn ${activeMetricTab === 'diet' ? 'section-active' : ''}`}
                onClick={() => setActiveMetricTab('diet')}
              >
                Diet
              </button>
              <button 
                className={`section-toggle-btn ${activeMetricTab === 'exercise' ? 'section-active' : ''}`}
                onClick={() => setActiveMetricTab('exercise')}
              >
                Exercise
              </button>
            </div>
            {activeMetricTab === 'diet' && <DietScore score={healthScore} />}
            {activeMetricTab === 'exercise' && <DashboardExerciseScore />}
            {activeMetricTab === 'diet' && (
                <>
                  <div className="toggle-container">
                    <button 
                      className={`toggle-btn ${selected === 'daily' ? 'active' : ''}`} 
                      onClick={() => setSelected('daily')}
                    >
                      Daily
                    </button>
                    <button 
                      className={`toggle-btn ${selected === 'weekly' ? 'active' : ''}`} 
                      onClick={() => setSelected('weekly')}
                    >
                      Weekly
                    </button>
                  </div>

                  <h3 style={{textAlign: "center"}}>
                    {selected === "daily" ? "Daily" : "Weekly"} Macros Count
                  </h3>

                  <DashboardPie timeView={selected} />
                </>
              )}
            </div>
            <div className="cell middle top">
                <DashboardTotalScore />
            </div>
            <div className="cell middle bottom">
                <DashboardBar 
                  dataLabel="Exercise (cal)" 
                  dataColor="#8884d8" 
                  chartData={fitnessChartData}
                />
                <DashboardBar 
                  dataLabel="Diet (cal)" 
                  dataColor="#2864d8" 
                  chartData={dietChartData}
                />
            </div>
            <div className="right cell">
                <DashboardChecklist />
            </div>
        </div>
      </div>
    </div>
  );
};

const calculateDailyAverages = (entries, fields) => {
  const totals = {};
  const count = new Set(entries.map(entry => entry.entry_time.split("T")[0])).size || 1;

  fields.forEach(field => {
    totals[field] = entries.reduce((sum, entry) => sum + (entry[field] || 0), 0) / count;
  });

  return totals;
};

const computeHealthScore = (userData) => {
  let score = 0;

  if (userData.steps >= STEP_GOAL) score += 20;
  else if (userData.steps >= STEP_GOAL * 0.75) score += 15;
  else if (userData.steps >= STEP_GOAL * 0.5) score += 10;
  else score += 5;

  if (userData.duration_min >= WORKOUT_GOAL_MINUTES) score += 20;
  else if (userData.duration_min >= WORKOUT_GOAL_MINUTES * 0.75) score += 15;
  else if (userData.duration_min >= WORKOUT_GOAL_MINUTES * 0.5) score += 10;
  else score += 5;

  if (userData.calories <= DAILY_CALORIE_GOAL + 100 && userData.calories >= DAILY_CALORIE_GOAL - 100) score += 20;
  else if (Math.abs(userData.calories - DAILY_CALORIE_GOAL) <= 250) score += 15;
  else score += 10;

  if (userData.protein_g >= 90) score += 20;
  else if (userData.protein_g >= 75) score += 15;
  else score += 10;

  if (userData.steps >= STEP_GOAL && userData.duration_min >= WORKOUT_GOAL_MINUTES) score += 10;
  if (userData.calories <= DAILY_CALORIE_GOAL + 100 && userData.calories >= DAILY_CALORIE_GOAL - 100) score += 10;

  return Math.min(100, score); 
};

export default Dashboard;
