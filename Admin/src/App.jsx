import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import SidebarLayout from './components/SidebarLayout';
import SimpleLayout from './components/SimpleLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Your real page components
import AdminDashboard from './pages/dashboard';
import ActivityManagement from './pages/ActivityManagement';
import GradingAndFeedback from './pages/GradingAndFeedback';
import SubmissionMonitoring from './pages/SubmissionMonitoring';
import UserManagement from './pages/UserManagement';
import ClassManagement from './pages/ClassManagement';

import LandingPage from './LandingPage/LandingPage';
import StudentDashboard from './Students/Dashboard';
import LoginPage from './LandingPage/LandingPage'; // Assuming your Login component is here
import StudentActivitySubmission from './Students/Submit Act';    

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLoginSuccess = (loggedInUser) => {
    setIsLoggedIn(true);
    setUser(loggedInUser);

    if (loggedInUser.role === 'student') {
      navigate('/studentdashboard');
    } else if (loggedInUser.role === 'admin') {
      navigate('/admindashboard');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  };

  return (
    <Routes>
      {/* Admin routes with sidebar */}
      <Route element={<SidebarLayout />}>
        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'admin'}>
              <AdminDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activitymanagement"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'admin'}>
              <ActivityManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gradingandfeedback"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'admin'}>
              <GradingAndFeedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissionmonitoring"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'admin'}>
              <SubmissionMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usermanagement"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'admin'}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classmanagement"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'admin'}>
              <ClassManagement />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Public / student routes without sidebar */}
      <Route element={<SimpleLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route
          path="/studentdashboard"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'student'}>
              <StudentDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Route>
       <Route
          path="/studentactivitysubmission"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'student'}>
              <StudentActivitySubmission onLogout={handleLogout} />
            </ProtectedRoute>
          }
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn && user?.role === 'student'}>
              <StudentDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Redirect unknown routes to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
