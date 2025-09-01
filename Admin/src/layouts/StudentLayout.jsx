// src/layouts/StudentLayout.jsx
import React from 'react';

export default function StudentLayout({ children }) {
  // No sidebar, full width main content
  return (
    <main style={{ width: '100%', padding: 0, margin: 0 }}>{children}</main>
  );
//
}
