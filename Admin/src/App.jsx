import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';

import AdminDashboard from './pages/dashboard';
import UserManagement from './pages/UserManagement';
import ClassManagement from './pages/ClassManagement';

import StudentDashboard from './Students/Dashboard';
import StudentPortal from './Students/StudentPortal';

import TeacherDashboard from './Teachers/Dashboard';
import TeacherPortal from './Teachers/TeacherPortal';
import ActivityMonitoring from './Teachers/ActivityMonitoring';

import LandingPage from './LandingPage/LandingPage';
import Login from './LandingPage/Login';

function AppRoutes({ user, onLogout }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return (
      <AdminLayout onLogout={onLogout}>
        <Routes>
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/usermanagement" element={<UserManagement />} />
          <Route path="/classmanagement" element={<ClassManagement />} />
          <Route path="/" element={<Navigate to="/admindashboard" replace />} />
          <Route path="*" element={<Navigate to="/admindashboard" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  if (user.role === 'student') {
    return (
      <StudentLayout onLogout={onLogout}>
        <Routes>
          <Route path="/studentdashboard" element={<StudentDashboard />} />
          <Route path="/studentportal" element={<StudentPortal />} />
          <Route path="/" element={<Navigate to="/studentdashboard" replace />} />
          <Route path="*" element={<Navigate to="/studentdashboard" replace />} />
        </Routes>
      </StudentLayout>
    );
  }

  if (user.role === 'teacher') {
    return (
      <TeacherLayout onLogout={onLogout}>
        <Routes>
          <Route path="/teacherdashboard" element={<TeacherDashboard />} />
          <Route path="/classes" element={<TeacherPortal />} />
          <Route path="/activitymonitoring" element={<ActivityMonitoring />} />
          <Route path="/" element={<Navigate to="/teacherdashboard" replace />} />
          <Route path="*" element={<Navigate to="/teacherdashboard" replace />} />
        </Routes>
      </TeacherLayout>
    );
  }

  // Default fallback if user role is unknown
  return <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

    if (loggedInUser.role === 'admin') {
      navigate('/admindashboard');
    } else if (loggedInUser.role === 'student') {
      navigate('/studentdashboard');
    } else if (loggedInUser.role === 'teacher') {
      navigate('/teacherdashboard');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onContinue={() => navigate('/login')} />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

      {/* Protected routes */}
      <Route path="/*" element={<AppRoutes user={user} onLogout={handleLogout} />} />

      {/* Catch all unknown */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
