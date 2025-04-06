import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import SideBar from './SideBar.jsx';
import QuickChart from 'quickchart-js';
import { useLocation } from 'react-router-dom';
import './MealPlanner.css';

const MealPlanner = () => {
  const location = useLocation();
  const [date, setDate] = useState(new Date());
  const [mealPlan, setMealPlan] = useState({});
  const [pastDietLogs, setPastDietLogs] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: ''
  });
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiSuggestedMeals, setAiSuggestedMeals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [pastMacros, setPastMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [futureMacros, setFutureMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [totalMacros, setTotalMacros] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [newMeal, setNewMeal] = useState({
    meal_name: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fats_g: '',
    meal_type: 'breakfast'
  });
  
  // Check if selected date is in the future
  const isDateInFuture = moment(date).isAfter(moment(), 'day');

  // Format selected date for API requests
  const formattedDateForApi = moment(date).format('YYYY-MM-DD');

  // Fetch diet logs on component mount and handle navigation state
  useEffect(() => {
    if (!isDateInFuture) {
      fetchDietLogs();
    } else {
      // Clear past diet logs when future date is selected
      setPastDietLogs([]);
    }
    
    // Reset summary visibility when date changes
    setShowSummary(false);
    
    // Check for data from navigation state
    if (location.state?.source === 'aiChat') {
      if (location.state?.messageContent) {
        setAiSuggestion(location.state.messageContent);
      }
      
      // Check if there's a selected individual meal
      if (location.state?.selectedMeal) {
        // Set the new meal form with the selected meal data
        setNewMeal(location.state.selectedMeal);
        
        // Show notification about the selected meal
        setNotification({
          show: true,
          message: `Selected meal "${location.state.selectedMeal.meal_name}" loaded. You can add it to your plan.`,
          type: 'success'
        });
        
        // If it's a future date, we're all set
        // Otherwise we should generate the nutrition chart
        if (!isDateInFuture) {
          generateNutritionChart();
        }
      }
      // Check if there are meal suggestions from AiChat
      else if (location.state?.mealSuggestions) {
        setAiSuggestedMeals(location.state.mealSuggestions);
        
        // Show notification about the suggestions
        setNotification({
          show: true,
          message: 'AI meal suggestions loaded. You can add these to your meal plan.',
          type: 'success'
        });
      } else {
        // If no structured suggestions, generate the chart
        generateNutritionChart();
      }
      
      setTimeout(() => {
        setNotification({
          show: false,
          message: '',
          type: ''
        });
      }, 5000);
    } else {
      // No AI suggestion, generate the standard chart
      generateNutritionChart();
    }
  }, [location, isDateInFuture]);

  // When date changes, update past diet logs and nutrition chart
  useEffect(() => {
    if (!isDateInFuture) {
      fetchDietLogs();
    } else {
      // Clear past diet logs when future date is selected
      setPastDietLogs([]);
    }
    
    // Reset summary visibility when date changes
    setShowSummary(false);
    
    // If AI suggested meals are being displayed, don't regenerate the chart
    if (!aiSuggestedMeals) {
      generateNutritionChart();
    }
  }, [date, isDateInFuture, formattedDateForApi]);

  // Update chart when meal plan changes
  useEffect(() => {
    // Only update chart if AI suggested meals are not being displayed
    if (!aiSuggestedMeals) {
      generateNutritionChart();
    }
  }, [mealPlan]);

  // Fetch diet logs for the selected date
  const fetchDietLogs = async () => {
    setLoading(true);
    try {
      // Use the past diet endpoint with date parameter
      const response = await fetch(`/api/entries/diet/past`, {
        method: "GET",
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Format the selected date for comparison (YYYY-MM-DD)
        const selectedDateStr = moment(date).format('YYYY-MM-DD');
        
        // Filter logs for the selected date
        const filteredLogs = data.filter(entry => {
          // Format the entry's date to the same format for comparison
          const entryDate = moment(entry.entry_time).format('YYYY-MM-DD');
          return entryDate === selectedDateStr;
        });
        
        // Set the filtered logs to state
        setPastDietLogs(filteredLogs);
        
        // Log for debugging
        console.log(`Showing ${filteredLogs.length} diet entries for ${selectedDateStr}`);
      } else {
        console.error("Failed to fetch diet logs:", response.status);
        setPastDietLogs([]);
      }
    } catch (error) {
      console.error("Error fetching diet logs:", error);
      setPastDietLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  // Handle new meal input changes
  const handleMealInputChange = (e) => {
    const { name, value } = e.target;
    setNewMeal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add a new meal to the plan
  const handleAddMeal = () => {
    // Basic validation
    if (!newMeal.meal_name || !newMeal.calories) {
      setNotification({
        show: true,
        message: 'Please provide at least a meal name and calories.',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({
          show: false,
          message: '',
          type: ''
        });
      }, 3000);
      
      return;
    }
    
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    // Update meal plan
    setMealPlan(prevPlan => {
      // Get the current day plan or create a new one
      const currentDayPlan = prevPlan[dateStr] || {};
      
      // Update the specific meal type in the day plan
      const updatedDayPlan = {
        ...currentDayPlan,
        [newMeal.meal_type]: {
          ...newMeal,
          // Ensure values are numbers for calculations
          calories: parseFloat(newMeal.calories) || 0,
          protein_g: parseFloat(newMeal.protein_g) || 0,
          carbs_g: parseFloat(newMeal.carbs_g) || 0,
          fats_g: parseFloat(newMeal.fats_g) || 0,
        }
      };
      
      // Return the updated plan
      return {
        ...prevPlan,
        [dateStr]: updatedDayPlan
      };
    });
    
    // Reset form
    setNewMeal({
      meal_name: '',
      calories: '',
      protein_g: '',
      carbs_g: '',
      fats_g: '',
      meal_type: 'breakfast'
    });
    
    // Show success notification
    setNotification({
      show: true,
      message: `${newMeal.meal_type.charAt(0).toUpperCase() + newMeal.meal_type.slice(1)} added successfully!`,
      type: 'success'
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 3000);
  };

  // Get future meal plan for the selected date
  const getFutureMealPlan = () => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    return mealPlan[dateStr] || {};
  };

  // Remove a planned meal
  const removePlannedMeal = (mealType) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    setMealPlan(prevPlan => {
      // If there's no plan for this date, nothing to do
      if (!prevPlan[dateStr]) return prevPlan;
      
      // Create a new day plan with the meal type set to null
      const updatedDayPlan = { ...prevPlan[dateStr] };
      updatedDayPlan[mealType] = null;
      
      // Return the updated plan
      return {
        ...prevPlan,
        [dateStr]: updatedDayPlan
      };
    });
    
    setNotification({
      show: true,
      message: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} removed from plan`,
      type: 'success'
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 3000);
  };

  // Calculate macros for past diet logs
  const getPastDietMacros = () => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    
    pastDietLogs.forEach(entry => {
      calories += parseFloat(entry.calories) || 0;
      protein += parseFloat(entry.protein_g) || 0;
      carbs += parseFloat(entry.carbs_g) || 0;
      fats += parseFloat(entry.fats_g) || 0;
    });
    
    return { calories, protein, carbs, fats };
  };

  // Calculate macros for future meal plan
  const getFutureMealMacros = () => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;
    
    const futureMeals = getFutureMealPlan();
    
    Object.values(futureMeals).forEach(meal => {
      if (meal) {
        calories += parseFloat(meal.calories) || 0;
        protein += parseFloat(meal.protein_g) || 0;
        carbs += parseFloat(meal.carbs_g) || 0;
        fats += parseFloat(meal.fats_g) || 0;
      }
    });
    
    return { calories, protein, carbs, fats };
  };

  // Update the generateNutritionChart function to calculate totals without creating a chart
  const generateNutritionChart = () => {
    // Use the set state functions instead of declaring new variables
    const calculatedPastMacros = getPastDietMacros();
    const calculatedFutureMacros = getFutureMealMacros();
    
    // Calculate combined totals
    const calculatedTotalMacros = {
      calories: calculatedPastMacros.calories + calculatedFutureMacros.calories,
      protein: calculatedPastMacros.protein + calculatedFutureMacros.protein,
      carbs: calculatedPastMacros.carbs + calculatedFutureMacros.carbs,
      fats: calculatedPastMacros.fats + calculatedFutureMacros.fats
    };
    
    // Set the calculated macros
    setPastMacros(calculatedPastMacros);
    setFutureMacros(calculatedFutureMacros);
    setTotalMacros(calculatedTotalMacros);
    
    // Set loading to false since we've calculated the data
    setLoading(false);
  };

  // Tile content for calendar
  const tileContent = ({ date }) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    // Check for future meal plans
    const dayPlan = mealPlan[dateStr];
    
    // Calculate planned calories
    let plannedCalories = 0;
    if (dayPlan) {
      if (dayPlan.breakfast) plannedCalories += parseFloat(dayPlan.breakfast.calories) || 0;
      if (dayPlan.lunch) plannedCalories += parseFloat(dayPlan.lunch.calories) || 0;
      if (dayPlan.dinner) plannedCalories += parseFloat(dayPlan.dinner.calories) || 0;
      if (dayPlan.snacks) plannedCalories += parseFloat(dayPlan.snacks.calories) || 0;
    }
    
    // Format date to check if we have recorded data
    const hasRecorded = pastDietLogs.some(entry => {
      const entryDateStr = moment(entry.entry_time).format('YYYY-MM-DD');
      return entryDateStr === dateStr;
    });
    
    if (plannedCalories === 0 && !hasRecorded) return null;
    
    return (
      <div className="calendar-tile-content">
        {plannedCalories > 0 && (
          <div className="meal-dot planned"></div>
        )}
        {hasRecorded && (
          <div className="meal-dot recorded"></div>
        )}
        <div className="meal-calories">
          {plannedCalories > 0 ? `${Math.round(plannedCalories)} cal` : ''}
        </div>
      </div>
    );
  };

  // Reset meal plan for a day
  const resetDayPlan = () => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    setMealPlan(prevPlan => {
      const updatedPlan = { ...prevPlan };
      delete updatedPlan[dateStr];
      return updatedPlan;
    });
    
    // No need to reset selectedMeals since we're not using it anymore
    
    setNotification({
      show: true,
      message: `Meal plan for ${moment(date).format('MMMM D, YYYY')} has been reset`,
      type: 'success'
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 3000);
  };

  // Close the AI suggestions panel and generate the nutrition chart
  const closeAiSuggestions = () => {
    setAiSuggestedMeals(null);
    setAiSuggestion('');
    generateNutritionChart();
  };

  // Toggle past diet summary visibility
  const toggleSummary = () => {
    setShowSummary(prev => !prev);
  };

  // Get the formatted date
  const formattedDate = moment(date).format('MMMM D, YYYY');
  
  // Get plan data for UI
  const futureMealPlan = getFutureMealPlan();
  
  // The following are managed by state variables now
  // (pastMacros, futureMacros, and totalMacros)
  // and updated by generateNutritionChart()

  // Add suggested meal to plan
  const addSuggestedMealToPlan = (meal, mealType) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    // Create meal object in the format expected by the meal plan
    const mealToAdd = {
      meal_name: meal.meal_name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fats_g: meal.fats_g,
      meal_type: mealType
    };
    
    // Update the meal plan directly with the state updater
    setMealPlan(prevPlan => {
      // Get current day plan or initialize it
      const currentDayPlan = prevPlan[dateStr] || {};
      
      // Create updated day plan with the new meal
      const updatedDayPlan = {
        ...currentDayPlan,
        [mealType]: mealToAdd
      };
      
      // Return the updated plan
      return {
        ...prevPlan,
        [dateStr]: updatedDayPlan
      };
    });
    
    // Show success notification
    setNotification({
      show: true,
      message: `${meal.meal_name} added as ${mealType}`,
      type: 'success'
    });
    
    setTimeout(() => {
      setNotification({
        show: false,
        message: '',
        type: ''
      });
    }, 3000);
  };

  return (
    <>
      <SideBar />
      <div className="meal-planner-container">
        <div className="meal-planner-header">
          <h1 className="meal-planner-title">Meal Planner</h1>
          <p className="meal-planner-subtitle">Track past meals and plan future ones</p>
        </div>
        
        {notification.show && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}
        
        {/* AI Suggestion Panel */}
        {aiSuggestion && !aiSuggestedMeals && (
          <div className="ai-suggestion-panel">
            <div className="ai-suggestion-header">
              <h3>AI Meal Suggestion</h3>
              <button className="close-button" onClick={closeAiSuggestions}>&times;</button>
            </div>
            <div className="ai-suggestion-content">
              <p>{aiSuggestion}</p>
            </div>
          </div>
        )}
        
        <div className="meal-planner-content">
          <div className="calendar-section">
            <h2 className="section-title">Calendar</h2>
            <Calendar 
              onChange={handleDateChange} 
              value={date}
              tileContent={tileContent}
              className="meal-calendar"
            />
            
            <div className="selected-date">
              <h2>{formattedDate}</h2>
              <button className="reset-button" onClick={resetDayPlan}>
                Reset Plan
              </button>
            </div>
            
            {/* AI Suggested Meals display - replaces the chart when available */}
            {aiSuggestedMeals ? (
              <div className="ai-meal-suggestions">
                <div className="ai-suggestions-header">
                  <h3>AI Suggested Meals</h3>
                  <button 
                    className="close-suggestions-btn" 
                    onClick={closeAiSuggestions}
                    aria-label="Close meal suggestions"
                  >
                    &times;
                  </button>
                </div>
                
                <h4 className="suggestion-plan-title">{aiSuggestedMeals.plan_title}</h4>
                
                <div className="meal-options">
                  {aiSuggestedMeals.meals.map((meal, index) => (
                    <div key={index} className="meal-option">
                      <h5>{meal.meal_name}</h5>
                      <div className="macro-badges">
                        <span className="macro-badge calorie">{meal.calories} cal</span>
                        <span className="macro-badge protein">{meal.protein_g}g protein</span>
                        <span className="macro-badge carbs">{meal.carbs_g}g carbs</span>
                        <span className="macro-badge fats">{meal.fats_g}g fats</span>
                      </div>
                      <div className="add-to-plan-actions">
                        <button 
                          className="add-as-breakfast-btn" 
                          onClick={() => addSuggestedMealToPlan(meal, 'breakfast')}
                        >
                          Add as Breakfast
                        </button>
                        <button 
                          className="add-as-lunch-btn" 
                          onClick={() => addSuggestedMealToPlan(meal, 'lunch')}
                        >
                          Add as Lunch
                        </button>
                        <button 
                          className="add-as-dinner-btn" 
                          onClick={() => addSuggestedMealToPlan(meal, 'dinner')}
                        >
                          Add as Dinner
                        </button>
                        <button 
                          className="add-as-snack-btn" 
                          onClick={() => addSuggestedMealToPlan(meal, 'snacks')}
                        >
                          Add as Snack
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="nutrition-form">
                <h3>Nutrition Information</h3>
                
                <div className="nutrition-form-content">
                  <div className="nutrition-summary">
                    <div className="nutrition-total-item">
                      <span className="nutrition-label">Total Calories</span>
                      <span className="nutrition-value calories">{Math.round(totalMacros.calories)}</span>
                    </div>
                    
                    <div className="nutrition-breakdown">
                      <div className="nutrition-item protein">
                        <div className="nutrition-bar" style={{ width: `${Math.min(100, (totalMacros.protein * 4 / totalMacros.calories) * 100)}%` }}></div>
                        <div className="nutrition-details">
                          <span className="nutrition-label">Protein</span>
                          <span className="nutrition-value">{Math.round(totalMacros.protein)}g</span>
                          <span className="nutrition-percentage">
                            {totalMacros.calories ? Math.round((totalMacros.protein * 4 / totalMacros.calories) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="nutrition-item carbs">
                        <div className="nutrition-bar" style={{ width: `${Math.min(100, (totalMacros.carbs * 4 / totalMacros.calories) * 100)}%` }}></div>
                        <div className="nutrition-details">
                          <span className="nutrition-label">Carbs</span>
                          <span className="nutrition-value">{Math.round(totalMacros.carbs)}g</span>
                          <span className="nutrition-percentage">
                            {totalMacros.calories ? Math.round((totalMacros.carbs * 4 / totalMacros.calories) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="nutrition-item fats">
                        <div className="nutrition-bar" style={{ width: `${Math.min(100, (totalMacros.fats * 9 / totalMacros.calories) * 100)}%` }}></div>
                        <div className="nutrition-details">
                          <span className="nutrition-label">Fats</span>
                          <span className="nutrition-value">{Math.round(totalMacros.fats)}g</span>
                          <span className="nutrition-percentage">
                            {totalMacros.calories ? Math.round((totalMacros.fats * 9 / totalMacros.calories) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="nutrition-sources">
                    {pastDietLogs.length > 0 && (
                      <div className="source-item past">
                        <h4>Consumed Today</h4>
                        <p>Calories: {Math.round(pastMacros.calories)}</p>
                        <p>Protein: {Math.round(pastMacros.protein)}g</p>
                        <p>Carbs: {Math.round(pastMacros.carbs)}g</p>
                        <p>Fats: {Math.round(pastMacros.fats)}g</p>
                      </div>
                    )}
                    
                    {Object.values(futureMealPlan).some(meal => meal) && (
                      <div className="source-item future">
                        <h4>Planned Meals</h4>
                        <p>Calories: {Math.round(futureMacros.calories)}</p>
                        <p>Protein: {Math.round(futureMacros.protein)}g</p>
                        <p>Carbs: {Math.round(futureMacros.carbs)}g</p>
                        <p>Fats: {Math.round(futureMacros.fats)}g</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="meal-plan-section">
            <div className="date-header">
              <h2 className="section-title">Meals for {formattedDate}</h2>
            </div>
            
            <div className="meal-sections-container">
              {/* Past Diet Log Section - Only show for current or past dates */}
              {!isDateInFuture && (
                <div className="past-diet-section">
                  <h3 className="meal-section-title">
                    <span className="section-icon past-icon">📋</span>
                    Past Diet Log
                  </h3>
                  
                  {loading ? (
                    <div className="loading-spinner">Loading...</div>
                  ) : pastDietLogs.length > 0 ? (
                    <div className="past-meals-list">
                      <div className="past-meals-container">
                        {pastDietLogs
                          .sort((a, b) => new Date(a.entry_time) - new Date(b.entry_time))
                          .map((meal, index) => (
                            <div className="meal-card past-meal-item" key={`past-${index}`}>
                              <div className="meal-card-header">
                                <h4>{meal.meal_name || meal.meal_type}</h4>
                                <span className="meal-type-badge">{meal.meal_type}</span>
                                <span className="meal-time">{moment(meal.entry_time).format('h:mm A')}</span>
                              </div>
                              <div className="meal-card-macros">
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(parseFloat(meal.calories) || 0)}</span>
                                  <span className="macro-label">calories</span>
                                </div>
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(parseFloat(meal.protein_g) || 0)}g</span>
                                  <span className="macro-label">protein</span>
                                </div>
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(parseFloat(meal.carbs_g) || 0)}g</span>
                                  <span className="macro-label">carbs</span>
                                </div>
                                <div className="macro-item">
                                  <span className="macro-value">{Math.round(parseFloat(meal.fats_g) || 0)}g</span>
                                  <span className="macro-label">fats</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      <button 
                        className={`summary-toggle-button ${showSummary ? 'open' : ''}`}
                        onClick={toggleSummary}
                      >
                        {showSummary ? 'Hide Summary' : 'Show Summary'}
                        <span className="summary-stats">
                          ({pastDietLogs.length} meals, {Math.round(pastMacros.calories)} calories)
                        </span>
                      </button>
                      
                      {showSummary && (
                        <div className="past-diet-summary">
                          <h4>Past Diet Summary</h4>
                          <p>Calories: {Math.round(pastMacros.calories)}</p>
                          <p>Protein: {Math.round(pastMacros.protein)}g</p>
                          <p>Carbs: {Math.round(pastMacros.carbs)}g</p>
                          <p>Fats: {Math.round(pastMacros.fats)}g</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-section-message">
                      <p>No diet logs recorded for {formattedDate}.</p>
                      <p className="suggestion-text">Use the Import page to log your meals.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Future Meal Plan Section */}
              <div className={`future-plan-section ${isDateInFuture ? 'future-date-full-width' : ''}`}>
                <h3 className="meal-section-title">
                  <span className="section-icon future-icon">🗓️</span>
                  {isDateInFuture ? 'Meal Plan' : 'Future Meal Plan'}
                </h3>
                
                {/* Add meal input form */}
                <div className="meal-form">
                  <h4>Add a New Meal</h4>
                  <div className="meal-form-inputs">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="meal_name">Meal Name</label>
                        <input 
                          type="text" 
                          id="meal_name" 
                          name="meal_name" 
                          value={newMeal.meal_name} 
                          onChange={handleMealInputChange} 
                          placeholder="Enter meal name"
                          className="form-control"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="meal_type">Meal Type</label>
                        <select 
                          id="meal_type" 
                          name="meal_type" 
                          value={newMeal.meal_type} 
                          onChange={handleMealInputChange}
                          className="form-control"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snacks">Snack</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="calories">Calories</label>
                        <input 
                          type="number" 
                          id="calories" 
                          name="calories" 
                          value={newMeal.calories} 
                          onChange={handleMealInputChange} 
                          placeholder="Calories"
                          className="form-control"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="protein_g">Protein (g)</label>
                        <input 
                          type="number" 
                          id="protein_g" 
                          name="protein_g" 
                          value={newMeal.protein_g} 
                          onChange={handleMealInputChange} 
                          placeholder="Protein (g)"
                          className="form-control"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="carbs_g">Carbs (g)</label>
                        <input 
                          type="number" 
                          id="carbs_g" 
                          name="carbs_g" 
                          value={newMeal.carbs_g} 
                          onChange={handleMealInputChange} 
                          placeholder="Carbs (g)"
                          className="form-control"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="fats_g">Fats (g)</label>
                        <input 
                          type="number" 
                          id="fats_g" 
                          name="fats_g" 
                          value={newMeal.fats_g} 
                          onChange={handleMealInputChange} 
                          placeholder="Fats (g)"
                          className="form-control"
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="add-meal-button" 
                      onClick={handleAddMeal}
                    >
                      Add Meal
                    </button>
                  </div>
                </div>
                
                {Object.entries(futureMealPlan).some(([key, value]) => value !== null) ? (
                  <div className="future-meals-list">
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => 
                      futureMealPlan[mealType] ? (
                        <div className="meal-card future-meal-item" key={`future-${mealType}`}>
                          <div className="meal-card-header">
                            <h4>{futureMealPlan[mealType].meal_name}</h4>
                            <span className="meal-type-badge">{mealType}</span>
                            <button 
                              className="remove-meal-button" 
                              onClick={() => removePlannedMeal(mealType)}
                              aria-label={`Remove ${mealType}`}
                            >
                              &times;
                            </button>
                          </div>
                          <div className="meal-card-macros">
                            <div className="macro-item">
                              <span className="macro-value">{Math.round(parseFloat(futureMealPlan[mealType].calories) || 0)}</span>
                              <span className="macro-label">calories</span>
                            </div>
                            <div className="macro-item">
                              <span className="macro-value">{Math.round(parseFloat(futureMealPlan[mealType].protein_g) || 0)}g</span>
                              <span className="macro-label">protein</span>
                            </div>
                            <div className="macro-item">
                              <span className="macro-value">{Math.round(parseFloat(futureMealPlan[mealType].carbs_g) || 0)}g</span>
                              <span className="macro-label">carbs</span>
                            </div>
                            <div className="macro-item">
                              <span className="macro-value">{Math.round(parseFloat(futureMealPlan[mealType].fats_g) || 0)}g</span>
                              <span className="macro-label">fats</span>
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}
                    
                    <div className="future-plan-summary">
                      <h4>Planned Meals Summary</h4>
                      <p>Calories: {Math.round(futureMacros.calories)}</p>
                      <p>Protein: {Math.round(futureMacros.protein)}g</p>
                      <p>Carbs: {Math.round(futureMacros.carbs)}g</p>
                      <p>Fats: {Math.round(futureMacros.fats)}g</p>
                    </div>
                  </div>
                ) : (
                  <div className="empty-section-message">
                    <p>No meals planned for this day yet.</p>
                    <p className="suggestion-text">Use the AI Chat to get meal suggestions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MealPlanner;
