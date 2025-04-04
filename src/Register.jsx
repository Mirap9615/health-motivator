import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';
import SideBar from './SideBar.jsx';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage(""); 

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/home');
      } else {
        setErrorMessage(data.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <SideBar />
      <div className="register-page">
        <div className="register-container">
          <div className="register-header">
            <h2>Create Account</h2>
            <p className="register-subtitle">Join Health Motivator to start your wellness journey</p>
          </div>
          
          {errorMessage && (
            <div className="error-message">
              <i className="error-icon">!</i>
              <span>{errorMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleRegister} className="register-form">
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="register-button">
              Create Account
            </button>
          </form>
          
          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>
          
          <div className="login-redirect">
            <button className="login-button" onClick={() => navigate('/login')}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
