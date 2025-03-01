import React, { useState } from "react";
import SideBar from "./SideBar.jsx";
import "./Import.css";

const Import = () => {
  const [activeForm, setActiveForm] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // Default to today
  const [dietData, setDietData] = useState({
    meal_type: "Breakfast",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fats_g: "",
  });

  const [fitnessData, setFitnessData] = useState({
    exercise_type: "",
    duration_min: "",
    calories_burned: "",
    steps: "",
  });

  const handleDietChange = (e) => {
    setDietData({ ...dietData, [e.target.name]: e.target.value });
  };

  const handleFitnessChange = (e) => {
    setFitnessData({ ...fitnessData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (type) => {
    const endpoint = type === "diet" ? "/api/entries/diet" : "/api/entries/exercise";
    const payload = type === "diet"
      ? { ...dietData, entry_time: date }
      : { ...fitnessData, entry_time: date };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(`${type === "diet" ? "Diet" : "Fitness"} entry saved!`);
        setActiveForm(null);
      } else {
        alert("Error saving entry.");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
    }
  };

  return (
    <>
      <SideBar />
      <div className="import-container">
        <h2>Enter Your Health Data</h2>
        <p>Select which type of data you want to enter:</p>

        <div className="import-options">
          <button className="import-button" onClick={() => setActiveForm("diet")}>
            Enter Diet Data
          </button>
          <button className="import-button" onClick={() => setActiveForm("fitness")}>
            Enter Fitness Data
          </button>
        </div>

        {activeForm && (
          <div className="import-form">
            <h3>{activeForm === "diet" ? "Enter Diet Data" : "Enter Fitness Data"}</h3>
            <label>Date:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

            {activeForm === "diet" ? (
              <>
                <label>Meal Type:</label>
                <select name="meal_type" value={dietData.meal_type} onChange={handleDietChange}>
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snack</option>
                </select>

                <label>Calories:</label>
                <input type="number" name="calories" value={dietData.calories} onChange={handleDietChange} />

                <label>Protein (g):</label>
                <input type="number" name="protein_g" value={dietData.protein_g} onChange={handleDietChange} />

                <label>Carbs (g):</label>
                <input type="number" name="carbs_g" value={dietData.carbs_g} onChange={handleDietChange} />

                <label>Fats (g):</label>
                <input type="number" name="fats_g" value={dietData.fats_g} onChange={handleDietChange} />

                <button className="submit-button" onClick={() => handleSubmit("diet")}>
                  Save Diet Entry
                </button>
              </>
            ) : (
              <>
                <label>Exercise Type:</label>
                <input type="text" name="exercise_type" value={fitnessData.exercise_type} onChange={handleFitnessChange} />

                <label>Duration (minutes):</label>
                <input type="number" name="duration_min" value={fitnessData.duration_min} onChange={handleFitnessChange} />

                <label>Calories Burned:</label>
                <input type="number" name="calories_burned" value={fitnessData.calories_burned} onChange={handleFitnessChange} />

                <label>Steps:</label>
                <input type="number" name="steps" value={fitnessData.steps} onChange={handleFitnessChange} />

                <button className="submit-button" onClick={() => handleSubmit("fitness")}>
                  Save Fitness Entry
                </button>
              </>
            )}

            <button className="cancel-button" onClick={() => setActiveForm(null)}>Cancel</button>
          </div>
        )}
      </div>
    </>
  );
};

export default Import;
