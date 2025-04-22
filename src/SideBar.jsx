import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import checkAuth from "./CheckAuth.jsx";
import "./Sidebar.css";

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const authStatus = await checkAuth();
      console.log(authStatus);
      setIsLoggedIn(authStatus.authenticated);
      if (authStatus.authenticated) {
        setUsername(authStatus.user.name);
        setAdmin(authStatus.user.admin);
      }
    };
    checkLoginStatus();
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const authStatus = await checkAuth();
        setIsLoggedIn(false);

        navigate("/login");
      } else {
        alert("Logout failed");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Logout failed");
    }
  };

  return (
    <>
      <div className="nav-bar">
        <p className="company-name">Health Motivator</p>
        <div>
          {isLoggedIn ? (
            <div className="nav-item-list">
              <a href="/dashboard">Dashboard</a>
              <a href="/ai-chat">AI Coach</a>
              <a href="/diet">Diet</a>
              <a href="/fitness">Fitness</a>
              <div className={`hamburger-menu-container ${isOpen ? "menu-active" : ""}`}>
                <button className={`hamburger-button ${isOpen ? "active" : ""}`} onClick={toggleMenu}>
                  { <span className="burger">&#9776;</span> /*<span className="menu-text">Menu</span> */}
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-item-list user-inactive">
              <a href="/about">About</a>
              <a href="/login">Login</a>
              <a href="/register">Register</a>
            </div>
          )}
        </div>
        {/* <div className={`backdrop ${isOpen ? "backdrop-active" : ""}`} onClick={toggleMenu}></div> */}
      </div>
      <div className={`menu ${isOpen ? "menu-active" : ""}`}>
        <div className="logged-in-info">
          <div className="user-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div className="user-name">{username}</div>
        </div>
        <a href="/import">Import</a>
        <a href="/meal-planner">Meal Planner</a>
        <a href="/profile">Profile</a>
        <a href="#" onClick={handleLogout}>Logout</a>
      </div>
    </>
  );
};

export default SideBar;