import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard.jsx';
import Diet from './Diet.jsx';
import Fitness from './Fitness.jsx';

function AppRouter() {
    return (
      <Router>
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/diet" element={<Diet />} /> 
            <Route path="*" element={<Dashboard />} />
        </Routes>
        </Router>
    );
}
export default AppRouter;