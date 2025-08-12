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
  DoorClosed,
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

// Define color schemes for different roles
const colorSchemes = {
  admin: {
    active: 'bg-violet-600 text-white',
    hover: 'hover:bg-violet-100',
    text: 'text-gray-700',
    badge: 'bg-violet-500 text-white',
    icon: 'text-gray-800',
  },
  // AYOS: Pinalitan ang default (para sa student at teacher) sa neutral dark theme
  default: {
    active: 'bg-gray-700 text-white',
    hover: 'hover:bg-gray-700',
    text: 'text-gray-200',
    badge: 'bg-violet-500 text-white',
    icon: 'text-gray-300',
  },
};

export default function Sidebar({ role, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = menuItemsByRole[role] || [];
  // Select color scheme based on role, fallback to default
  const colors = colorSchemes[role] || colorSchemes.default;

  // AYOS: Pinalitan ang background para sa student/teacher sa dark gray
  const sidebarBgClass = role === 'admin' ? 'bg-white' : 'bg-gray-900';

  return (
    <div
      className={`h-screen flex flex-col justify-between fixed top-0 left-0 transition-all duration-300
        ${isOpen ? 'w-56' : 'w-20'} overflow-hidden ${sidebarBgClass} ${colors.icon}`}
      style={{ zIndex: 20 }}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-between px-4 py-3">
        {isOpen && <span className={`text-xl font-bold ${colors.text}`}>TaskHub</span>}
        <button onClick={() => setIsOpen(!isOpen)} className={`p-1 rounded-full ${colors.hover} focus:outline-none`}>
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Menu Items */}
      <ul className="flex-1 space-y-2 mt-2 px-2">
        {menuItems.map(({ name, path, icon, badge }) => (
          <li key={path}>
            <NavLink
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? `${colors.active} font-semibold shadow-md`
                    : `${colors.hover} ${colors.text}`
                }`
              }
            >
              {icon}
              {isOpen && <span className="flex-1">{name}</span>}
              {isOpen && badge && (
                <span className={`text-xs font-medium ${colors.badge} px-2 py-0.5 rounded-full`}>{badge}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {isOpen ? 'Logout' : <DoorClosed size={20} />}
        </button>
      </div>
    </div>
  );
}