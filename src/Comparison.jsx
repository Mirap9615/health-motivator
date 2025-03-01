import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import SideBar from './SideBar.jsx';
import "./Comparison.css";

const Comparison = () => {
  const [activeTab, setActiveTab] = useState("fitness");
  const userAge = 27;

  const userData = {
    steps: 7500,
    workoutMinutes: 45,
    caloriesConsumed: 2200,
    proteinIntake: 90,
  };

  const averageData = {
    steps: 8500,
    workoutMinutes: 50,
    caloriesConsumed: 2500,
    proteinIntake: 80,
  };

  const percentile = {
    steps: userData.steps < 7000 ? 40 : userData.steps > 9000 ? 75 : 60,
    workoutMinutes: userData.workoutMinutes < 30 ? 35 : userData.workoutMinutes > 60 ? 80 : 55,
    caloriesConsumed: userData.caloriesConsumed < 2000 ? 30 : userData.caloriesConsumed > 2700 ? 75 : 50,
    proteinIntake: userData.proteinIntake < 60 ? 25 : userData.proteinIntake > 100 ? 80 : 55,
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
                { name: "Steps", User: userData.steps, Average: averageData.steps },
                { name: "Workout Min", User: userData.workoutMinutes, Average: averageData.workoutMinutes },
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
                { name: "Steps", Percentile: percentile.steps },
                { name: "Workout Min", Percentile: percentile.workoutMinutes },
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
                { name: "Calories", User: userData.caloriesConsumed, Average: averageData.caloriesConsumed },
                { name: "Protein", User: userData.proteinIntake, Average: averageData.proteinIntake },
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
                { name: "Calories", Percentile: percentile.caloriesConsumed },
                { name: "Protein", Percentile: percentile.proteinIntake },
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

export default Comparison;
