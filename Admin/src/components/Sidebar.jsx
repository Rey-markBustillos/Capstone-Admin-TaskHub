import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  Calendar,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const menuItemsByRole = {
  admin: [
    { name: 'Dashboard', path: '/admindashboard', icon: <LayoutDashboard size={20} />, badge: 5 },
    { name: 'User Management', path: '/usermanagement', icon: <Users size={20} /> },
    { name: 'Class Management', path: '/classmanagement', icon: <Calendar size={20} />, badge: '20+' },
  ],
  student: [
    { name: 'Dashboard', path: '/studentdashboard', icon: <LayoutDashboard size={20} />, badge: 3 },
    { name: 'Classes', path: '/studentportal', icon: <ClipboardList size={20} /> },
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacherdashboard', icon: <LayoutDashboard size={20} />, badge: 2 },
    { name: 'Classes', path: '/classes', icon: <ClipboardList size={20} />, badge: 12 },
    { name: 'Activity Monitoring', path: '/activitymonitoring', icon: <FileText size={20} /> },
  ],
};

export default function Sidebar({ role, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = menuItemsByRole[role] || [];

  return (
    <div
      className={`h-screen flex flex-col justify-between fixed top-0 left-0 transition-all duration-300
        ${isOpen ? 'w-45' : 'w-20'} overflow-hidden sidebar-bg-transparent sidebar-text-color`}
      style={{ zIndex: 20 }}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-between px-2 py-2"> {/* Reduced horizontal padding */}
        <div className="text-2xl font-bold">
          <span className="transform rotate-45">~</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <ul className="flex-1 space-y-2 mt-2 px-1"> {/* Reduced spacing and horizontal padding */}
        {menuItems.map(({ name, path, icon, badge }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${ // Reduced gap and padding
                  isActive
                    ? 'bg-indigo-900 font-semibold'
                    : 'hover:bg-indigo-600 hover:text-white text-indigo-100'
                }`
              }
            >
              {icon}
              {isOpen && <span className="flex-1">{name}</span>}
              {isOpen && badge && (
                <span className="text-xs bg-indigo-500 px-1 py-0.5 rounded-full">{badge}</span> // Reduced horizontal padding
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Logout */}
      <div className="p-2"> {/* Reduced padding */}
        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 rounded focus:outline-none focus:ring-2 focus:ring-red-400" // Reduced vertical padding
        >
          {isOpen ? 'Logout' : <span className="mx-auto block">🚪</span>}
        </button>
      </div>
    </div>
  );
}