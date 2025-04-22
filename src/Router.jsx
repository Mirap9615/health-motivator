import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import Diet from './Diet.jsx';
import Fitness from './Fitness.jsx';
import Import from './Import.jsx';
import Profile from './Profile.jsx';
import Login from './Login.jsx';
import Register from './Register.jsx';
import Logout from './Logout.jsx';
import About from './About.jsx';
import AiChat from './AiChat.jsx';
import MealPlanner from './MealPlanner.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import checkAuth from './CheckAuth.jsx';

// Style for loading container
const loadingStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f5f5f5'
};

// Custom layout component that handles auth
function AuthenticatedLayout() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const location = useLocation();
    
    async function verifyAuth() {
        try {
            setIsLoading(true);
            console.log("Checking authentication...");
            const { authenticated, user } = await checkAuth();
            console.log("Auth result:", authenticated, user);
            setIsAuthenticated(authenticated);
            setUser(user);
        } catch (error) {
            console.error('Authentication check failed:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    // Check auth on mount and location changes
    useEffect(() => {
        verifyAuth();
    }, [location.pathname]);
    
    // Show loading state while checking authentication
    if (isLoading) {
        return <div style={loadingStyle}><LoadingSpinner /></div>;
    }
    
    return (
        <Routes>
            {/* Public routes - accessible to everyone */}
            <Route path="/about" element={<About />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
            
            {/* Protected routes - only accessible if authenticated */}
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/about" />} />
            <Route path="/import" element={isAuthenticated ? <Import /> : <Navigate to="/about" />} />
            <Route path="/fitness" element={isAuthenticated ? <Fitness /> : <Navigate to="/about" />} />
            <Route path="/diet" element={isAuthenticated ? <Diet /> : <Navigate to="/about" />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/about" />} />
            <Route path="/logout" element={isAuthenticated ? <Logout /> : <Navigate to="/about" />} />
            <Route path="/ai-chat" element={isAuthenticated ? <AiChat /> : <Navigate to="/about" />} />
            <Route path="/meal-planner" element={isAuthenticated ? <MealPlanner /> : <Navigate to="/about" />} />
            
            {/* Default routes */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/about" />} />
            <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/about" />} />
        </Routes>
    );
}

function AppRouter() {
    return (
        <Router>
            <AuthenticatedLayout />
        </Router>
    );
}

export default AppRouter;