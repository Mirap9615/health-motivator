import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import SideBar from './SideBar.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(""); 

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Force page reload to ensure authentication state is refreshed
        window.location.href = '/dashboard';
      } else {
        setErrorMessage(data.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <SideBar />
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue your health journey</p>
          </div>
          
          {errorMessage && (
            <div className="error-message">
              <i className="error-icon">!</i>
              <span>{errorMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="login-form">
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
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot Password?
                </Link>
              </div>
              <div className="input-wrapper">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            
            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>
          
          <div className="auth-divider">
            <span>New to Health Motivator?</span>
          </div>
          
          <div className="register-redirect">
            <button className="register-button" onClick={() => navigate('/register')}>
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
