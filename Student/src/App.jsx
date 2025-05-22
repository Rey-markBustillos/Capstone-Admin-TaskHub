import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SideNav from './components/SideNav';
import StudentDashboard from './Pages/Dashboard';
import ClassEnrollmentInfo from './Pages/ClassEnrollmentInfo';
import StudentActivitySubmission from './Pages/Submit Act';


function App() {
  return (
    <div>
      <SideNav />
      <div className="p-6">
        <Routes>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/classes" element={<ClassEnrollmentInfo />} />
          <Route path="/submitact" element={<StudentActivitySubmission />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
