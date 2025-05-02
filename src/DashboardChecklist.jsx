import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './DashboardChecklist.css';
import { generateAIResponse } from './services/aiServices';
import { generateHealthTipsPrompt, generateMealPrompt, generateWorkoutPrompt } from './services/promptServiceAI';
import RecommendationModal from './RecommendationModal.jsx'; 
import { FiInfo } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner.jsx';

const RECOMMENDATION_TYPES = {
  DAILY_MEAL: 'daily_meal', DAILY_WORKOUT: 'daily_workout', DAILY_TIP: 'daily_tip',
  WEEKLY_MEAL: 'weekly_meal_plan', WEEKLY_WORKOUT: 'weekly_workout_plan', WEEKLY_STRATEGY: 'weekly_health_strategy',
};
const TITLE_SEPARATOR = "|||"; 

const initialRecommendationState = Object.fromEntries(
  Object.values(RECOMMENDATION_TYPES).map(type => [type, {
      title: `Loading ${type.replace(/_/g, ' ')}...`,
      details: "",
      loading: true,
      error: null,
      previous: { title: "", details: "" } 
  }])
);

const DashboardChecklist = ({ healthScore = 50 }) => {
  const [activeSection, setActiveSection] = useState('goals');
  const [userProfile, setUserProfile] = useState(null);
  const [userGoals, setUserGoals] = useState(null);

  const [goalView, setGoalView] = useState('daily');
  const [dailyTasks, setDailyTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [highlightedGoalKey, setHighlightedGoalKey] = useState(null);
  const [isLoadingChecklistData, setIsLoadingChecklistData] = useState(true);
  const [checklistError, setChecklistError] = useState(null);
  const [loadingGoalAISuggestion, setLoadingGoalAISuggestion] = useState(false);
  const [goalAISuggestion, setGoalAISuggestion] = useState('');

  const [recommendationView, setRecommendationView] = useState('daily');
  const [recommendations, setRecommendations] = useState(initialRecommendationState);
  const [highlightedRecType, setHighlightedRecType] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', details: '' });

  const fetchCoreData = useCallback(async () => {
    setIsLoadingChecklistData(true);
    setChecklistError(null);
    try {
      const [goalsRes, userGoalsRes, profileRes] = await Promise.allSettled([
        fetch('/api/goals', { credentials: 'include' }),
        fetch('/api/user/goals', { credentials: 'include' }),
        fetch('/api/user/profile', { credentials: 'include' }),
      ]);

      let fetchedDailyTasks = [];
      let fetchedWeeklyTasks = [];
      let fetchedUserGoals = null;
      let fetchedUserProfile = null;
      let fetchError = null;

      if (goalsRes.status === 'fulfilled' && goalsRes.value.ok) {
        const data = await goalsRes.value.json();
        fetchedDailyTasks = Array.isArray(data.daily) ? data.daily : [];
        fetchedWeeklyTasks = Array.isArray(data.weekly) ? data.weekly : [];
      } else {
        fetchError = `System Goals fetch failed: ${goalsRes.reason || goalsRes.value.statusText}`;
      }

      if (userGoalsRes.status === 'fulfilled' && userGoalsRes.value.ok) {
        const userGoalsData = await userGoalsRes.value.json();
        fetchedUserGoals = userGoalsData && typeof userGoalsData === 'object' ? userGoalsData : null;
      } else {
         console.warn(`User goals fetch failed: ${userGoalsRes.reason || userGoalsRes.value.statusText}`);
         fetchError = fetchError || `User Goals fetch failed: ${userGoalsRes.reason || userGoalsRes.value.statusText}`;
      }

       if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const profileData = await profileRes.value.json();
          fetchedUserProfile = profileData && typeof profileData === 'object' ? profileData : null;
       } else {
           console.warn(`Profile fetch failed: ${profileRes.reason || profileRes.value.statusText}`);
           fetchError = fetchError || `Profile fetch failed: ${profileRes.reason || profileRes.value.statusText}`;
       }

       setDailyTasks(fetchedDailyTasks);
       setWeeklyTasks(fetchedWeeklyTasks);
       setUserGoals(fetchedUserGoals);
       setUserProfile(fetchedUserProfile);

       if(fetchError) {
            setChecklistError(fetchError);
       }

    } catch (error) {
      console.error("Error fetching core checklist data:", error);
      setChecklistError(error.message || "Failed to load checklist data.");
      setDailyTasks([]);
      setWeeklyTasks([]);
      setUserProfile(null);
      setUserGoals(null);
    } finally {
      setIsLoadingChecklistData(false);
    }
  }, []);

  useEffect(() => {
    fetchCoreData();
  }, [fetchCoreData]);

  const parseAIResponse = (rawResponse) => {
    if (!rawResponse || typeof rawResponse !== 'string') {
        return { title: "Error processing response", details: "" };
    }
    const parts = rawResponse.split(TITLE_SEPARATOR);
    if (parts.length >= 2) {
        return { title: parts[0].trim(), details: parts.slice(1).join(TITLE_SEPARATOR).trim() };
    }
    return { title: rawResponse.substring(0, 60) + (rawResponse.length > 60 ? '...' : ''), details: rawResponse };
};

  const fetchAndSetPersonalizedRecommendations = useCallback(async () => {
    if (!userProfile || !userGoals) {
      console.log("Skipping recommendations: Missing profile or user goals.");
       setRecommendations(prev => {
            const newState = {...prev};
            Object.keys(newState).forEach(type => {
                 if(newState[type].loading) {
                    newState[type] = { ...newState[type], text: "Cannot generate recommendations without user data.", loading: false, error: "Missing profile/goals" };
                 }
            });
            return newState;
        });
      return;
    }

    setRecommendations(initialRecommendationState);

    const dailyWorkoutMinutes = userGoals.target_weekly_workout_minutes ? Math.round(userGoals.target_weekly_workout_minutes / 7) : 30;
    const weeklyWorkoutMinutes = userGoals.target_weekly_workout_minutes || 150;
    const activityLevel = userProfile.activity_level || 'moderate';

    const fetchers = {
      [RECOMMENDATION_TYPES.DAILY_MEAL]: () => generateAIResponse(generateMealPrompt(['balanced', 'quick'], userProfile, userGoals, 'daily'), { temperature: 0.8, maxTokens: 250 }),
      [RECOMMENDATION_TYPES.DAILY_WORKOUT]: () => generateAIResponse(generateWorkoutPrompt(dailyWorkoutMinutes, activityLevel, 'daily', userProfile, 'workout suggestion'), { temperature: 0.7, maxTokens: 350 }),
      [RECOMMENDATION_TYPES.DAILY_TIP]: () => generateAIResponse(generateHealthTipsPrompt(userProfile, 'daily', userGoals, 'health tip'), { temperature: 0.7, maxTokens: 300 }),
      [RECOMMENDATION_TYPES.WEEKLY_MEAL]: () => generateAIResponse(generateMealPrompt(['meal prep', 'nutritious'], userProfile, userGoals, 'weekly'), { temperature: 0.8, maxTokens: 400 }),
      [RECOMMENDATION_TYPES.WEEKLY_WORKOUT]: () => generateAIResponse(generateWorkoutPrompt(weeklyWorkoutMinutes, activityLevel, 'weekly', userProfile, 'workout plan'), { temperature: 0.7, maxTokens: 500 }),
      [RECOMMENDATION_TYPES.WEEKLY_STRATEGY]: () => generateAIResponse(generateHealthTipsPrompt(userProfile, 'weekly', userGoals, 'health strategy'), { temperature: 0.7, maxTokens: 400 }),
    };

    const results = await Promise.allSettled(Object.values(fetchers).map(fetcher => fetcher()));

    setRecommendations(prev => {
      const newState = { ...prev };
      Object.keys(fetchers).forEach((type, index) => {
        const result = results[index];
        if (result.status === 'fulfilled' && result.value?.response) {
          const parsed = parseAIResponse(result.value.response); 
          newState[type] = { ...parsed, loading: false, error: null, previous: parsed };  
        } else {
          const errorMessage = result.reason?.message || 'Failed to generate';
          console.error(`Error fetching ${type}:`, result.reason);
          newState[type] = { text: `Error: ${errorMessage.substring(0, 100)}...`, loading: false, error: errorMessage, previous: prev[type].text };
        }
      });
      return newState;
    });
  }, [userProfile, userGoals]);

  useEffect(() => {
    if (userProfile && userGoals && !isLoadingChecklistData) { 
      fetchAndSetPersonalizedRecommendations();
    }
  }, [userProfile, userGoals, isLoadingChecklistData, fetchAndSetPersonalizedRecommendations]);

  useEffect(() => setHighlightedGoalKey(null), [goalView]);
  useEffect(() => setHighlightedRecType(null), [recommendationView]);

  const toggleTaskCompletion = useCallback(async (goalKey) => {
    const isDaily = goalView === 'daily';
    const currentTasks = isDaily ? dailyTasks : weeklyTasks;
    const taskIndex = currentTasks.findIndex(task => task.key === goalKey);
    if (taskIndex === -1) return;

    const originalCompletedStatus = currentTasks[taskIndex].completed;
    const optimisticUpdate = (completed) => {
       const updated = [...currentTasks];
       updated[taskIndex] = { ...updated[taskIndex], completed };
       if (isDaily) setDailyTasks(updated); else setWeeklyTasks(updated);
    };

    optimisticUpdate(!originalCompletedStatus);
    setChecklistError(null);

    try {
      const response = await fetch(`/api/goals/${goalKey}/toggle`, { method: 'POST', credentials: 'include' });
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Toggle failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      optimisticUpdate(originalCompletedStatus);
      setChecklistError(error.message || "Failed to update goal status.");
    }
  }, [goalView, dailyTasks, weeklyTasks]);

  const handleGoalItemClick = (goalKey) => {
    setHighlightedGoalKey(prev => (prev === goalKey ? null : goalKey));
    setGoalAISuggestion('');
  };

  const handleGoalAISuggestion = useCallback(async () => {
    if (highlightedGoalKey === null) return;
    const currentTasks = goalView === 'daily' ? dailyTasks : weeklyTasks;
    const task = currentTasks.find(t => t.key === highlightedGoalKey);
    if (!task) return;

    setLoadingGoalAISuggestion(true);
    setGoalAISuggestion('');
    setChecklistError(null);

    try {
      // Determine the focus area based on task text
      const taskText = task.text.toLowerCase();
      let focusArea = "general health";
      
      if (taskText.includes("sleep") || taskText.includes("rest") || taskText.includes("bed")) {
        focusArea = "sleep";
      } else if (taskText.includes("eat") || taskText.includes("food") || taskText.includes("diet") || 
                taskText.includes("meal") || taskText.includes("nutrition")) {
        focusArea = "diet";
      } else if (taskText.includes("exercise") || taskText.includes("workout") || taskText.includes("run") || 
                taskText.includes("gym") || taskText.includes("walk") || taskText.includes("activity")) {
        focusArea = "exercise";
      }
      
      // Determine health status based on score
      let healthStatus = "average";
      if (healthScore >= 80) {
        healthStatus = "excellent";
      } else if (healthScore >= 65) {
        healthStatus = "good";
      } else if (healthScore <= 40) {
        healthStatus = "needs improvement";
      }
      
      const profileContext = userProfile 
        ? `Consider my profile: Age ${userProfile.age}, Activity Level ${userProfile.activity_level}. My current health score is ${healthScore}/100 (${healthStatus}).` 
        : `My current health score is ${healthScore}/100 (${healthStatus}).`;
      
      const periodContext = goalView === 'daily' ? 'today' : 'this week';
      
      // Create a more focused prompt
      const prompt = `Give me a specific, actionable ${focusArea} tip related to my goal: "${task.text}" for ${periodContext}. ${profileContext} 
      Keep it extremely brief (max 1-2 sentences, under 25 words total). Focus only on ${focusArea} advice. Make sure the user understands EXACTLY what I am talking about.`;
      
      const result = await generateAIResponse(prompt, { temperature: 0.7, maxTokens: 75 });

      if (!result?.response) throw new Error("No response from AI for goal suggestion.");

      setGoalAISuggestion(result.response);
    } catch (error) {
      console.error('Error generating goal AI suggestion:', error);
      setGoalAISuggestion('Suggestion failed. Please try again.');
      setChecklistError('AI Suggestion failed.');
    } finally {
      setLoadingGoalAISuggestion(false);
    }
  }, [highlightedGoalKey, goalView, dailyTasks, weeklyTasks, userProfile, healthScore]);

  const handleRecItemClick = (recType) => {
    setHighlightedRecType(prev => (prev === recType ? null : recType));
  };

  const handleRegenerateRecommendation = useCallback(async () => { /* ... Mostly same logic, but update state with parsed response ... */
    if (!highlightedRecType || !userProfile || !userGoals) { console.warn("Cannot regenerate, missing type or user data."); return; }
    const type = highlightedRecType;
    setRecommendations(prev => ({ ...prev, [type]: { ...prev[type], loading: true, error: null, previous: {title: prev[type].title, details: prev[type].details} } })); // Store previous structure
    try { /* ... generate prompt, options ... */
          let prompt = ''; let options = {}; const dailyWorkoutMinutes = userGoals.target_weekly_workout_minutes ? Math.round(userGoals.target_weekly_workout_minutes / 7) : 30; const weeklyWorkoutMinutes = userGoals.target_weekly_workout_minutes || 150; const activityLevel = userProfile.activity_level || 'moderate'; const period = type.startsWith('daily') ? 'daily' : 'weekly'; const context = type.split('_').slice(1).join(' ');
           switch (type) { /* ... cases to generate prompt/options ... */
              case RECOMMENDATION_TYPES.DAILY_MEAL: prompt = generateMealPrompt(['different', 'healthy', activityLevel], userProfile, userGoals, period); options = { temperature: 0.9, maxTokens: 300 }; break; // Adjusted tokens
              case RECOMMENDATION_TYPES.DAILY_WORKOUT: prompt = generateWorkoutPrompt(dailyWorkoutMinutes, activityLevel, period, userProfile, `alternative ${context}`); options = { temperature: 0.8, maxTokens: 400 }; break;
              case RECOMMENDATION_TYPES.DAILY_TIP: prompt = generateHealthTipsPrompt(userProfile, period, userGoals, `different ${context}`); options = { temperature: 0.8, maxTokens: 350 }; break;
              case RECOMMENDATION_TYPES.WEEKLY_MEAL: prompt = generateMealPrompt(['different weekly plan', 'vegetarian', 'easy prep', activityLevel], userProfile, userGoals, period); options = { temperature: 0.8, maxTokens: 500 }; break;
              case RECOMMENDATION_TYPES.WEEKLY_WORKOUT: prompt = generateWorkoutPrompt(weeklyWorkoutMinutes, activityLevel, period, userProfile, `alternative ${context}`); options = { temperature: 0.8, maxTokens: 600 }; break;
              case RECOMMENDATION_TYPES.WEEKLY_STRATEGY: prompt = generateHealthTipsPrompt(userProfile, period, userGoals, `different ${context}`); options = { temperature: 0.8, maxTokens: 450 }; break;
              default: throw new Error("Unknown recommendation type");
           }
           const result = await generateAIResponse(prompt, options);
           if (!result?.response) throw new Error("No response from AI.");
           const parsed = parseAIResponse(result.response); // Parse response
           setRecommendations(prev => ({ ...prev, [type]: { ...parsed, loading: false, error: null, previous: prev[type].previous } })); // Update state with parsed data
      } catch (error) { /* ... handle error ... */
           console.error(`Error regenerating ${type}:`, error);
           setRecommendations(prev => ({ ...prev, [type]: { title: `Regeneration failed`, details: error.message.substring(0,100), loading: false, error: error.message, previous: prev[type].previous } }));
      }
}, [highlightedRecType, userProfile, userGoals]);

const handleUndoRecommendation = useCallback(() => {
   if (!highlightedRecType || !recommendations[highlightedRecType]?.previous?.details) return; // Check previous details
    const type = highlightedRecType;
    setRecommendations(prev => ({
       ...prev, [type]: { ...prev[type], title: prev[type].previous.title, details: prev[type].previous.details, error: null } // Restore previous title/details
    }));
}, [highlightedRecType, recommendations]);

const openModalWithContent = (rec) => {
  setModalContent({ title: rec.title, details: rec.details });
  setIsModalOpen(true);
};

const closeModal = () => {
  setIsModalOpen(false);
};

const currentGoals = useMemo(() => (goalView === 'daily' ? dailyTasks : weeklyTasks), [goalView, dailyTasks, weeklyTasks]);
const completedGoalCount = useMemo(() => currentGoals.filter((task) => task.completed).length, [currentGoals]);
const currentRecommendations = useMemo(() => {
      const dailyKeys = [RECOMMENDATION_TYPES.DAILY_MEAL, RECOMMENDATION_TYPES.DAILY_WORKOUT, RECOMMENDATION_TYPES.DAILY_TIP];
      const weeklyKeys = [RECOMMENDATION_TYPES.WEEKLY_MEAL, RECOMMENDATION_TYPES.WEEKLY_WORKOUT, RECOMMENDATION_TYPES.WEEKLY_STRATEGY];
      return (recommendationView === 'daily' ? dailyKeys : weeklyKeys).map(key => ({ type: key, ...recommendations[key] }));
}, [recommendationView, recommendations]);

return (
  <>
    <div className="checklist-container">
      <div className="section-toggle-container">
        <button className={`section-toggle-btn ${activeSection === 'goals' ? 'section-active' : ''}`} onClick={() => setActiveSection('goals')} aria-pressed={activeSection === 'goals'} >
          Goals
        </button>
        <button className={`section-toggle-btn ${activeSection === 'recommendations' ? 'section-active' : ''}`} onClick={() => setActiveSection('recommendations')} aria-pressed={activeSection === 'recommendations'} >
          Recommendations
        </button>
      </div>

      {activeSection === 'goals' && (
        <div className="goals-section">
          <div className="tab-container">
            <button className={`tab-button ${goalView === 'daily' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setGoalView('daily')} aria-pressed={goalView === 'daily'} > Daily </button>
            <button className={`tab-button ${goalView === 'weekly' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setGoalView('weekly')} aria-pressed={goalView === 'weekly'} > Weekly </button>
          </div>

          {isLoadingChecklistData && <LoadingSpinner size="small" />}
          {checklistError && activeSection === 'goals' && <p className="error-message">{checklistError}</p>}

          {!isLoadingChecklistData && !checklistError && (
            <>
              <ul className="task-list">
                {currentGoals.length === 0 && <li>No {goalView} goals found.</li>}
                {currentGoals.map((task) => (
                  <li key={task.key} className={`task-item ${highlightedGoalKey === task.key ? 'task-highlighted' : ''}`} onClick={() => handleGoalItemClick(task.key)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleGoalItemClick(task.key)} >
                    <div className="task-content">
                      <div className="custom-checkbox" onClick={(e) => { e.stopPropagation(); toggleTaskCompletion(task.key); }} role="checkbox" aria-checked={task.completed} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && toggleTaskCompletion(task.key)} >
                        <input type="checkbox" checked={task.completed} readOnly className="checkbox-input" />
                        <span className="checkmark"></span>
                      </div>
                      <span className="task-text">{task.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {currentGoals.length > 0 && (<p className="task-summary">Completed: {completedGoalCount} / {currentGoals.length}</p>)}
              {highlightedGoalKey !== null && (
                <div className="goal-actions">
                   <button className="ai-suggestion-button" onClick={handleGoalAISuggestion} disabled={loadingGoalAISuggestion || !userProfile} title={!userProfile ? "User profile needed for suggestion" : "Get AI Suggestion"} >
                      {loadingGoalAISuggestion ? "Generating..." : "AI Tip"}
                   </button>
                   {goalAISuggestion && !loadingGoalAISuggestion && (<div className="ai-suggestion-display"><p>{goalAISuggestion}</p></div>)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeSection === 'recommendations' && (
        <div className="recommendations-section">
          <div className="tab-container">
            <button className={`tab-button ${recommendationView === 'daily' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setRecommendationView('daily')} aria-pressed={recommendationView === 'daily'} > Daily </button>
            <button className={`tab-button ${recommendationView === 'weekly' ? 'tab-active' : 'tab-inactive'}`} onClick={() => setRecommendationView('weekly')} aria-pressed={recommendationView === 'weekly'} > Weekly </button>
          </div>
          <ul className="recommendation-button-list">
            {currentRecommendations.map((rec) => (
              <li key={rec.type} className={`recommendation-button-item ${rec.loading ? 'loading' : ''} ${rec.error ? 'error' : ''}`}>
                <button
                  className="recommendation-view-button"
                  onClick={() => openModalWithContent(rec)}
                  disabled={rec.loading || !!rec.error}
                >
                  {rec.loading ? <LoadingSpinner size="inline"/> : (rec.error ? `Error: ${rec.type.split('_')[1] || 'Item'}` : rec.title || `View ${rec.type.split('_')[1] || 'Item'}`)}
                   {!rec.loading && !rec.error && <FiInfo size={14} style={{ marginLeft: '8px', opacity: 0.7 }}/>}
                </button>
                {/* Buttons appear next to view button when highlighted */}
                <div className={`recommendation-inline-actions ${highlightedRecType === rec.type ? 'visible' : ''}`}>
                     {highlightedRecType === rec.type && !rec.loading && !rec.error && (
                         <button className="inline-action-button regenerate" onClick={(e) => { e.stopPropagation(); handleRegenerateRecommendation(); }} disabled={!userProfile || !userGoals} title={(!userProfile || !userGoals) ? "User data needed" : "Regenerate"} > Regenerate </button>
                     )}
                     {highlightedRecType === rec.type && rec.previous?.details && rec.previous.details !== rec.details && !rec.loading && (
                         <button className="inline-action-button undo" onClick={(e) => { e.stopPropagation(); handleUndoRecommendation(); }} > Undo </button>
                     )}
                 </div>
              </li>
            ))}
          </ul>
           {/* Removed global Regenerate/Undo buttons */}
        </div>
      )}
    </div>

    <RecommendationModal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={modalContent.title}
    >
      {modalContent.details}
    </RecommendationModal>
  </>
);
};


export default DashboardChecklist;