import React, { useState, useEffect } from "react";
import SideBar from "./SideBar.jsx";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

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

  if (!user) return <div className="loading-message">Loading...</div>;

  return (
    <>
      <SideBar />
      <div className="profile-container">
      <div className="profile-content">
        <h2 className="profile-title">My Profile</h2>

        <div className="profile-card">
          {!isEditing ? (
            <div className="profile-info">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Age:</strong> {user.age}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Activity Level:</strong> {user.activity_level}</p>
              <button className="edit-button" onClick={handleEditToggle}>Edit Profile</button>
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
                <button className="save-button" onClick={handleSave}>Save</button>
                <button className="cancel-button" onClick={handleEditToggle}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile;