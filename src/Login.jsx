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
        // Redirect to home page after login
        navigate('/home');
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
      <div className="centerer">
        <div className="login-container">
          <h2>Login</h2>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
          <div className="register-redirect">
            <button className="register-button-in-login" onClick={() => navigate('/register')}>
                Register
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
