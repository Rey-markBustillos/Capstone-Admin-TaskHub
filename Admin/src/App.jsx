import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard';
import ActivityManagement from './pages/activity management';
import GradingAndFeedback from './pages/grading and feedback';
import SubmissionMonitoring from './pages/submission monitoring';
import UserManagement from './pages/user management';
import Sidenav from './Component/sidenav';
import ClassManagement from './pages/class manager';

function App() {
  return (
    <div style={{ display: "flex" }}>
      <Sidenav />
      <div style={{ flex: 1, padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="activitymanagement" element={<ActivityManagement />} />
          <Route path="gradingandfeedback" element={<GradingAndFeedback />} />
          <Route path="submissionmonitoring" element={<SubmissionMonitoring />} />
          <Route path="usermanagement" element={<UserManagement />} />
          <Route path="classmanagement" element={<ClassManagement />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;