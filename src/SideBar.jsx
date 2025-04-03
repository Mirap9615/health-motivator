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
            </div>
          )}
        </div>
        {/* <div className={`backdrop ${isOpen ? "backdrop-active" : ""}`} onClick={toggleMenu}></div> */}
      </div>
      <div className={`menu ${isOpen ? "menu-active" : ""}`}>
        <div className="logged-in-info">Logged in as {username}</div>
        <a href="/import">Import</a>
        <a href="/profile">Profile</a>
        <a href="#" onClick={handleLogout}>Logout</a>
      </div>
    </>
  );
};

export default SideBar;