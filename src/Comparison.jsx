import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import SideBar from './SideBar.jsx';
import "./Comparison.css";

const FITNESS_STANDARDS = {
  steps: { low: 5000, avg: 8000, high: 11000, elite: 14000 },
  workoutMinutes: { low: 20, avg: 40, high: 60, elite: 90 }
};

const DIET_STANDARDS = {
  calories: { low: 1800, avg: 2500, high: 3000, elite: 3500 },
  protein: { low: 50, avg: 90, high: 120, elite: 150 }
};

const Comparison = () => {
  const [activeTab, setActiveTab] = useState("fitness");
  const [userData, setUserData] = useState(null);
  const userAge = 25;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const fitnessRes = await fetch("/api/entries/fitness/past");
        const fitnessData = await fitnessRes.json();
        
        const dietRes = await fetch("/api/entries/diet/past");
        const dietData = await dietRes.json();

        const fitnessSummary = calculateDailyAverages(fitnessData, ["steps", "duration_min"]);
        const dietSummary = calculateDailyAverages(dietData, ["calories", "protein_g"]);

        setUserData({ ...fitnessSummary, ...dietSummary });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <div>Loading...</div>;
  }

  const percentiles = {
    steps: calculatePercentile(userData.steps, FITNESS_STANDARDS.steps),
    workoutMinutes: calculatePercentile(userData.workoutMinutes, FITNESS_STANDARDS.workoutMinutes),
    calories: calculatePercentile(userData.calories, DIET_STANDARDS.calories),
    proteinIntake: calculatePercentile(userData.proteinIntake, DIET_STANDARDS.protein)
  };

  return (
    <>
      <SideBar />
      <div className="comparison-container">
        <h2>Comparison with Peers (Age {userAge})</h2>

        <div className="tabs">
          <button className={activeTab === "fitness" ? "active" : ""} onClick={() => setActiveTab("fitness")}>
            Fitness
          </button>
          <button className={activeTab === "diet" ? "active" : ""} onClick={() => setActiveTab("diet")}>
            Diet
          </button>
        </div>

        <div className="comparison-section">
          {activeTab === "fitness" && (
            <>
              <h3>Fitness Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: "Steps", User: userData.steps, Average: FITNESS_STANDARDS.steps.avg },
                  { name: "Workout Min", User: userData.workoutMinutes, Average: FITNESS_STANDARDS.workoutMinutes.avg }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="User" fill="#4CAF50" />
                  <Bar dataKey="Average" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>

              <h3>Fitness Percentile</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: "Steps", Percentile: percentiles.steps },
                  { name: "Workout Min", Percentile: percentiles.workoutMinutes }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Percentile" fill="#f39c12" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {activeTab === "diet" && (
            <>
              <h3>Diet Metrics</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { name: "Calories", User: userData.calories, Average: DIET_STANDARDS.calories.avg },
                  { name: "Protein", User: userData.proteinIntake, Average: DIET_STANDARDS.protein.avg }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="User" stroke="#4CAF50" strokeWidth={2} />
                  <Line type="monotone" dataKey="Average" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>

              <h3>Diet Percentile</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: "Calories", Percentile: percentiles.calories },
                  { name: "Protein", Percentile: percentiles.proteinIntake }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Percentile" fill="#f39c12" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const calculateDailyAverages = (entries, fields) => {
  const totals = {};
  const count = new Set(entries.map(entry => entry.entry_time.split("T")[0])).size;

  fields.forEach(field => {
    totals[field] = entries.reduce((sum, entry) => sum + (entry[field] || 0), 0) / count;
  });

  return totals;
};

const calculatePercentile = (value, standard) => {
  if (value < standard.low) return 25;
  if (value < standard.avg) return 50;
  if (value < standard.high) return 75;
  return 90;
};

export default Comparison;