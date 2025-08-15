import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';

// Import Components
import Sidebar from './components/Sidebar'; // Siguraduhing tama ang path
import AdminDashboard from './pages/dashboard';
import UserManagement from './pages/UserManagement';
import ClassManagement from './pages/ClassManagement';
import StudentDashboard from './Students/Dashboard';
import StudentPortal from './Students/StudentPortal';
import StudentClassView from './Students/StudentClassView';
import StudentAnnouncements from './Students/StudentAnnouncements';
import StudentActivities from './Students/StudentActivities';
import StudentClassList from './Students/StudentsClassList';
import SubmitActivity from './Students/SubmitActivity';
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
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

// Component to redirect logged-in users
const RedirectIfLoggedIn = ({ user, children }) => {
  if (user) {
    const dashboardPath =
      user.role === 'admin' ? '/admindashboard' :
      user.role === 'teacher' ? '/teacherdashboard' :
      '/studentdashboard';
    return <Navigate to={dashboardPath} replace />;
  }
  return children;
};

// Main Layout for authenticated users (handles sidebar and content margin)
const ProtectedLayout = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex bg-gray-100 dark:bg-gray-900 min-h-screen">
      <Sidebar 
        role={user.role} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-56' : 'ml-16'}`}>
        <Outlet /> {/* Dito lalabas ang mga nested routes (e.g., Dashboard, UserManagement) */}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    const dashboardPath =
      loggedInUser.role === 'admin' ? '/admindashboard' :
      loggedInUser.role === 'teacher' ? '/teacherdashboard' :
      '/studentdashboard';
    navigate(dashboardPath);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading...</h2>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<RedirectIfLoggedIn user={user}><LandingPage onContinue={() => navigate('/login')} /></RedirectIfLoggedIn>} />
      <Route path="/login" element={<RedirectIfLoggedIn user={user}><Login onLoginSuccess={handleLoginSuccess} onBack={() => navigate('/')} /></RedirectIfLoggedIn>} />
      <Route path="/unauthorized" element={<div className="flex justify-center items-center h-screen"><h1 className="text-2xl">Unauthorized Access</h1></div>} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute user={user} requiredRole="admin"><ProtectedLayout user={user} onLogout={handleLogout} /></ProtectedRoute>}>
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/usermanagement" element={<UserManagement />} />
        <Route path="/classmanagement" element={<ClassManagement />} />
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute user={user} requiredRole="student"><ProtectedLayout user={user} onLogout={handleLogout} /></ProtectedRoute>}>
        <Route path="/studentdashboard" element={<StudentDashboard />} />
        <Route path="/studentportal" element={<StudentPortal />} />
        <Route path="/student/class/:classId" element={<StudentClassView />}>
          <Route index element={<Navigate to="announcements" replace />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="activities" element={<StudentActivities />} />
          <Route path="classlist" element={<StudentClassList />} />
        </Route>
        <Route path="/student/class/:classId/activity/:activityId/submit" element={<SubmitActivity />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute user={user} requiredRole="teacher"><ProtectedLayout user={user} onLogout={handleLogout} /></ProtectedRoute>}>
        <Route path="/teacherdashboard" element={<TeacherDashboard />} />
        <Route path="/classes" element={<TeacherPortal />} />
        <Route path="/activitymonitoring" element={<ActivityMonitoring />} />
        <Route path="/class/:classId/announcements" element={<TeacherAnnouncement />} />
        <Route path="/class/:classId/createactivity" element={<CreateActivity />} />
        <Route path="/class/:classId/studentlist" element={<StudentList />} />
      </Route>
      
      {/* Fallback for any other authenticated route */}
      <Route path="*" element={user ? <Navigate to={
          user.role === 'admin' ? '/admindashboard' :
          user.role === 'teacher' ? '/teacherdashboard' :
          '/studentdashboard'
        } replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}