import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import AdminDashboard from './pages/dashboard';
import ActivityManagement from './pages/activity management';
import GradingAndFeedback from './pages/grading and feedback';
import SubmissionMonitoring from './pages/submission monitoring';
import UserManagement from './pages/user management';
import ClassManagement from './pages/class manager';
import LandingPage from './LandingPage/LandingPage';
import StudentDashboard from './Students/Dashboard';
import LoginPage from '../../Landing/src/Component/Login'; // Login component

import Sidenav from './Component/sidenav';

function SidebarLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidenav />
      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet />
      </main>
    </div>
  );
}

function SimpleLayout() {
  return (
    <div style={{ padding: '20px' }}>
      <Outlet />
    </div>
  );
}

function ProtectedRoute({ isAuthenticated, redirectPath = '/login', children }) {
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  return children ? children : <Outlet />;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Routes>
      {/* Routes with sidebar */}
      <Route element={<SidebarLayout />}>
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/activitymanagement" element={<ActivityManagement />} />
        <Route path="/gradingandfeedback" element={<GradingAndFeedback />} />
        <Route path="/submissionmonitoring" element={<SubmissionMonitoring />} />
        <Route path="/usermanagement" element={<UserManagement />} />
        <Route path="/classmanagement" element={<ClassManagement />} />
      </Route>

      {/* Routes without sidebar */}
      <Route element={<SimpleLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={<LoginPage setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route
          path="/studentdashboard"
          element={
            <ProtectedRoute isAuthenticated={isLoggedIn}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}