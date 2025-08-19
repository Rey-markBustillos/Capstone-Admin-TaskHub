import React, { useState, useEffect } from 'react';
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

// Menu items for each role
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

// Color schemes for each role
const colorSchemes = {
  admin: {
    active: 'bg-violet-600 text-white',
    hover: 'hover:bg-violet-100',
    text: 'text-gray-700',
    badge: 'bg-violet-500 text-white',
    icon: 'text-gray-800',
    sidebarBg: 'bg-gray-200', // solid gray-200 for admin sidebar
    border: 'border-gray-200/10',
  },
  teacher: {
    active: 'bg-indigo-700 text-white',
    hover: 'hover:bg-indigo-800/70',
    text: 'text-gray-100',
    badge: 'bg-indigo-600 text-white',
    icon: 'text-indigo-200',
    sidebarBg: 'bg-white dark:bg-gray-800',
    border: 'border-indigo-800',
  },
  student: {
    active: 'bg-blue-700 text-white',
    hover: 'hover:bg-blue-800/70',
    text: 'text-gray-100',
    badge: 'bg-blue-600 text-white',
    icon: 'text-blue-200',
    sidebarBg: 'bg-white dark:bg-gray-800',
    border: 'border-blue-800',
  },
  default: {
    active: 'bg-gray-700 text-white',
    hover: 'hover:bg-gray-700',
    text: 'text-gray-200',
    badge: 'bg-violet-500 text-white',
    icon: 'text-gray-300',
    sidebarBg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200/10',
  },
};

export default function Sidebar({ role, onLogout, isOpen: isOpenProp, setIsOpen: setIsOpenProp }) {
  const [isOpen, setIsOpen] = useState(
    typeof isOpenProp === 'boolean' ? isOpenProp : window.innerWidth > 768
  );

  // Allow parent to control sidebar open state if props are provided
  useEffect(() => {
    if (typeof isOpenProp === 'boolean') setIsOpen(isOpenProp);
  }, [isOpenProp]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof setIsOpenProp === 'function') {
        setIsOpenProp(window.innerWidth > 768);
      } else {
        setIsOpen(window.innerWidth > 768);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpenProp]);

  const menuItems = menuItemsByRole[role] || [];
  const colors = colorSchemes[role] || colorSchemes.default;
  const sidebarBgClass = colors.sidebarBg;
  const borderClass = colors.border;

  return (
    <div
      className={`h-screen flex flex-col justify-between fixed top-0 left-0 transition-all duration-300 z-30
        ${isOpen ? 'w-56' : 'w-16'} ${sidebarBgClass} ${colors.icon} shadow-lg ${borderClass} border-r`}
    >
      <div>
        {/* Header at Toggle Button */}
        <div className={`flex items-center h-16 ${borderClass} border-b ${isOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
          {isOpen && <span className={`text-xl font-bold ${colors.text}`}>TaskHub</span>}
          <button
            onClick={() => {
              if (typeof setIsOpenProp === 'function') setIsOpenProp(!isOpen);
              else setIsOpen(!isOpen);
            }}
            className={`p-1.5 rounded-full ${colors.hover} focus:outline-none focus:ring-2 focus:ring-violet-400`}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Menu Items */}
        <ul className="flex-1 space-y-2 mt-4 px-2">
          {menuItems.map(({ name, path, icon, badge }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2.5 rounded-lg transition-colors
                  ${isOpen ? '' : 'justify-center'}
                  ${
                    isActive
                      ? `${colors.active} font-semibold shadow-md`
                      : `${colors.hover} ${colors.text}`
                  }`
                }
                title={name}
              >
                {icon}
                {isOpen && <span className="flex-1 truncate">{name}</span>}
                {isOpen && badge && (
                  <span className={`text-xs font-medium ${colors.badge} px-2 py-0.5 rounded-full`}>{badge}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Logout */}
      <div className={`p-2 ${borderClass} border-t`}>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 p-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400
            ${isOpen ? 'justify-start' : 'justify-center'}`}
          title="Logout"
        >
          <DoorClosed size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}