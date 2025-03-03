import React, { useState, useEffect } from "react";
import SideBar from "./SideBar.jsx";
import { Card, Title, Text, Progress, Grid } from "@mantine/core";
import "./Dashboard.css";

const DAILY_CALORIE_GOAL = 2500;
const WORKOUT_GOAL_MINUTES = 40;
const STEP_GOAL = 8000;

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const fitnessRes = await fetch("/api/entries/fitness/past");
        const fitnessData = await fitnessRes.json();
        
        const dietRes = await fetch("/api/entries/diet/past");
        const dietData = await dietRes.json();

        const fitnessSummary = calculateDailyAverages(fitnessData, ["steps", "duration_min", "calories_burned"]);
        const dietSummary = calculateDailyAverages(dietData, ["calories", "protein_g", "carbs_g", "fats_g"]);

        const userStats = { ...fitnessSummary, ...dietSummary };
        setUserData(userStats);

        setHealthScore(computeHealthScore(userStats));
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div>Loading...</div>;
  }

  const calorieDifference = userData.calories - DAILY_CALORIE_GOAL;
  const calorieStatus = calorieDifference > 0 ? `⚠️ ${calorieDifference} kcal over` : `✅ Within target`;

  return (
    <div className="dashboard-container">
      <SideBar />
      <div className="dashboard-content">
        <Title order={1} className="dashboard-title">Dashboard</Title>

        <Card shadow="sm" padding="lg" className="health-score-card">
          <Title order={3} className="section-title">Your Health Score</Title>
          <div className="progress-container">
            <Progress value={healthScore} size="lg" color="green" />
            <Text className="progress-label">{healthScore}/100</Text>
          </div>
          <Text color="dimmed" size="sm">Based on your recent activity and diet.</Text>
        </Card>

        <Grid gutter="md" className="dashboard-grid">
          <Grid.Col span={6}>
            <Card shadow="sm" padding="lg" className="dashboard-card">
              <Title order={4} className="section-title">Exercise Tracking</Title>
              <Text>Steps Today: <strong>{Math.round(userData.steps)}</strong></Text>
              <Text>Calories Burned: <strong>{Math.round(userData.calories_burned)} kcal</strong></Text>
              <Text>Last Workout: <strong>{Math.round(userData.duration_min)} min</strong></Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={6}>
            <Card shadow="sm" padding="lg" className="dashboard-card">
              <Title order={4} className="section-title">Diet Tracking</Title>
              <Text>Calories Consumed: <strong>{Math.round(userData.calories)} kcal</strong></Text>
              <Text>Protein: <strong>{Math.round(userData.protein_g)}g</strong></Text>
              <Text>Carbs: <strong>{Math.round(userData.carbs_g)}g</strong></Text>
              <Text>Fats: <strong>{Math.round(userData.fats_g)}g</strong></Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={6}>
            <Card shadow="sm" padding="lg" className="dashboard-card">
              <Title order={4} className="section-title">Daily Goals</Title>
              <Text>Steps Goal: <strong>{userData.steps >= STEP_GOAL ? "✅ Completed" : "⚠️ Incomplete"}</strong></Text>
              <Text>Workout Goal: <strong>{userData.duration_min >= WORKOUT_GOAL_MINUTES ? "✅ Completed" : "⚠️ Incomplete"}</strong></Text>
              <Text>Calorie Target: <strong>{calorieStatus}</strong></Text>
            </Card>
          </Grid.Col>
        </Grid>
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
