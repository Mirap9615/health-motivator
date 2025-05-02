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
    meal_name: "",
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
  const [savedMeals, setSavedMeals] = useState([]);
  const [mealTypeFilter, setMealTypeFilter] = useState("All");

  useEffect(() => {
    if (location.state && location.state.formType) {
      setActiveForm(location.state.formType);
    }
    
    if (location.state && location.state.macroInfo) {
      const { meal_name, calories, protein_g, carbs_g, fats_g } = location.state.macroInfo;
      
      setActiveForm('diet');
      
      setDietData(prev => ({
        ...prev,
        meal_name: meal_name || "",
        calories: calories ? calories.toString() : "",
        protein_g: protein_g ? protein_g.toString() : "",
        carbs_g: carbs_g ? carbs_g.toString() : "",
        fats_g: fats_g ? fats_g.toString() : ""
      }));
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
        
        if (type === "diet") {
          setDietData({
            meal_name: "",
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

  useEffect(() => {
    const loadSavedMeals = () => {
      try {
        const savedMealsString = localStorage.getItem('savedMeals');
        if (savedMealsString) {
          const meals = JSON.parse(savedMealsString);
          setSavedMeals(meals);
          console.log("Loaded saved meals from localStorage:", meals);
        }
      } catch (error) {
        console.error("Error loading saved meals from localStorage:", error);
      }
    };
    
    loadSavedMeals();
  }, []);

  useEffect(() => {
    fetchSavedMeals();
  }, []);

  const fetchSavedMeals = async () => {
    try {
      const response = await fetch("/api/entries/savedmeals", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched saved meals:", data);
        setSavedMeals(data);
      } else {
        console.error("Failed to fetch saved meals");
      }
    } catch (error) {
      console.error("Error fetching saved meals:", error);
    }
  };

  const handleSaveMeal = async () => {
    if (!dietData.meal_name) {
      setNotification({
        show: true,
        message: "Please enter a name for this meal",
        type: "error"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/entries/savemeal", {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          meal_name: dietData.meal_name,
          meal_type: dietData.meal_type,
          calories: Number(dietData.calories) || 0,
          protein_g: Number(dietData.protein_g) || 0,
          carbs_g: Number(dietData.carbs_g) || 0,
          fats_g: Number(dietData.fats_g) || 0,
        }),
      });

      if (response.ok) {
        setNotification({
          show: true,
          message: "Meal saved successfully!",
          type: "success"
        });
        fetchSavedMeals();
      } else {
        const errorData = await response.json();
        setNotification({
          show: true,
          message: errorData.error || "Error saving meal. Please try again.",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error saving meal:", error);
      setNotification({
        show: true,
        message: `Network error: ${error.message}`,
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSavedMeal = async (id) => {
    try {
      const response = await fetch(`/api/entries/savedmeals/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      
      if (response.ok) {
        fetchSavedMeals();
        setNotification({
          show: true,
          message: "Meal deleted successfully",
          type: "success"
        });
      } else {
        setNotification({
          show: true,
          message: "Error deleting meal",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error deleting meal:", error);
      setNotification({
        show: true,
        message: `Network error: ${error.message}`,
        type: "error"
      });
    }
  };

  const getFilteredMeals = () => {
    if (mealTypeFilter === "All") {
      return savedMeals;
    }
    return savedMeals.filter(meal => meal.meal_type === mealTypeFilter);
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
                    <label htmlFor="meal_name">Meal Name:</label>
                    <input 
                      id="meal_name" 
                      type="text" 
                      name="meal_name" 
                      value={dietData.meal_name} 
                      onChange={handleDietChange} 
                      className="form-control"
                      placeholder="e.g. Chicken Salad"
                    />
                  </div>

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
                    <button 
                      className="save-meal-button" 
                      onClick={handleSaveMeal}
                      disabled={!dietData.meal_name || !dietData.calories || isSubmitting}
                    >
                      Save as Meal Template
                </button>
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

                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setActiveForm(null)}>
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
              </>
            )}

              {activeForm === "diet" && savedMeals.length > 0 && (
                <div className="saved-meals-section">
                  <div className="saved-meals-header">
                    <h4>Saved Meal Templates</h4>
                    <div className="meal-type-filters">
                      <button 
                        className={`filter-button ${mealTypeFilter === "All" ? "active" : ""}`}
                        onClick={() => setMealTypeFilter("All")}
                      >
                        All
                      </button>
                      <button 
                        className={`filter-button ${mealTypeFilter === "Breakfast" ? "active" : ""}`}
                        onClick={() => setMealTypeFilter("Breakfast")}
                      >
                        Breakfast
                      </button>
                      <button 
                        className={`filter-button ${mealTypeFilter === "Lunch" ? "active" : ""}`}
                        onClick={() => setMealTypeFilter("Lunch")}
                      >
                        Lunch
                      </button>
                      <button 
                        className={`filter-button ${mealTypeFilter === "Dinner" ? "active" : ""}`}
                        onClick={() => setMealTypeFilter("Dinner")}
                      >
                        Dinner
                      </button>
                      <button 
                        className={`filter-button ${mealTypeFilter === "Snack" ? "active" : ""}`}
                        onClick={() => setMealTypeFilter("Snack")}
                      >
                        Snack
                      </button>
                    </div>
                  </div>
                  
                  <div className="saved-meals-scroll-container">
                    <div className="saved-meals-list">
                      {getFilteredMeals().length > 0 ? (
                        getFilteredMeals().map((meal) => (
                          <div 
                            key={meal.id} 
                            className="saved-meal-item"
                          >
                            <div className="saved-meal-header">
                              <div className="saved-meal-name">{meal.meal_name}</div>
                              <div className={`meal-type-badge ${meal.meal_type.toLowerCase()}`}>{meal.meal_type}</div>
                              <button 
                                className="delete-meal-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSavedMeal(meal.id);
                                }}
                              >
                                ×
                              </button>
                            </div>
                            <div className="saved-meal-details">
                              <span className="calorie-badge">{meal.calories} cal</span>
                              <span className="protein-badge">{meal.protein_g}g protein</span>
                              <span className="carbs-badge">{meal.carbs_g}g carbs</span>
                              <span className="fats-badge">{meal.fats_g}g fat</span>
                            </div>
                            <button 
                              className="use-meal-button"
                              onClick={() => {
                                setDietData({
                                  meal_name: meal.meal_name,
                                  meal_type: meal.meal_type,
                                  calories: meal.calories.toString(),
                                  protein_g: meal.protein_g.toString(),
                                  carbs_g: meal.carbs_g.toString(),
                                  fats_g: meal.fats_g.toString(),
                                });
                              }}
                            >
                              Use This Meal
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="no-meals-message">
                          No {mealTypeFilter !== "All" ? mealTypeFilter.toLowerCase() : ""} meals saved yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Import;


