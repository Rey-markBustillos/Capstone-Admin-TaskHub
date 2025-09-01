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
  // const sidebarBgClass = colors.sidebarBg; // no longer used
  const borderClass = colors.border;

  // Sidebar background and shadow per role
  let sidebarBg = '';
  let sidebarShadow = '';
   if (role === 'admin') {
     sidebarBg = isOpen ? 'bg-gradient-to-br from-violet-200/80 via-white/60 to-blue-100/80 backdrop-blur-xl' : 'bg-gray-200 dark:bg-gray-800';
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
      className={`h-screen flex flex-col justify-between fixed top-0 left-0 transition-all duration-300 z-30
        ${isOpen ? 'w-44' : 'w-12'} ${sidebarBg} ${sidebarShadow} ${borderClass} border-r cursor-pointer`}
      style={role === 'admin' ? { boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' } : {}}
      onClick={() => {
        if (typeof setIsOpenProp === 'function') setIsOpenProp(!isOpen);
        else setIsOpen(!isOpen);
      }}
    >
      <div>
        {/* Header at Toggle Button */}
        <div className={`flex flex-col items-center ${borderClass} border-b ${isOpen ? 'px-4' : 'px-2'} py-4 sm:py-6`}>
          {isOpen && (
            <>
              {/* Student profile upload and preview at the very top */}
              <span className="flex items-center gap-2 text-lg sm:text-2xl font-extrabold text-violet-700 tracking-tight drop-shadow mb-2">
                <img
                  src="/taskhublogos.png"
                  alt="TaskHub Logo"
                  className="w-7 h-7 sm:w-9 sm:h-9 object-contain"
                  style={{ minWidth: '1.5rem' }}
                />
                TaskHub
              </span>
              {role === 'student' && <StudentProfileAvatar />}
            </>
          )}
        </div>

        {/* Menu Items */}
        <ul className="flex-1 space-y-2 mt-6 px-2">
          {menuItems.map(({ name, path, icon, badge }) => (
            <li key={path}>
              <NavLink
                to={path}
                title={name}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group
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
                      React.cloneElement(icon, { size: 28 })
                    }</span>
                    {isOpen && <span className="flex-1 truncate text-base font-semibold tracking-wide">{name}</span>}
                    {isOpen && badge && (
                      <span className={`text-xs font-bold bg-gradient-to-r from-violet-400 to-blue-400 text-white px-2 py-0.5 rounded-full shadow`}>{badge}</span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Logout */}
      <div className={`p-3 ${borderClass} border-t bg-gradient-to-r from-red-100/60 to-white/0`}>
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-4 p-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200
            ${isOpen ? 'justify-start' : 'justify-center'}`}
          title="Logout"
        >
          <span className="transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-6"><DoorClosed size={28} /></span>
          {isOpen && <span className="text-base font-semibold tracking-wide">Logout</span>}
        </button>
      </div>
    </div>
  );
}

// StudentProfileAvatar: local-only, per-student (localStorage key per user)
function StudentProfileAvatar() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user && user.role === 'student' ? user._id : null;
  const storageKey = studentId ? `student_profile_${studentId}` : 'student_profile_default';
  const [profile, setProfile] = React.useState(() => localStorage.getItem(storageKey) || '');
  const fileInputRef = React.useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfile(ev.target.result);
      localStorage.setItem(storageKey, ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div
        className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gray-200 border-2 border-violet-400 overflow-hidden mb-1 cursor-pointer hover:ring-2 hover:ring-violet-400 transition"
        title="Upload profile picture"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
      >
        {profile ? (
          <img src={profile} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-gray-400 text-xl sm:text-2xl">👤</span>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <span className="text-xs text-gray-500">Profile</span>
      <span className="text-xs text-yellow-600 mt-1 text-center">Click the profile picture to upload or change your photo.</span>
    </div>
  );
}