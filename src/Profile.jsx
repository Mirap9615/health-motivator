import React, { useState, useEffect } from "react";
import SideBar from "./SideBar.jsx";
import "./Profile.css";
import { FiUser, FiSettings, FiTarget, FiActivity, FiShield, FiEdit, FiSave, FiX } from "react-icons/fi";
import LoadingSpinner from "./LoadingSpinner.jsx";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const [goals, setGoals] = useState({
    dailySteps: 8000,
    workoutMinutes: 40,
    calorieIntake: 2500,
    waterIntake: 8,
    sleepHours: 8
  });
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goalFormData, setGoalFormData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          setFormData(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    setGoalFormData(goals);
  }, [goals]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setUser(formData);
        setIsEditing(false);
      } else {
        console.error("Error updating profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleGoalChange = (e) => {
    setGoalFormData({ ...goalFormData, [e.target.name]: parseInt(e.target.value) });
  };

  const handleGoalSave = () => {
    setGoals(goalFormData);
    setIsEditingGoals(false);
  };

  if (!user) return <LoadingSpinner />;

  const renderProfileTab = () => (
    <>
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="profile-avatar-placeholder">
            <FiUser size={50} />
          </div>
          <button className="avatar-edit-button">
            <FiEdit size={16} />
          </button>
        </div>
        <div className="profile-name-info">
          <h2>{user.name}</h2>
          <p className="profile-membership">Premium Member</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FiActivity />
          </div>
          <div className="stat-content">
            <h3>Health Score</h3>
            <p className="stat-value">85</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FiTarget />
          </div>
          <div className="stat-content">
            <h3>Streak</h3>
            <p className="stat-value">12 days</p>
          </div>
        </div>
      </div>

      <div className="profile-card">
        {!isEditing ? (
          <div className="profile-info">
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Age:</strong> {user.age}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Activity Level:</strong> {user.activity_level}</p>
            <button className="edit-button" onClick={handleEditToggle}>
              <FiEdit size={16} /> Edit Profile
            </button>
          </div>
        ) : (
          <div className="profile-edit">
            <label>Name:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} />

            <label>Age:</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} />

            <label>Email:</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} disabled />

            <label>Activity Level:</label>
            <select name="activity_level" value={formData.activity_level} onChange={handleChange}>
              <option>Sedentary</option>
              <option>Moderate</option>
              <option>Intermediate</option>
              <option>Challenging</option>
              <option>Advanced</option>
            </select>

            <div className="profile-buttons">
              <button className="save-button" onClick={handleSave}>
                <FiSave size={16} /> Save
              </button>
              <button className="cancel-button" onClick={handleEditToggle}>
                <FiX size={16} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderGoalsTab = () => (
    <div className="goals-container">
      <div className="goals-header">
        <h2>My Health Goals</h2>
        {!isEditingGoals ? (
          <button className="edit-button" onClick={() => setIsEditingGoals(true)}>
            <FiEdit size={16} /> Edit Goals
          </button>
        ) : null}
      </div>

      {!isEditingGoals ? (
        <div className="goals-grid">
          <div className="goal-card">
            <div className="goal-icon">
              <FiActivity />
            </div>
            <div className="goal-content">
              <h3>Daily Steps</h3>
              <p className="goal-value">{goals.dailySteps.toLocaleString()}</p>
            </div>
          </div>
          <div className="goal-card">
            <div className="goal-icon">
              <FiActivity />
            </div>
            <div className="goal-content">
              <h3>Workout Minutes</h3>
              <p className="goal-value">{goals.workoutMinutes} min</p>
            </div>
          </div>
          <div className="goal-card">
            <div className="goal-icon">
              <FiActivity />
            </div>
            <div className="goal-content">
              <h3>Calorie Intake</h3>
              <p className="goal-value">{goals.calorieIntake} cal</p>
            </div>
          </div>
          <div className="goal-card">
            <div className="goal-icon">
              <FiActivity />
            </div>
            <div className="goal-content">
              <h3>Water Intake</h3>
              <p className="goal-value">{goals.waterIntake} glasses</p>
            </div>
          </div>
          <div className="goal-card">
            <div className="goal-icon">
              <FiActivity />
            </div>
            <div className="goal-content">
              <h3>Sleep</h3>
              <p className="goal-value">{goals.sleepHours} hours</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="goals-edit">
          <div className="goal-input-group">
            <label>Daily Steps:</label>
            <input 
              type="number" 
              name="dailySteps" 
              value={goalFormData.dailySteps} 
              onChange={handleGoalChange} 
            />
          </div>

          <div className="goal-input-group">
            <label>Workout Minutes:</label>
            <input 
              type="number" 
              name="workoutMinutes" 
              value={goalFormData.workoutMinutes} 
              onChange={handleGoalChange} 
            />
          </div>

          <div className="goal-input-group">
            <label>Calorie Intake:</label>
            <input 
              type="number" 
              name="calorieIntake" 
              value={goalFormData.calorieIntake} 
              onChange={handleGoalChange} 
            />
          </div>

          <div className="goal-input-group">
            <label>Water Intake (glasses):</label>
            <input 
              type="number" 
              name="waterIntake" 
              value={goalFormData.waterIntake} 
              onChange={handleGoalChange} 
            />
          </div>

          <div className="goal-input-group">
            <label>Sleep Hours:</label>
            <input 
              type="number" 
              name="sleepHours" 
              value={goalFormData.sleepHours} 
              onChange={handleGoalChange} 
            />
          </div>

          <div className="profile-buttons">
            <button className="save-button" onClick={handleGoalSave}>
              <FiSave size={16} /> Save Goals
            </button>
            <button className="cancel-button" onClick={() => setIsEditingGoals(false)}>
              <FiX size={16} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="settings-container">
      <h2>Account Settings</h2>
      
      <div className="settings-card">
        <h3>Privacy</h3>
        <div className="settings-option">
          <label>Share my activity with friends</label>
          <label className="switch">
            <input type="checkbox" />
            <span className="slider round"></span>
          </label>
        </div>
        <div className="settings-option">
          <label>Allow notifications</label>
          <label className="switch">
            <input type="checkbox" defaultChecked />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3>Account</h3>
        <div className="settings-item">
          <p>Change Password</p>
          <button className="small-button">Update</button>
        </div>
        <div className="settings-item">
          <p>Connected Apps</p>
          <button className="small-button">Manage</button>
        </div>
        <div className="settings-item danger">
          <p>Delete Account</p>
          <button className="small-button danger">Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SideBar />
      <div className="profile-container">
        <div className="profile-content">
          <div className="profile-tabs">
            <button 
              className={activeTab === "profile" ? "tab-active" : ""} 
              onClick={() => handleTabChange("profile")}
            >
              <FiUser size={18} /> Profile
            </button>
            <button 
              className={activeTab === "goals" ? "tab-active" : ""} 
              onClick={() => handleTabChange("goals")}
            >
              <FiTarget size={18} /> Goals
            </button>
            <button 
              className={activeTab === "settings" ? "tab-active" : ""} 
              onClick={() => handleTabChange("settings")}
            >
              <FiSettings size={18} /> Settings
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "goals" && renderGoalsTab()}
            {activeTab === "settings" && renderSettingsTab()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;