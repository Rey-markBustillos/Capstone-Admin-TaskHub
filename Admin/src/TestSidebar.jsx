import React, { useState } from 'react';
import { BrowserRouter, NavLink } from 'react-router-dom';

const menuItemsByRole = {
  admin: [
    { name: 'Dashboard', path: '/admindashboard' },
    { name: 'Activity Management', path: '/activitymanagement' },
    { name: 'Grading & Feedback', path: '/gradingandfeedback' },
    { name: 'Submission Monitoring', path: '/submissionmonitoring' },
    { name: 'User Management', path: '/usermanagement' },
    { name: 'Class Management', path: '/classmanagement' },
  ],
  student: [
    { name: 'Dashboard', path: '/studentdashboard' },
    { name: 'Activity Submission', path: '/studentactivitysubmission' },
  ],
};

export default function TestSidebar() {
  const [role, setRole] = useState('admin');

  const handleLogout = () => {
    alert('Logout clicked');
  };

  const menuItems = menuItemsByRole[role] || [];

  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: '250px',
            height: '100vh',
            backgroundColor: '#1a1a2e',
            color: '#fff',
            padding: '20px',
            boxSizing: 'border-box',
            position: 'fixed',
            top: 0,
            left: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {role.charAt(0).toUpperCase() + role.slice(1)} Menu
            </h2>
            <nav>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {menuItems.map(({ name, path }) => (
                  <li key={path} style={{ marginBottom: '12px' }}>
                    <NavLink
                      to={path}
                      style={({ isActive }) => ({
                        color: isActive ? '#4ecca3' : '#fff',
                        textDecoration: 'none',
                        fontWeight: isActive ? 'bold' : 'normal',
                        fontSize: '16px',
                      })}
                    >
                      {name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e94560',
              border: 'none',
              padding: '10px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderRadius: '4px',
              width: '100%',
            }}
          >
            Logout
          </button>
        </aside>

        {/* Main content */}
        <main style={{ marginLeft: '250px', padding: '20px', flex: 1 }}>
          <div>
            <h1>Test Page Content</h1>
            <p>Select role:</p>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
            </select>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

