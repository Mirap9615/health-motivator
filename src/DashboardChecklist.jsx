import React, { useState } from 'react';
import './DashboardChecklist.css';

const DashboardChecklist = () => {
  const initialTasks = [
    { id: 1, text: 'Task 1', completed: false },
    { id: 2, text: 'Task 2', completed: false },
    { id: 3, text: 'Task 3', completed: false },
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

  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState('daily');
  const [recommendationView, setRecommendationView] = useState('daily');

  const toggleTaskCompletion = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedTaskCount = tasks.filter((task) => task.completed).length;

  return (
    <div className="checklist-container">
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
      
      <h2>Workout/Diet Checklist ({selected === 'daily' ? 'Daily' : 'Weekly'})</h2>
      <ul className="task-list">
        {tasks.map((task) => (
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
        Completed tasks: {completedTaskCount} / {tasks.length}
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
