// src/layouts/TeacherLayout.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';

export default function StudentLayout({ children, onLogout }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar role="teacher" onLogout={onLogout} />
      <main style={{ marginLeft: 250, padding: 20, flex: 1 }}>{children}</main>
    </div>
  );
}
