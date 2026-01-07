import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import { StudentThemeProvider } from './contexts/StudentThemeContext';

// Import Components
import Sidebar from './components/Sidebar';
import PWAStatus from './components/PWAStatus';
import AdminDashboard from './pages/dashboard';
import UserManagement from './pages/UserManagement';
import ClassManagement from './pages/ClassManagement';
import StudentDashboard from './Students/Dashboard';
import StudentPortal from './Students/StudentPortal';
import StudentClassView from './Students/StudentClassView';
import QuizzHub from './Students/QuizzHub';
import StudentAnnouncements from './Students/StudentAnnouncements';
import StudentActivities from './Students/StudentActivities';
import StudentClassList from './Students/StudentsClassList';
import SubmitActivity from './Students/SubmitActivity';
import StudentAttendance from './Students/Attendance';
import StudentModules from './Students/StudentModules';
import Attendance from './Teachers/Attendance';
import TeacherDashboard from './Teachers/Dashboard';
import TeacherPortal from './Teachers/TeacherPortal';
import ActivityMonitoring from './Teachers/ActivityMonitoring';
import TeacherAnnouncement from './Teachers/TeacherAnnouncement';
import CreateActivity from './Teachers/CreateActivity';
import CreateQuizz from './Teachers/CreateQuizz';
import StudentList from './Teachers/Studentlist';
import UploadModule from './Teachers/UploadModule';
import TeacherClassView from './Teachers/TeacherClassView'; // AYOS: Import ng bagong layout
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

// Main Layout para sa mga authenticated users
const ProtectedLayout = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return <Navigate to="/login" />;

  // Custom background logic
  const isAdmin = user.role === 'admin';
  const isStudentDashboard = location.pathname.startsWith('/studentdashboard');
  const isStudentPortal = location.pathname.startsWith('/studentportal');
  const isStudentClass = location.pathname.startsWith('/student/class/');
  const isStudent = user.role === 'student';
  const hasCustomBackground = 
    location.pathname.includes('/teacherdashboard') || 
    location.pathname.includes('/classes') ||
    location.pathname.startsWith('/class/'); // Para sa TeacherClassView

  // Set bg-gray-300 for admin, gradient for student portal, default for others
  const backgroundClass = isAdmin
    ? 'bg-gray-300'
    : isStudentPortal
      ? 'bg-gradient-to-br from-indigo-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'
      : hasCustomBackground
        ? ''
        : 'bg-gray-100 dark:bg-gray-900';

  // Ibalik ang sidebar sa student dashboard/portal, pero alisin ang margin sa main
  if (isStudent && (isStudentDashboard || isStudentPortal || isStudentClass)) {
    return (
      <StudentThemeProvider>
        <SidebarProvider isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
          <div className={`flex min-h-screen ${backgroundClass}`}>
            <Sidebar 
              role={user.role} 
              onLogout={onLogout} 
              isOpen={isSidebarOpen} 
              setIsOpen={setIsSidebarOpen}
              isOverlay={isStudentClass}
            />
            <main className={`flex-1 transition-all duration-300 ${isStudentClass ? 'ml-0' : (isSidebarOpen ? 'ml-36 sm:ml-44' : 'ml-10 sm:ml-12')}`}>
              <Outlet />
            </main>
          </div>
        </SidebarProvider>
      </StudentThemeProvider>
    );
  }

  return (
    <div className={`flex min-h-screen ${backgroundClass}`}>
      <Sidebar 
        role={user.role} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-56' : 'ml-16'}`}>
        <Outlet /> {/* Dito lalabas ang mga nested routes */}
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
    <>
      <PWAStatus />
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
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="activities" element={<StudentActivities />} />
          <Route path="quiz" element={<QuizzHub />} />
          <Route path="classlist" element={<StudentClassList />} />
          <Route path="modules" element={<StudentModules />} />
        </Route>
        <Route path="/student/class/:classId/activity/:activityId/submit" element={<SubmitActivity />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute user={user} requiredRole="teacher"><ProtectedLayout user={user} onLogout={handleLogout} /></ProtectedRoute>}>
        <Route path="/teacherdashboard" element={<TeacherDashboard />} />
        <Route path="/classes" element={<TeacherPortal />} />
  <Route path="/activitymonitoring" element={<ActivityMonitoring />} />
        
        {/* AYOS: Binalot ang mga class-specific routes sa TeacherClassView */}
    <Route path="/class/:classId" element={<TeacherClassView />}> 
      <Route index element={<Navigate to="announcements" replace />} />
      <Route path="announcements" element={<TeacherAnnouncement />} />
      <Route path="attendance" element={<Attendance />} />
  <Route path="createactivity" element={<CreateActivity />} />
  <Route path="createquiz" element={<CreateQuizz />} />
  <Route path="studentlist" element={<StudentList />} />
  <Route path="uploadmodule" element={<UploadModule />} />
    </Route>
      </Route>
      
      {/* Fallback for any other authenticated route */}
      <Route path="*" element={user ? <Navigate to={
          user.role === 'admin' ? '/admindashboard' :
          user.role === 'teacher' ? '/teacherdashboard' :
          '/studentdashboard'
        } replace /> : <Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}