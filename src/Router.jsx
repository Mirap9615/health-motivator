import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function AppRouter() {
    return (
      <Router>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/import" element={<Import />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/diet" element={<Diet />} /> 
            <Route path="/import" element={<Import />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/about" element={<About />} />
            <Route path="/ai-chat" element={<AiChat />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="*" element={<Dashboard />} />
        </Routes>
        </Router>
    );
}
export default AppRouter;