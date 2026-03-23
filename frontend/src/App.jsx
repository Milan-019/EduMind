import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './AuthPage';
import DashboardLayout from './DashboardLayout';
import DashboardHome from './DashboardHome';
import Tutor from './Tutor';
import Quiz from './Quiz';
import Planner from './Planner';
import Analytics from './Analytics';
import Review from './Review';
import Youtube from './Youtube';

function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/" />;
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AuthPage />} />
                <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                    <Route index element={<DashboardHome />} />
                    <Route path="tutor" element={<Tutor />} />
                    <Route path="quiz" element={<Quiz />} />
                    <Route path="planner" element={<Planner />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="review" element={<Review />} />
                    <Route path="youtube" element={<Youtube />} />
                </Route>
            </Routes>
        </Router>
    );
}
