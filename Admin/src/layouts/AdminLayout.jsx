// src/layouts/AdminLayout.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';

export default function AdminLayout({ children, onLogout }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar role="admin" onLogout={onLogout} />
      <main style={{ marginLeft: 250, padding: 20, flex: 1 }}>{children}</main>
    </div>
  );
}
