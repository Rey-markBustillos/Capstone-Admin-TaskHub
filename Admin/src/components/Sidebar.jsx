import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Folder,
  Users,
  Calendar,
} from 'lucide-react';

const menuItemsByRole = {
  admin: [
    { name: 'Dashboard', path: '/admindashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'User Management', path: '/usermanagement', icon: <Users size={20} /> },
    { name: 'Class Management', path: '/classmanagement', icon: <Calendar size={20} /> },
  ],
  student: [
    { name: 'Dashboard', path: '/studentdashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Classes', path: '/studentportal', icon: <ClipboardList size={20} /> },
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacherdashboard', icon: <LayoutDashboard size={20} /> },  
    { name: 'Classes', path: '/classes', icon: <ClipboardList size={20} /> },  
  ],
};

export default function Sidebar({ role, onLogout }) {
  const menuItems = menuItemsByRole[role] || [];

  return (
    <div className="w-64 h-screen bg-gray-900 text-white flex flex-col justify-between fixed top-0 left-0 p-6 box-border">
      <nav>
        <h2 className="text-2xl font-semibold mb-6">
          {role?.charAt(0).toUpperCase() + role?.slice(1)} Menu
        </h2>
        <ul className="space-y-3">
          {menuItems.map(({ name, path, icon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 text-lg px-3 py-2 rounded 
                   ${isActive ? 'bg-teal-500 font-bold text-white' : 'hover:bg-gray-700 hover:text-teal-400'}`
                }
              >
                {icon}
                {name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        onClick={onLogout}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Logout
      </button>
    </div>
  );
}
