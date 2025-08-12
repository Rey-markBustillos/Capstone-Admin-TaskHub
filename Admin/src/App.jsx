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
import TeacherAnnouncement from './Teachers/TeacherAnnouncement';
import CreateActivity from './Teachers/CreateActivity';
import StudentList from './Teachers/Studentlist';

import LandingPage from './LandingPage/LandingPage';
import Login from './LandingPage/Login';

// HOC for Protected Routes
const ProtectedRoute = ({ user, requiredRole, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />; // Create an unauthorized page
  }

  return children;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Check if user object and role exist
        if (parsedUser && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // Clear invalid data from storage
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
      // Set loading to false after check is complete
      setLoading(false);
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

  // Show a loading indicator while checking for user
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage onContinue={() => navigate('/login')} />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/unauthorized" element={<h1>Unauthorized</h1>} />

      {/* Admin Routes */}
      <Route
        path="/admindashboard"
        element={
          <ProtectedRoute user={user} requiredRole="admin">
            <AdminLayout onLogout={handleLogout}>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usermanagement"
        element={
          <ProtectedRoute user={user} requiredRole="admin">
            <AdminLayout onLogout={handleLogout}>
              <UserManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classmanagement"
        element={
          <ProtectedRoute user={user} requiredRole="admin">
            <AdminLayout onLogout={handleLogout}>
              <ClassManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/studentdashboard"
        element={
          <ProtectedRoute user={user} requiredRole="student">
            <StudentLayout onLogout={handleLogout}>
              <StudentDashboard />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/studentportal"
        element={
          <ProtectedRoute user={user} requiredRole="student">
            <StudentLayout onLogout={handleLogout}>
              <StudentPortal />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/teacherdashboard"
        element={
          <ProtectedRoute user={user} requiredRole="teacher">
            <TeacherLayout onLogout={handleLogout}>
              <TeacherDashboard />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute user={user} requiredRole="teacher">
            <TeacherLayout onLogout={handleLogout}>
              <TeacherPortal />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/activitymonitoring"
        element={
          <ProtectedRoute user={user} requiredRole="teacher">
            <TeacherLayout onLogout={handleLogout}>
              <ActivityMonitoring />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:classId/announcements"
        element={
          <ProtectedRoute user={user} requiredRole="teacher">
            <TeacherLayout onLogout={handleLogout}>
              <TeacherAnnouncement />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:classId/createactivity"
        element={
          <ProtectedRoute user={user} requiredRole="teacher">
            <TeacherLayout onLogout={handleLogout}>
              <CreateActivity />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:classId/studentlist"
        element={
          <ProtectedRoute user={user} requiredRole="teacher">
            <TeacherLayout onLogout={handleLogout}>
              <StudentList />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}