import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Component/LandingPage'; // Corrected path
import LoginPage from './Component/Login';
import AdminDashboard from '../../Admin/src/pages/dashboard';
import TeacherDashboard from '../../Teachers/src/Pages/Dashboard';
import StudentDashboard from '../../Student/src/Pages/Dashboard';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="student" element={<StudentDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
