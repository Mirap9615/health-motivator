import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SideBar from "./SideBar.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";
import "./Import.css";

const Import = () => {
  const location = useLocation();
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Check for state passed through navigation and set the active form
  useEffect(() => {
    if (location.state && location.state.formType) {
      setActiveForm(location.state.formType);
    }
  }, [location]);

  const handleDietChange = (e) => {
    setDietData({ ...dietData, [e.target.name]: e.target.value });
  };

  const handleFitnessChange = (e) => {
    setFitnessData({ ...fitnessData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (type) => {
    setIsSubmitting(true);
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
        setNotification({
          show: true,
          message: `${type === "diet" ? "Diet" : "Fitness"} entry saved successfully!`,
          type: "success"
        });
        
        // Reset form after successful submission
        if (type === "diet") {
          setDietData({
            meal_type: "Breakfast",
            calories: "",
            protein_g: "",
            carbs_g: "",
            fats_g: "",
          });
        } else {
          setFitnessData({
            exercise_type: "",
            duration_min: "",
            calories_burned: "",
            steps: "",
          });
        }
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: "", type: "" });
          setActiveForm(null);
        }, 3000);
      } else {
        setNotification({
          show: true,
          message: "Error saving entry. Please try again.",
          type: "error"
        });
        
        // Hide error notification after 5 seconds
        setTimeout(() => {
          setNotification({ show: false, message: "", type: "" });
        }, 5000);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      setNotification({
        show: true,
        message: "Network error. Please check your connection.",
        type: "error"
      });
      
      // Hide error notification after 5 seconds
      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = (type) => {
    if (type === "diet") {
      return dietData.calories && dietData.protein_g && dietData.carbs_g && dietData.fats_g;
    } else {
      return fitnessData.exercise_type && fitnessData.duration_min && fitnessData.calories_burned;
    }
  };

  return (
    <>
      <SideBar />
      {isSubmitting && <LoadingSpinner />}
      <div className="import-container">
        <div className="import-header">
          <h2>Health Data Entry</h2>
          <p>Record your diet and fitness information to track your health journey</p>
        </div>

        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        {!activeForm ? (
          <div className="import-selection">
            <div className="import-card diet-card" onClick={() => setActiveForm("diet")}>
              <div className="import-card-icon diet-icon"></div>
              <h3>Diet Entry</h3>
              <p>Record your meals, calories, and macronutrients</p>
            </div>
            
            <div className="import-card fitness-card" onClick={() => setActiveForm("fitness")}>
              <div className="import-card-icon fitness-icon"></div>
              <h3>Fitness Entry</h3>
              <p>Track your workouts, steps, and calories burned</p>
            </div>
          </div>
        ) : (
          <div className="import-form-container">
            <div className="import-form-header">
              <h3>{activeForm === "diet" ? "Diet Entry" : "Fitness Entry"}</h3>
              <button className="close-button" onClick={() => setActiveForm(null)}>×</button>
            </div>
            
            <div className="import-form">
              <div className="form-group">
                <label htmlFor="date">Date:</label>
                <input 
                  id="date" 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="form-control"
                />
              </div>

              {activeForm === "diet" ? (
                <>
                  <div className="form-group">
                    <label htmlFor="meal_type">Meal Type:</label>
                    <select 
                      id="meal_type" 
                      name="meal_type" 
                      value={dietData.meal_type} 
                      onChange={handleDietChange}
                      className="form-control"
                    >
                      <option>Breakfast</option>
                      <option>Lunch</option>
                      <option>Dinner</option>
                      <option>Snack</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="calories">Calories:</label>
                      <input 
                        id="calories" 
                        type="number" 
                        name="calories" 
                        value={dietData.calories} 
                        onChange={handleDietChange} 
                        className="form-control"
                        placeholder="e.g. 500"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="protein_g">Protein (g):</label>
                      <input 
                        id="protein_g" 
                        type="number" 
                        name="protein_g" 
                        value={dietData.protein_g} 
                        onChange={handleDietChange} 
                        className="form-control"
                        placeholder="e.g. 25"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="carbs_g">Carbs (g):</label>
                      <input 
                        id="carbs_g" 
                        type="number" 
                        name="carbs_g" 
                        value={dietData.carbs_g} 
                        onChange={handleDietChange} 
                        className="form-control"
                        placeholder="e.g. 50"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="fats_g">Fats (g):</label>
                      <input 
                        id="fats_g" 
                        type="number" 
                        name="fats_g" 
                        value={dietData.fats_g} 
                        onChange={handleDietChange} 
                        className="form-control"
                        placeholder="e.g. 15"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="exercise_type">Exercise Type:</label>
                    <input 
                      id="exercise_type" 
                      type="text" 
                      name="exercise_type" 
                      value={fitnessData.exercise_type} 
                      onChange={handleFitnessChange} 
                      className="form-control"
                      placeholder="e.g. Running, Weightlifting"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="duration_min">Duration (min):</label>
                      <input 
                        id="duration_min" 
                        type="number" 
                        name="duration_min" 
                        value={fitnessData.duration_min} 
                        onChange={handleFitnessChange} 
                        className="form-control"
                        placeholder="e.g. 30"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="calories_burned">Calories Burned:</label>
                      <input 
                        id="calories_burned" 
                        type="number" 
                        name="calories_burned" 
                        value={fitnessData.calories_burned} 
                        onChange={handleFitnessChange} 
                        className="form-control"
                        placeholder="e.g. 300"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="steps">Steps (optional):</label>
                    <input 
                      id="steps" 
                      type="number" 
                      name="steps" 
                      value={fitnessData.steps} 
                      onChange={handleFitnessChange} 
                      className="form-control"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button 
                  className="cancel-button" 
                  onClick={() => setActiveForm(null)}
                >
                  Cancel
                </button>
                <button 
                  className={`submit-button ${!isFormValid(activeForm) ? 'disabled' : ''}`} 
                  onClick={() => handleSubmit(activeForm)}
                  disabled={!isFormValid(activeForm) || isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Import;
