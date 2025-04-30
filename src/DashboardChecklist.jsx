import React, { useState, useEffect, useCallback } from 'react';
import './DashboardChecklist.css';
import { generateAIResponse } from './services/aiServices';
import { generateHealthTipsPrompt, generateMealPrompt, generateWorkoutPrompt } from './services/promptServiceAI';

const DashboardChecklist = () => {

  // Initial placeholder recommendations
  const initialDailyRecommendations = [
    "Loading meal suggestion...",
    "Loading workout suggestion...",
    "Loading health tip..."
  ];

  const initialWeeklyRecommendations = [
    "Loading weekly meal plan...",
    "Loading weekly workout plan...",
    "Loading weekly health strategy..."
  ];

  // Main toggle between Goals and Recommendations
  const [activeSection, setActiveSection] = useState('goals');
  
  // Goals section states
  const [selected, setSelected] = useState('daily');
  const [dailyTasksState, setDailyTasksState] = useState([]);
  const [weeklyTasksState, setWeeklyTasksState] = useState([]);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalError, setGoalError] = useState(null);
  const [loadingGoalSuggestion, setLoadingGoalSuggestion] = useState(false);
  const [workoutSuggestion, setWorkoutSuggestion] = useState('');
  
  // Recommendations section state
  const [recommendationView, setRecommendationView] = useState('daily');
  const [highlightedRecommendation, setHighlightedRecommendation] = useState(null);
  const [dailyRecommendations, setDailyRecommendations] = useState(initialDailyRecommendations);
  const [weeklyRecommendations, setWeeklyRecommendations] = useState(initialWeeklyRecommendations);
  const [previousDailyRecommendations, setPreviousDailyRecommendations] = useState([...initialDailyRecommendations]);
  const [previousWeeklyRecommendations, setPreviousWeeklyRecommendations] = useState([...initialWeeklyRecommendations]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const fetchGoals = useCallback(async () => {
    setIsLoadingGoals(true);
    setGoalError(null);
    setDailyTasksState([]); 
    setWeeklyTasksState([]);
    try {
      const response = await fetch('/api/goals'); 
      if (!response.ok) {
        if (response.status === 401) {
           console.error("Unauthorized fetching goals");
           setGoalError("Please log in to view goals.");
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
          const data = await response.json(); 
          setDailyTasksState(data.daily || []);
          setWeeklyTasksState(data.weekly || []);
          console.log(data);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      setGoalError("Failed to load goals. Please try again later.");
    } finally {
      setIsLoadingGoals(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Fetch AI recommendations on mount
  useEffect(() => {
    fetchInitialRecommendations();
  }, []);

  const fetchInitialRecommendations = async () => {
    try {
      // Mock user stats for initial recommendations
      const userStats = {
        steps: 7500,
        duration_min: 35,
        calories: 2200,
        protein_g: 80,
        carbs_g: 250,
        fats_g: 70,
        calories_burned: 350
      };

      // Fetch daily recommendations
      const newDailyRecommendations = [...initialDailyRecommendations];
      
      // Meal suggestion (first item)
      const mealPrompt = generateMealPrompt(['balanced', 'quick'], []);
      const mealResult = await generateAIResponse(mealPrompt, {
        temperature: 0.8,
        maxTokens: 250
      });
      newDailyRecommendations[0] = mealResult.response;
      
      // Workout suggestion (second item)
      const workoutPrompt = generateWorkoutPrompt(30, 'moderate');
      const workoutResult = await generateAIResponse(workoutPrompt, {
        temperature: 0.7,
        maxTokens: 350
      });
      newDailyRecommendations[1] = workoutResult.response;
      
      // Health tip (third item)
      const healthPrompt = generateHealthTipsPrompt(userStats);
      const healthResult = await generateAIResponse(healthPrompt, {
        temperature: 0.7,
        maxTokens: 300
      });
      newDailyRecommendations[2] = healthResult.response;
      
      setDailyRecommendations(newDailyRecommendations);
      setPreviousDailyRecommendations([...newDailyRecommendations]);

      // For weekly recommendations, we'll make them slightly different
      const newWeeklyRecommendations = [...initialWeeklyRecommendations];
      
      // Weekly meal plan (first item)
      const weeklyMealPrompt = generateMealPrompt(['meal prep', 'nutritious'], []);
      const weeklyMealResult = await generateAIResponse(weeklyMealPrompt, {
        temperature: 0.8,
        maxTokens: 250
      });
      newWeeklyRecommendations[0] = weeklyMealResult.response;
      
      // Weekly workout plan (second item)
      const weeklyWorkoutPrompt = generateWorkoutPrompt(45, 'challenging');
      const weeklyWorkoutResult = await generateAIResponse(weeklyWorkoutPrompt, {
        temperature: 0.7,
        maxTokens: 350
      });
      newWeeklyRecommendations[1] = weeklyWorkoutResult.response;
      
      // Weekly health strategy (third item)
      const weeklyHealthPrompt = generateHealthTipsPrompt({...userStats, steps: 9000});
      const weeklyHealthResult = await generateAIResponse(weeklyHealthPrompt, {
        temperature: 0.7,
        maxTokens: 300
      });
      newWeeklyRecommendations[2] = weeklyHealthResult.response;
      
      setWeeklyRecommendations(newWeeklyRecommendations);
      setPreviousWeeklyRecommendations([...newWeeklyRecommendations]);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    }
  };

  useEffect(() => {
    setHighlightedItem(null);
  }, [selected]);
  
  useEffect(() => {
    setHighlightedRecommendation(null);
  }, [recommendationView]);
  
  // Log highlighted items when they change
  useEffect(() => {
    console.log('Highlighted goal:', highlightedItem);
  }, [highlightedItem]);
  
  useEffect(() => {
    console.log('Highlighted recommendation:', highlightedRecommendation);
  }, [highlightedRecommendation]);

  const toggleTaskCompletion = useCallback(async (goalKey) => {
    const isDaily = selected === 'daily';
    const currentTasks = isDaily ? dailyTasksState : weeklyTasksState;
    const taskIndex = currentTasks.findIndex(task => task.key === goalKey);
    if (taskIndex === -1) return;

    const updatedTasks = [...currentTasks];
    const originalCompletedStatus = updatedTasks[taskIndex].completed;
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], completed: !originalCompletedStatus };

    if (isDaily) {
        setDailyTasksState(updatedTasks);
    } else {
        setWeeklyTasksState(updatedTasks);
    }

    try {
        const response = await fetch(`/api/goals/${goalKey}/toggle`, { method: 'POST' });
        if (!response.ok) {
            throw new Error(`Failed to toggle task: ${response.statusText}`);
        }

    } catch (error) {
        console.error("Error toggling task completion:", error);
        // optimistic update reversion in case of error
        updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], completed: originalCompletedStatus };
         if (isDaily) {
            setDailyTasksState(updatedTasks);
        } else {
            setWeeklyTasksState(updatedTasks);
        }
        setGoalError("Failed to update goal status.");
    }
  }, [selected, dailyTasksState, weeklyTasksState]);

  const handleItemClick = (goalKey) => {
    setHighlightedItem(highlightedItem === goalKey ? null : goalKey);
  };
  
  const handleRecommendationClick = (index) => {
    setHighlightedRecommendation(highlightedRecommendation === index ? null : index);
  };

  const handleAISuggestion = async () => {
    if (highlightedItem === null) return;
    
    // Get the highlighted task
    const task = currentTasks.find(task => task.key === highlightedItem);
    if (!task) return;
    
    setLoadingGoalSuggestion(true);
    setWorkoutSuggestion('');
    
    try {
      // Generate a workout suggestion using the API
      const workoutPrompt = generateWorkoutPrompt(40, 'moderate');
      const workoutResult = await generateAIResponse(workoutPrompt, {
        temperature: 0.7,
        maxTokens: 350
      });
      
      setWorkoutSuggestion(workoutResult.response);
    } catch (error) {
      console.error('Error generating workout suggestion:', error);
      setWorkoutSuggestion('Failed to generate workout suggestion. Please try again.');
    } finally {
      setLoadingGoalSuggestion(false);
    }
  };
  
  const handleRecommendationAISuggestion = async () => {
    if (highlightedRecommendation === null) return;
    
    setLoadingRecommendation(true);
    
    try {
      // Save current recommendations for undo functionality
      if (recommendationView === 'daily') {
        setPreviousDailyRecommendations([...dailyRecommendations]);
      } else {
        setPreviousWeeklyRecommendations([...weeklyRecommendations]);
      }
      
      // Mock user stats for recommendations
      const userStats = {
        steps: 7500,
        duration_min: 35,
        calories: 2200,
        protein_g: 80,
        carbs_g: 250,
        fats_g: 70,
        calories_burned: 350
      };

      let newRecommendation = "";
      
      // Call the appropriate AI service based on the item index
      switch (highlightedRecommendation) {
        case 0: // Meal suggestion (first item)
          const mealPrompt = generateMealPrompt(['balanced', 'nutritious'], []);
          const mealResult = await generateAIResponse(mealPrompt, {
            temperature: 0.8,
            maxTokens: 250
          });
          newRecommendation = mealResult.response;
          break;
        case 1: // Workout suggestion (second item)
          const workoutPrompt = generateWorkoutPrompt(30, 'moderate');
          const workoutResult = await generateAIResponse(workoutPrompt, {
            temperature: 0.7,
            maxTokens: 350
          });
          newRecommendation = workoutResult.response;
          break;
        case 2: // Health tip (third item)
          const healthPrompt = generateHealthTipsPrompt(userStats);
          const healthResult = await generateAIResponse(healthPrompt, {
            temperature: 0.7,
            maxTokens: 300
          });
          newRecommendation = healthResult.response;
          break;
        default:
          break;
      }
      
      // Update the appropriate recommendation array with the new recommendation
      if (recommendationView === 'daily') {
        const newDailyRecommendations = [...dailyRecommendations];
        newDailyRecommendations[highlightedRecommendation] = newRecommendation;
        setDailyRecommendations(newDailyRecommendations);
      } else {
        const newWeeklyRecommendations = [...weeklyRecommendations];
        newWeeklyRecommendations[highlightedRecommendation] = newRecommendation;
        setWeeklyRecommendations(newWeeklyRecommendations);
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
    } finally {
      setLoadingRecommendation(false);
    }
  };
  
  const handleUndoRecommendation = () => {
    if (highlightedRecommendation === null) return;
    
    if (recommendationView === 'daily') {
      const newDailyRecommendations = [...dailyRecommendations];
      newDailyRecommendations[highlightedRecommendation] = previousDailyRecommendations[highlightedRecommendation];
      setDailyRecommendations(newDailyRecommendations);
    } else {
      const newWeeklyRecommendations = [...weeklyRecommendations];
      newWeeklyRecommendations[highlightedRecommendation] = previousWeeklyRecommendations[highlightedRecommendation];
      setWeeklyRecommendations(newWeeklyRecommendations);
    }
  };

  const currentTasks = selected === 'daily' ? dailyTasksState : weeklyTasksState;
  const completedTaskCount = currentTasks.filter((task) => task.completed).length;
  const currentRecommendations = recommendationView === 'daily' ? dailyRecommendations : weeklyRecommendations;

  return (
    <div className="checklist-container">
      <div className="section-toggle-container">
        <button 
          className={`section-toggle-btn ${activeSection === 'goals' ? 'section-active' : ''}`}
          onClick={() => setActiveSection('goals')}
        >
          Goals
        </button>
        <button 
          className={`section-toggle-btn ${activeSection === 'recommendations' ? 'section-active' : ''}`}
          onClick={() => setActiveSection('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {/* Goals Section */}
      {activeSection === 'goals' && (
        <div className="goals-section">
          <div className="tab-container">
            <button 
              className={`tab-button ${selected === 'daily' ? 'tab-active' : 'tab-inactive'}`}
              onClick={() => setSelected('daily')}
            >
              Daily
            </button>
            <button 
              className={`tab-button ${selected === 'weekly' ? 'tab-active' : 'tab-inactive'}`}
              onClick={() => setSelected('weekly')}
            >
              Weekly
            </button>
          </div>
          
          <ul className="task-list">
            {currentTasks.map((task) => (
              <li 
                key={task.key} 
                className={`task-item ${highlightedItem === task.key ? 'task-highlighted' : ''}`}
                onClick={() => handleItemClick(task.key)}
              >
                <div className="task-content">
                  <div 
                    className="custom-checkbox" 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      toggleTaskCompletion(task.key);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => {}} 
                      className="checkbox-input"
                    />
                    <span className="checkmark"></span>
                  </div>
                  <span className="task-text">
                    {task.text}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="task-summary">
            Completed tasks: {completedTaskCount} / {currentTasks.length}
          </p>

          {/* AI Suggestion Button - only appears when an item is highlighted */}
          {highlightedItem !== null && (
            <>
              <button 
                className="ai-suggestion-button"
                onClick={handleAISuggestion}
                disabled={loadingGoalSuggestion}
              >
                {loadingGoalSuggestion ? "Generating..." : "Generate Workout"}
              </button>
              
              {workoutSuggestion && (
                <div className="workout-suggestion">
                  <h4>Suggested Workout:</h4>
                  <p>{workoutSuggestion}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Recommendations Section */}
      {activeSection === 'recommendations' && (
        <div className="recommendations-section">
          <div className="tab-container">
            <button 
              className={`tab-button ${recommendationView === 'daily' ? 'tab-active' : 'tab-inactive'}`}
              onClick={() => setRecommendationView('daily')}
            >
              Daily
            </button>
            <button 
              className={`tab-button ${recommendationView === 'weekly' ? 'tab-active' : 'tab-inactive'}`}
              onClick={() => setRecommendationView('weekly')}
            >
              Weekly
            </button>
          </div>
          
          <ul className="recommendation-list">
            {currentRecommendations.map((rec, index) => (
              <li 
                key={index} 
                className={`recommendation-item ${highlightedRecommendation === index ? 'recommendation-highlighted' : ''}`}
                onClick={() => handleRecommendationClick(index)}
              >
                {loadingRecommendation && highlightedRecommendation === index ? 
                  "Loading new suggestion..." : rec}
              </li>
            ))}
          </ul>
          
          {/* AI Suggestion and Undo Buttons - only appear when an item is highlighted */}
          {highlightedRecommendation !== null && (
            <div className="recommendation-actions">
              <button 
                className="ai-suggestion-button"
                onClick={handleRecommendationAISuggestion}
                disabled={loadingRecommendation}
              >
                {loadingRecommendation ? "Generating..." : "Regenerate"}
              </button>
              <button 
                className="undo-button"
                onClick={handleUndoRecommendation}
                disabled={loadingRecommendation}
              >
                Undo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardChecklist;
