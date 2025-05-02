import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import SideBar from './SideBar.jsx';
import QuickChart from 'quickchart-js';
import { useLocation } from 'react-router-dom';
import './MealPlanner.css';
import PastDietSummaryTemplate from './PastDietSummaryTemplate.jsx';

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
  
  const isDateInFuture = moment(date).isAfter(moment(), 'day');

  const formattedDateForApi = moment(date).format('YYYY-MM-DD');

  useEffect(() => {
    if (!isDateInFuture) {
      fetchDietLogs();
    } else {
      setPastDietLogs([]);
    }
    
    setShowSummary(false);
    
    if (location.state?.source === 'aiChat') {
      if (location.state?.messageContent) {
        setAiSuggestion(location.state.messageContent);
      }
      
      if (location.state?.selectedMeal) {
        setNewMeal(location.state.selectedMeal);
        
        setNotification({
          show: true,
          message: `Selected meal "${location.state.selectedMeal.meal_name}" loaded. You can add it to your plan.`,
          type: 'success'
        });
        
        if (!isDateInFuture) {
          generateNutritionChart();
        }
      }
      else if (location.state?.mealSuggestions) {
        setAiSuggestedMeals(location.state.mealSuggestions);
        
        setNotification({
          show: true,
          message: 'AI meal suggestions loaded. You can add these to your meal plan.',
          type: 'success'
        });
      } else {
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
      generateNutritionChart();
    }
  }, [location, isDateInFuture]);

  useEffect(() => {
    if (!isDateInFuture) {
      fetchDietLogs();
    } else {
      setPastDietLogs([]);
    }
    
    setShowSummary(false);
    
    if (!aiSuggestedMeals) {
      generateNutritionChart();
    }
  }, [date, isDateInFuture, formattedDateForApi]);

  useEffect(() => {
    if (!aiSuggestedMeals) {
      generateNutritionChart();
    }
  }, [mealPlan]);

  const fetchDietLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/entries/diet/past`, {
        method: "GET",
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const selectedDateStr = moment(date).format('YYYY-MM-DD');
        
        const filteredLogs = data.filter(entry => {
          const entryDate = moment(entry.entry_time).format('YYYY-MM-DD');
          return entryDate === selectedDateStr;
        });
        
        setPastDietLogs(filteredLogs);
        
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

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleMealInputChange = (e) => {
    const { name, value } = e.target;
    setNewMeal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMeal = () => {
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
    
    setMealPlan(prevPlan => {
      const currentDayPlan = prevPlan[dateStr] || {};
      
      const updatedDayPlan = {
        ...currentDayPlan,
        [newMeal.meal_type]: {
          ...newMeal,
          calories: parseFloat(newMeal.calories) || 0,
          protein_g: parseFloat(newMeal.protein_g) || 0,
          carbs_g: parseFloat(newMeal.carbs_g) || 0,
          fats_g: parseFloat(newMeal.fats_g) || 0,
        }
      };
      
      return {
        ...prevPlan,
        [dateStr]: updatedDayPlan
      };
    });
    
    setNewMeal({
      meal_name: '',
      calories: '',
      protein_g: '',
      carbs_g: '',
      fats_g: '',
      meal_type: 'breakfast'
    });
    
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

  const getFutureMealPlan = () => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    return mealPlan[dateStr] || {};
  };

  const removePlannedMeal = (mealType) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    setMealPlan(prevPlan => {
      if (!prevPlan[dateStr]) return prevPlan;
      
      const updatedDayPlan = { ...prevPlan[dateStr] };
      updatedDayPlan[mealType] = null;
      
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

  const generateNutritionChart = () => {
    const calculatedPastMacros = getPastDietMacros();
    const calculatedFutureMacros = getFutureMealMacros();
    
    const calculatedTotalMacros = {
      calories: calculatedPastMacros.calories + calculatedFutureMacros.calories,
      protein: calculatedPastMacros.protein + calculatedFutureMacros.protein,
      carbs: calculatedPastMacros.carbs + calculatedFutureMacros.carbs,
      fats: calculatedPastMacros.fats + calculatedFutureMacros.fats
    };
    
    setPastMacros(calculatedPastMacros);
    setFutureMacros(calculatedFutureMacros);
    setTotalMacros(calculatedTotalMacros);
    
    setLoading(false);
  };

  const tileContent = ({ date }) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    const dayPlan = mealPlan[dateStr];
    
    let plannedCalories = 0;
    if (dayPlan) {
      if (dayPlan.breakfast) plannedCalories += parseFloat(dayPlan.breakfast.calories) || 0;
      if (dayPlan.lunch) plannedCalories += parseFloat(dayPlan.lunch.calories) || 0;
      if (dayPlan.dinner) plannedCalories += parseFloat(dayPlan.dinner.calories) || 0;
      if (dayPlan.snacks) plannedCalories += parseFloat(dayPlan.snacks.calories) || 0;
    }
    
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

  const resetDayPlan = () => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    setMealPlan(prevPlan => {
      const updatedPlan = { ...prevPlan };
      delete updatedPlan[dateStr];
      return updatedPlan;
    });
        
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

  const closeAiSuggestions = () => {
    setAiSuggestedMeals(null);
    setAiSuggestion('');
    generateNutritionChart();
  };

  const toggleSummary = () => {
    setShowSummary(prev => !prev);
  };

  const formattedDate = moment(date).format('MMMM D, YYYY');
  
  const futureMealPlan = getFutureMealPlan();
  
  const addSuggestedMealToPlan = (meal, mealType) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    const mealToAdd = {
      meal_name: meal.meal_name,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fats_g: meal.fats_g,
      meal_type: mealType
    };
    
    setMealPlan(prevPlan => {
      const currentDayPlan = prevPlan[dateStr] || {};
      
      const updatedDayPlan = {
        ...currentDayPlan,
        [mealType]: mealToAdd
      };
      
      return {
        ...prevPlan,
        [dateStr]: updatedDayPlan
      };
    });
    
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
            
            {aiSuggestedMeals && (
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
            )}
          </div>
          
          <div className="meal-plan-section">
            <div className="date-header">
              <h2 className="section-title">Meals for {formattedDate}</h2>
            </div>
            
            <div className="meal-sections-container">
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
                        <PastDietSummaryTemplate pastMacros={pastDietLogs} />
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
