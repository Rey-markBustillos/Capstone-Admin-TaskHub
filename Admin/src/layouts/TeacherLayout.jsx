// src/layouts/TeacherLayout.jsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

export default function TeacherLayout({ children, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Sidebar 
        role="teacher" 
        onLogout={onLogout} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main 
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
