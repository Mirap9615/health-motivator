import React, { useState } from 'react';

const DashboardChecklist = () => {
  const initialTasks = [
    { id: 1, text: 'Task 1', completed: false },
    { id: 2, text: 'Task 2', completed: false },
    { id: 3, text: 'Task 3', completed: false },
  ];

  const [tasks, setTasks] = useState(initialTasks);

  const toggleTaskCompletion = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedTaskCount = tasks.filter((task) => task.completed).length;

  return (
    <div>
      <h2>Workout/Diet Checklist</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTaskCompletion(task.id)}
              />
              <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                {task.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p>
        Completed tasks: {completedTaskCount} / {tasks.length}
      </p>
    </div>
  );
};

export default DashboardChecklist;
