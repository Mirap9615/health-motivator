import React, { useState } from 'react';
import './DashboardChecklist.css';

const DashboardChecklist = () => {
  const dailyTasks = [
    { id: 1, text: 'Complete 30 minutes of cardio', completed: false },
    { id: 2, text: 'Eat 5 servings of vegetables', completed: false },
    { id: 3, text: 'Drink 8 glasses of water', completed: false },
  ];

  const weeklyTasks = [
    { id: 1, text: 'Complete 3 strength training sessions', completed: false },
    { id: 2, text: 'Try one new healthy recipe', completed: false },
    { id: 3, text: 'Take a rest day', completed: false },
    { id: 4, text: 'Track all meals for the week', completed: false },
  ];

  const dailyRecommendations = [
    "Drink 8 glasses of water",
    "Take a 10-minute walk after each meal",
    "Stretch for 5 minutes in the morning"
  ];

  const weeklyRecommendations = [
    "Try a new workout routine",
    "Meal prep for the week ahead",
    "Take one day for active recovery"
  ];

  const [selected, setSelected] = useState('daily');
  const [recommendationView, setRecommendationView] = useState('daily');
  
  const [dailyTasksState, setDailyTasksState] = useState(dailyTasks);
  const [weeklyTasksState, setWeeklyTasksState] = useState(weeklyTasks);

  const toggleDailyTaskCompletion = (taskId) => {
    setDailyTasksState((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const toggleWeeklyTaskCompletion = (taskId) => {
    setWeeklyTasksState((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const currentTasks = selected === 'daily' ? dailyTasksState : weeklyTasksState;
  const toggleTaskCompletion = selected === 'daily' ? toggleDailyTaskCompletion : toggleWeeklyTaskCompletion;
  const completedTaskCount = currentTasks.filter((task) => task.completed).length;
  
  return (
    <div className="checklist-container">
      <h2 className="checklist-goals-title">Goals</h2>
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
          <li key={task.id} className="task-item">
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTaskCompletion(task.id)}
              />
              <span className={task.completed ? 'task-completed' : 'task-incomplete'}>
                {task.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="task-summary">
        Completed tasks: {completedTaskCount} / {currentTasks.length}
      </p>

      {/* Recommendations Section */}
      <div className="recommendations-section">
        <h2>Recommendations</h2>
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
          {recommendationView === 'daily' 
            ? dailyRecommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">{rec}</li>
              ))
            : weeklyRecommendations.map((rec, index) => (
                <li key={index} className="recommendation-item">{rec}</li>
              ))
          }
        </ul>
      </div>
    </div>
  );
};

export default DashboardChecklist;
