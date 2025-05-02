import React, { useState, useEffect, useCallback } from "react";
import SideBar from "./SideBar.jsx";
import "./Profile.css";
import { FiUser, FiSettings, FiTarget, FiActivity, FiEdit, FiSave, FiX } from "react-icons/fi";
import LoadingSpinner from "./LoadingSpinner.jsx";
import moment from 'moment';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState({});
    const [activeTab, setActiveTab] = useState("profile");
    const [streak, setStreak] = useState(0);

    // State for fetched user goals
    const [userGoals, setUserGoals] = useState(null); // Initialize as null
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [goalFormData, setGoalFormData] = useState({});

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [goalSaveError, setGoalSaveError] = useState(null); // Specific error for goal saving
    const [profileSaveError, setProfileSaveError] = useState(null); // Specific error for profile saving

    const calculateStreak = (dietEntries, fitnessEntries) => {
        // ... (keep streak calculation logic as is) ...
        if (!Array.isArray(dietEntries) || !Array.isArray(fitnessEntries)) return 0;
        const entryTimes = [...dietEntries.map(e => e.entry_time), ...fitnessEntries.map(e => e.entry_time)];
        if (entryTimes.length === 0) return 0;
        const entryDates = new Set(entryTimes.filter(time => time).map(time => moment(time).format('YYYY-MM-DD')));
        if (entryDates.size === 0) return 0;
        let currentStreak = 0;
        let currentDate = moment();
        while (entryDates.has(currentDate.format('YYYY-MM-DD'))) {
            currentStreak++;
            currentDate.subtract(1, 'days');
        }
         if (currentStreak === 0 && entryDates.has(moment().subtract(1, 'days').format('YYYY-MM-DD'))) {
            currentDate = moment().subtract(1, 'days');
             while (entryDates.has(currentDate.format('YYYY-MM-DD'))) {
                currentStreak++;
                currentDate.subtract(1, 'days');
            }
        }
        return currentStreak;
    };

    const fetchPageData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setUser(null);
        setUserGoals(null);
        setStreak(0);

        try {
            const [profileRes, dietRes, fitnessRes, goalsRes] = await Promise.all([
                fetch("/api/user/profile", { method: "GET", credentials: "include" }),
                fetch("/api/entries/diet/past", { method: "GET", credentials: "include" }),
                fetch("/api/entries/fitness/past", { method: "GET", credentials: "include" }),
                fetch("/api/user/goals", { method: "GET", credentials: "include" }), // Fetch user goals
            ]);

            if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.statusText || profileRes.status}`);
            if (!dietRes.ok) throw new Error(`Diet entries fetch failed: ${dietRes.statusText || dietRes.status}`);
            if (!fitnessRes.ok) throw new Error(`Fitness entries fetch failed: ${fitnessRes.statusText || fitnessRes.status}`);
            if (!goalsRes.ok) throw new Error(`Goals fetch failed: ${goalsRes.statusText || goalsRes.status}`); // Check goals response

            const profileData = await profileRes.json();
            const dietData = await dietRes.json();
            const fitnessData = await fitnessRes.json();
            const goalsData = await goalsRes.json(); // Parse goals data

            const safeDietData = Array.isArray(dietData) ? dietData : [];
            const safeFitnessData = Array.isArray(fitnessData) ? fitnessData : [];

            if (profileData && typeof profileData === 'object') {
                 setUser(profileData);
                 setProfileFormData(profileData);
            } else {
                throw new Error("Invalid profile data received.");
            }

            if (goalsData && typeof goalsData === 'object') { // Check if goals data is valid
                setUserGoals(goalsData);
                setGoalFormData(goalsData); // Initialize goal form
            } else {
                 console.warn("Goals data might be missing or invalid, default form values will be used.");
                 // Optionally set default goals if fetch fails but profile succeeds
                 // setUserGoals(defaultGoalValues); // Define defaultGoalValues if needed
                 setGoalFormData({}); // Or initialize with empty/defaults
            }


            const calculatedStreak = calculateStreak(safeDietData, safeFitnessData);
            setStreak(calculatedStreak);

        } catch (err) {
            console.error("Error fetching profile page data:", err);
            setError(err.message || "Failed to load profile data.");
            setUser(null);
            setUserGoals(null);
            setStreak(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const handleProfileEditToggle = () => {
        if (isEditingProfile && user) {
            setProfileFormData(user);
            setProfileSaveError(null); // Clear error on cancel
        }
        setIsEditingProfile(!isEditingProfile);
    };

    const handleProfileChange = (e) => {
        const { name, value, type } = e.target;
        const updatedValue = (type === 'number' && value !== '') ? parseFloat(value) : value;
        setProfileFormData({ ...profileFormData, [name]: updatedValue });
    };

    const handleProfileSave = async () => {
        setProfileSaveError(null); // Clear previous error
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profileFormData),
            });

            if (response.ok) {
                setUser(profileFormData);
                setIsEditingProfile(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                 console.error("Error updating profile:", errorData);
                 const message = errorData?.errors?.[0]?.msg || errorData.error || errorData.message || "Failed to save profile.";
                 setProfileSaveError(message);
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            setProfileSaveError("An unexpected error occurred while saving profile.");
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleGoalChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseInt(value, 10);
        setGoalFormData({ ...goalFormData, [name]: isNaN(numValue) ? '' : Math.max(0, numValue) }); // Allow empty string, parse later
    };

    const handleGoalEditToggle = () => {
        if (isEditingGoals && userGoals) {
            setGoalFormData(userGoals); // Reset form to saved goals on cancel
            setGoalSaveError(null); // Clear error on cancel
        }
        setIsEditingGoals(!isEditingGoals);
    }

    const handleGoalSave = async () => {
        setGoalSaveError(null); // Clear previous errors

        // Convert form data strings to numbers before sending
        const goalsToSend = {
            target_daily_steps: parseInt(goalFormData.target_daily_steps, 10) || 0,
            target_weekly_workout_minutes: parseInt(goalFormData.target_weekly_workout_minutes, 10) || 0,
            target_calorie_intake: parseInt(goalFormData.target_calorie_intake, 10) || 0,
            target_water_intake: parseInt(goalFormData.target_water_intake, 10) || 0,
            target_sleep_hours: parseFloat(goalFormData.target_sleep_hours) || 0,
        };


        try {
            const response = await fetch("/api/user/goals", { // Target the new PUT endpoint
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(goalsToSend),
            });

            if (response.ok) {
                const data = await response.json();
                setUserGoals(data.goals); // Update local state with the saved goals
                setGoalFormData(data.goals); // Ensure form reflects saved state
                setIsEditingGoals(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Error updating goals:", errorData);
                const message = errorData?.errors?.[0]?.msg || errorData.error || errorData.message || "Failed to save goals.";
                setGoalSaveError(message);
            }
        } catch (err) {
            console.error("Error updating goals:", err);
            setGoalSaveError("An unexpected error occurred while saving goals.");
        }
    };


    if (isLoading) return <LoadingSpinner />;

    if (error && !user) {
        return (
             <div className="profile-container profile-error">
                 <SideBar />
                 <div className="profile-content error-content" style={{ padding: '20px', textAlign: 'center' }}>
                     <h2>Error Loading Profile</h2>
                     <p>{error}</p>
                     <button onClick={fetchPageData} style={{ padding: '10px 20px', marginTop: '15px', cursor: 'pointer' }}>
                         Try Again
                     </button>
                 </div>
            </div>
        );
    }

     if (!user) {
         return (
             <div className="profile-container">
                 <SideBar />
                 <div className="profile-content" style={{ padding: '20px', textAlign: 'center' }}>
                    <p>Could not load user profile.</p>
                     <button onClick={fetchPageData} style={{ padding: '10px 20px', marginTop: '15px', cursor: 'pointer' }}>
                         Try Again
                     </button>
                </div>
            </div>
         );
     }


    const renderProfileTab = () => (
        <>
            <div className="profile-header">
                 <div className="profile-avatar">
                    <div className="profile-avatar-placeholder"><FiUser size={50} /></div>
                 </div>
                 <div className="profile-name-info">
                    <h2>{user.name}</h2>
                 </div>
            </div>
            <div className="profile-stats">
                <div className="stat-card">
                    <div className="stat-icon"><FiTarget /></div>
                    <div className="stat-content"><h3>Current Streak</h3><p className="stat-value">{streak} {streak === 1 ? 'day' : 'days'}</p></div>
                </div>
                 <div className="stat-card">
                    <div className="stat-icon"><FiActivity /></div>
                    <div className="stat-content"><h3>Activity Level</h3><p className="stat-value">{user.activity_level || 'N/A'}</p></div>
                </div>
            </div>
            <div className="profile-card">
                {!isEditingProfile ? (
                    <div className="profile-info">
                        <p><strong>Name:</strong> {user.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                        <p><strong>Age:</strong> {user.age ?? 'N/A'}</p>
                        <p><strong>Gender:</strong> {user.gender || 'N/A'}</p>
                        <p><strong>Height:</strong> {user.height_cm ? `${user.height_cm} cm` : 'N/A'}</p>
                        <p><strong>Weight:</strong> {user.weight_kg ? `${user.weight_kg} kg` : 'N/A'}</p>
                        <button className="edit-button" onClick={handleProfileEditToggle}><FiEdit size={16} /> Edit Profile</button>
                    </div>
                ) : (
                    <div className="profile-edit">
                         {profileSaveError && <p className="error-message" style={{color: 'red', marginBottom: '15px'}}>{profileSaveError}</p>}
                         <label>Name:</label>
                         <input type="text" name="name" value={profileFormData.name || ''} onChange={handleProfileChange} />
                         <label>Email:</label>
                         <input type="email" name="email" value={profileFormData.email || ''} disabled />
                         <label>Age:</label>
                         <input type="number" name="age" value={profileFormData.age || ''} onChange={handleProfileChange} min="0"/>
                         <label>Gender:</label>
                         <select name="gender" value={profileFormData.gender || ""} onChange={handleProfileChange}>
                            <option value="" disabled>Select Gender</option>
                            <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                         </select>
                         <label>Height (cm):</label>
                         <input type="number" step="0.1" name="height_cm" value={profileFormData.height_cm || ''} onChange={handleProfileChange} min="0"/>
                         <label>Weight (kg):</label>
                         <input type="number" step="0.1" name="weight_kg" value={profileFormData.weight_kg || ''} onChange={handleProfileChange} min="0"/>
                         <label>Activity Level:</label>
                         <select name="activity_level" value={profileFormData.activity_level || ""} onChange={handleProfileChange}>
                            <option value="" disabled>Select Activity Level</option>
                            <option value="Sedentary">Sedentary</option><option value="Moderate">Moderate</option><option value="Intermediate">Intermediate</option><option value="Challenging">Challenging</option><option value="Advanced">Advanced</option>
                         </select>
                         <div className="profile-buttons">
                            <button className="save-button" onClick={handleProfileSave}><FiSave size={16} /> Save</button>
                            <button className="cancel-button" onClick={handleProfileEditToggle}><FiX size={16} /> Cancel</button>
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
                    <button className="edit-button" onClick={handleGoalEditToggle}><FiEdit size={16} /> Edit Goals</button>
                ) : null}
            </div>

            {/* Display Goals (using userGoals state) */}
            {!isEditingGoals ? (
                userGoals ? (
                    <div className="goals-grid">
                        <div className="goal-card">
                            <div className="goal-icon"><FiActivity /></div>
                            <div className="goal-content"><h3>Daily Steps</h3><p className="goal-value">{userGoals.target_daily_steps?.toLocaleString() ?? 'N/A'}</p></div>
                        </div>
                        <div className="goal-card">
                            <div className="goal-icon"><FiActivity /></div>
                            <div className="goal-content"><h3>Workout Minutes (Weekly)</h3><p className="goal-value">{userGoals.target_weekly_workout_minutes ?? 'N/A'} min</p></div>
                        </div>
                        <div className="goal-card">
                            <div className="goal-icon"><FiActivity /></div>
                            <div className="goal-content"><h3>Calorie Intake</h3><p className="goal-value">{userGoals.target_calorie_intake?.toLocaleString() ?? 'N/A'} cal</p></div>
                        </div>
                        <div className="goal-card">
                            <div className="goal-icon"><FiActivity /></div>
                            <div className="goal-content"><h3>Water Intake</h3><p className="goal-value">{userGoals.target_water_intake ?? 'N/A'} glasses</p></div>
                        </div>
                        <div className="goal-card">
                            <div className="goal-icon"><FiActivity /></div>
                            <div className="goal-content"><h3>Sleep</h3><p className="goal-value">{userGoals.target_sleep_hours ?? 'N/A'} hours</p></div>
                        </div>
                    </div>
                 ) : <p>Goals not loaded yet.</p>
            ) : (
                // Edit Goals Form (using goalFormData state)
                <div className="goals-edit">
                     {goalSaveError && <p className="error-message" style={{color: 'red', marginBottom: '15px'}}>{goalSaveError}</p>}
                    <div className="goal-input-group">
                        <label>Daily Steps:</label>
                        <input type="number" name="target_daily_steps" value={goalFormData.target_daily_steps || ''} onChange={handleGoalChange} min="0"/>
                    </div>
                    <div className="goal-input-group">
                        <label>Workout Minutes (Weekly):</label>
                        <input type="number" name="target_weekly_workout_minutes" value={goalFormData.target_weekly_workout_minutes || ''} onChange={handleGoalChange} min="0"/>
                    </div>
                    <div className="goal-input-group">
                        <label>Target Calorie Intake:</label>
                        <input type="number" name="target_calorie_intake" value={goalFormData.target_calorie_intake || ''} onChange={handleGoalChange} min="0"/>
                    </div>
                    <div className="goal-input-group">
                        <label>Water Intake (glasses):</label>
                        <input type="number" name="target_water_intake" value={goalFormData.target_water_intake || ''} onChange={handleGoalChange} min="0"/>
                    </div>
                    <div className="goal-input-group">
                        <label>Target Sleep Hours:</label>
                        <input type="number" step="0.1" name="target_sleep_hours" value={goalFormData.target_sleep_hours || ''} onChange={handleGoalChange} min="0"/>
                    </div>
                    <div className="profile-buttons">
                        <button className="save-button" onClick={handleGoalSave}><FiSave size={16} /> Save Goals</button>
                        <button className="cancel-button" onClick={handleGoalEditToggle}><FiX size={16} /> Cancel</button>
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
                    <label className="switch"><input type="checkbox" /><span className="slider round"></span></label>
                </div>
                <div className="settings-option">
                    <label>Allow notifications</label>
                    <label className="switch"><input type="checkbox" defaultChecked /><span className="slider round"></span></label>
                </div>
            </div>
            <div className="settings-card">
                <h3>Account</h3>
                <div className="settings-item">
                    <p>Change Password</p><button className="small-button">Update</button>
                </div>
                <div className="settings-item">
                    <p>Connected Apps</p><button className="small-button">Manage</button>
                </div>
                <div className="settings-item danger">
                    <p>Delete Account</p><button className="small-button danger">Delete</button>
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
                        <button className={`tab-button ${activeTab === "profile" ? "tab-active" : ""}`} onClick={() => handleTabChange("profile")}><FiUser size={18} /> Profile</button>
                        <button className={`tab-button ${activeTab === "goals" ? "tab-active" : ""}`} onClick={() => handleTabChange("goals")}><FiTarget size={18} /> Goals</button>
                        <button className={`tab-button ${activeTab === "settings" ? "tab-active" : ""}`} onClick={() => handleTabChange("settings")}><FiSettings size={18} /> Settings</button>
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