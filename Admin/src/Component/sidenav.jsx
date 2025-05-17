import React from "react";
import { Link } from "react-router-dom";
import "../Css/sidenav.css"; // Optional: create for custom styles

const Sidenav = () => {
  return (
    <nav className="sidenav">
      <ul>
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/activitymanagement">Activity Management</Link>
        </li>
        <li>
          <Link to="/gradingandfeedback">Grading & Feedback</Link>
        </li>
        <li>
          <Link to="/submissionmonitoring">Submission Monitoring</Link>
        </li>
        <li>
          <Link to="/usermanagement">User Management</Link>
        </li>
        <li>
          <Link to="/classmanagement">Class Management</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidenav;