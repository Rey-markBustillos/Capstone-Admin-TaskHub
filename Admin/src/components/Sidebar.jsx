import React, { useState, useEffect, useContext } from 'react';
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
  Sun,
  Moon,
} from 'lucide-react';
import { StudentThemeContext } from '../contexts/StudentThemeContext';

// Menu items for each role
const menuItemsByRole = {
  admin: [
    { name: 'Dashboard', path: '/admindashboard', icon: <LayoutDashboard size={20} />, badge: 5 },
    { name: 'User Management', path: '/usermanagement', icon: <Users size={20} /> },
    { name: 'Class Management', path: '/classmanagement', icon: <Calendar size={20} />, badge: '20+' },
  ],
  student: [
    { name: 'Dashboard', path: '/studentdashboard', icon: <LayoutDashboard size={20} /> },
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

export default function Sidebar({ role, onLogout, isOpen: isOpenProp, setIsOpen: setIsOpenProp, isOverlay = false }) {
  const studentTheme = role === 'student' ? useContext(StudentThemeContext) : null;
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
  // const sidebarBgClass = colors.sidebarBg; // no longer used
  const borderClass = colors.border;

  // Sidebar background and shadow per role
  let sidebarBg = '';
  let sidebarShadow = '';
   if (role === 'admin') {
     sidebarBg = 'bg-gradient-to-br from-violet-200/80 via-white/60 to-blue-100/80 backdrop-blur-xl';
     sidebarShadow = isOpen ? 'shadow-2xl border-violet-200' : 'border-violet-200';
   } else if (role === 'teacher') {
     sidebarBg = 'bg-white dark:bg-gray-800';
     sidebarShadow = isOpen ? 'shadow-lg border-indigo-800' : 'border-indigo-800';
   } else if (role === 'student') {
     sidebarBg = 'bg-white dark:bg-gray-800';
     sidebarShadow = isOpen ? 'shadow-lg border-blue-800' : 'border-blue-800';
   } else {
     sidebarBg = 'bg-white dark:bg-gray-800';
     sidebarShadow = isOpen ? 'shadow-lg border-gray-200/10' : 'border-gray-200/10';
  }
  return (
    <div
      className={`h-screen flex flex-col justify-between fixed top-0 left-0 transition-all duration-300 ${isOverlay ? 'z-50' : 'z-30'}
        ${isOpen ? (role === 'student' ? 'w-28 sm:w-36 md:w-44' : 'w-44 sm:w-56') : (role === 'student' ? 'w-8 sm:w-10 md:w-12' : 'w-12 sm:w-16')} ${sidebarBg} ${sidebarShadow} ${borderClass} border-r cursor-pointer`}
      style={role === 'admin' ? { boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' } : {}}
      onClick={() => {
        if (typeof setIsOpenProp === 'function') setIsOpenProp(!isOpen);
        else setIsOpen(!isOpen);
      }}
    >
      <div>
        {/* Header at Toggle Button */}
        <div className={`flex flex-col items-center ${borderClass} border-b ${isOpen ? 'px-2 sm:px-4' : 'px-1 sm:px-2'} py-2 sm:py-4 md:py-6`}>
          {isOpen && (
            <>
              {/* Profile section at the very top */}
              <span className="flex items-center gap-1 sm:gap-2 text-sm sm:text-lg md:text-2xl font-extrabold text-violet-700 tracking-tight drop-shadow mb-1 sm:mb-2">
                <img
                  src="/taskhublogos.png"
                  alt="TaskHub Logo"
                  className="w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 object-contain"
                  style={{ minWidth: '1rem' }}
                />
                <span className="hidden sm:inline">TaskHub</span>
                <span className="sm:hidden text-xs">TH</span>
              </span>
              
              {/* Profile sections - consistent layout for all roles */}
              {/* Profile circles removed for clean UI */}
            </>
          )}
        </div>

        {/* Menu Items */}
        <ul className="flex-1 space-y-1 sm:space-y-2 mt-3 sm:mt-6 px-1 sm:px-2">
          {menuItems.map(({ name, path, icon, badge }) => (
            <li key={path}>
              <NavLink
                to={path}
                title={name}
                className={({ isActive }) =>
                  `flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 group
                  ${isOpen ? '' : 'justify-center'}
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-500 to-blue-400 text-white shadow-lg scale-105'
                      : 'hover:bg-violet-100/80 hover:scale-105 ' + colors.text
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`transition-transform duration-200 group-hover:scale-125 group-hover:rotate-6 ${isActive ? 'text-white' : 'text-violet-500'}`}>{
                      React.cloneElement(icon, { size: isOpen ? (window.innerWidth < 640 ? 20 : 28) : 20 })
                    }</span>
                    {isOpen && <span className="flex-1 truncate text-xs sm:text-base font-semibold tracking-wide">{name}</span>}
                    {isOpen && badge && role !== 'student' && (
                      <span className={`text-[10px] sm:text-xs font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-white px-1 sm:px-2 py-0.5 rounded-full shadow`}>{badge}</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Light Mode Toggle for Students - Above Logout */}
      {role === 'student' && studentTheme && (
        <div className="px-2 sm:px-3 pb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              studentTheme.toggleLightMode();
            }}
            className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
              studentTheme.isLightMode 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
            } ${isOpen ? 'justify-start' : 'justify-center'} shadow-sm hover:shadow-md`}
            title={studentTheme.isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md">
              {studentTheme.isLightMode ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            {isOpen && <span className="text-sm font-medium">{studentTheme.isLightMode ? 'Dark' : 'Light'} Mode</span>}
          </button>
        </div>
      )}

      {/* Logout */}
      <div className={`p-2 sm:p-3 ${borderClass} border-t bg-gradient-to-r from-red-100/60 to-white/0`}>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-lg sm:rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200
            ${isOpen ? 'justify-start' : 'justify-center'}`}
          title="Logout"
        >
          <span className="transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-6"><DoorClosed size={isOpen ? (window.innerWidth < 640 ? 20 : 28) : 20} /></span>
          {isOpen && <span className="text-xs sm:text-base font-semibold tracking-wide">Logout</span>}
        </button>
      </div>
    </div>
  );
}