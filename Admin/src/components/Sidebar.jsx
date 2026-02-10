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
  LogOut,
  Sun,
  Moon,
  GraduationCap,
  BookOpen,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { StudentThemeContext } from '../contexts/StudentThemeContext';

// Menu items for each role with updated icons
const menuItemsByRole = {
  admin: [
    { name: 'Dashboard', path: '/admindashboard', icon: <LayoutDashboard size={20} />, badge: 5 },
    { name: 'User Management', path: '/usermanagement', icon: <Users size={20} /> },
    { name: 'Class Management', path: '/classmanagement', icon: <Calendar size={20} />, badge: '20+' },
  ],
  student: [
    { name: 'Dashboard', path: '/studentdashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Classes', path: '/studentportal', icon: <BookOpen size={20} /> },
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacherdashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Classes', path: '/classes', icon: <BookOpen size={20} /> },
    { name: 'Activity Monitoring', path: '/activitymonitoring', icon: <BarChart3 size={20} /> },
  ],
};

// Professional Blue & White color schemes
const colorSchemes = {
  admin: {
    active: 'bg-blue-600 text-white shadow-lg',
    hover: 'hover:bg-blue-50',
    text: 'text-gray-700',
    badge: 'bg-blue-600 text-white',
    icon: 'text-blue-600',
    sidebarBg: 'bg-white border-r-2 border-blue-100',
    headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
  },
  teacher: {
    active: 'bg-blue-600 text-white shadow-lg',
    hover: 'hover:bg-blue-50',
    text: 'text-gray-700',
    badge: 'bg-blue-600 text-white',
    icon: 'text-blue-600',
    sidebarBg: 'bg-white border-r-2 border-blue-100',
    headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
  },
  student: {
    active: 'bg-blue-600 text-white shadow-lg',
    hover: 'hover:bg-blue-50',
    text: 'text-gray-700',
    badge: 'bg-blue-600 text-white',
    icon: 'text-blue-600',
    sidebarBg: 'bg-white border-r-2 border-blue-100',
    headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
  },
  default: {
    active: 'bg-blue-600 text-white shadow-lg',
    hover: 'hover:bg-blue-50',
    text: 'text-gray-700',
    badge: 'bg-blue-600 text-white',
    icon: 'text-blue-600',
    sidebarBg: 'bg-white border-r-2 border-blue-100',
    headerBg: 'bg-gradient-to-r from-blue-600 to-blue-700',
  },
};

export default function Sidebar({ role, onLogout, isOpen: isOpenProp, setIsOpen: setIsOpenProp, isOverlay = false }) {
  const studentThemeContext = useContext(StudentThemeContext);
  const studentTheme = role === 'student' ? studentThemeContext : null;
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (typeof setIsOpenProp === 'function') {
        setIsOpenProp(!mobile);
      } else {
        setIsOpen(!mobile);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpenProp]);

  // Sync with parent component
  useEffect(() => {
    if (typeof isOpenProp === 'boolean' && !isMobile) {
      setIsOpen(isOpenProp);
    }
  }, [isOpenProp, isMobile]);

  const menuItems = menuItemsByRole[role] || [];
  const colors = colorSchemes[role] || colorSchemes.default;

  // Use prop state if provided (controlled), otherwise use local state
  const isActuallyOpen = typeof isOpenProp === 'boolean' ? isOpenProp : isOpen;

  const toggleSidebar = () => {
    if (typeof setIsOpenProp === 'function') {
      setIsOpenProp(!isActuallyOpen);
    } else {
      setIsOpen(!isActuallyOpen);
    }
  };

  const handleMenuItemClick = () => {
    // Close sidebar when menu item is clicked (both mobile and desktop)
    if (typeof setIsOpenProp === 'function') {
      setIsOpenProp(false);
    } else {
      setIsOpen(false);
    }
  };

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <div
        className={`h-screen flex flex-col fixed top-0 left-0 transition-all duration-300 ${isOverlay ? 'z-50' : 'z-40'} ${colors.sidebarBg} shadow-xl
          ${isActuallyOpen ? 'w-64' : 'w-20'}`}
      >
        {/* Header Section */}
        <div 
          className={`${colors.headerBg} ${isActuallyOpen ? 'px-6' : 'px-4'} py-5 flex items-center justify-between cursor-pointer`}
          onClick={toggleSidebar}
        >
          {isActuallyOpen ? (
            <div className="flex items-center gap-3">
              <GraduationCap className="text-white" size={32} />
              <span className="text-xl font-bold text-white tracking-tight">TaskHub</span>
            </div>
          ) : (
            <GraduationCap className="text-white mx-auto" size={28} />
          )}
          
          {/* Toggle button */}
          <button
            onClick={toggleSidebar}
            className={`${isActuallyOpen ? 'block' : 'hidden'} text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors`}
            aria-label="Toggle Sidebar"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Collapsed Toggle Button */}
        {!isActuallyOpen && (
          <button
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
            aria-label="Expand Sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map(({ name, path, icon, badge }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  onClick={handleMenuItemClick}
                  title={name}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                    ${isActuallyOpen ? '' : 'justify-center'}
                    ${isActive ? colors.active : `${colors.text} ${colors.hover}`}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-white' : colors.icon}>
                        {React.cloneElement(icon, { size: 22 })}
                      </span>
                      {isActuallyOpen && (
                        <>
                          <span className="flex-1 text-sm">{name}</span>
                          {badge && (
                            <span className={`text-xs font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Section */}
        <div className="p-3 border-t-2 border-blue-100 bg-gray-50">
          <div className="flex flex-col gap-2">
            {/* Theme Toggle for Students */}
            {role === 'student' && studentTheme && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  studentTheme.toggleLightMode();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium
                  ${studentTheme.isLightMode ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-gray-100'}
                  ${isActuallyOpen ? 'justify-start' : 'justify-center'}`}
                title={studentTheme.isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {studentTheme.isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                {isActuallyOpen && <span className="text-sm">{studentTheme.isLightMode ? 'Dark Mode' : 'Light Mode'}</span>}
              </button>
            )}
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md
                ${isActuallyOpen ? 'justify-start' : 'justify-center'}`}
              title="Logout"
            >
              <LogOut size={20} />
              {isActuallyOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mobile Bottom Navigation
  return (
    <>
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-white" size={28} />
            <span className="text-lg font-bold text-white">TaskHub</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            aria-label="Toggle Menu"
          >
            {isActuallyOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      {isActuallyOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={toggleSidebar}
          />
          
          {/* Slide-in Menu */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="text-white" size={32} />
                  <span className="text-xl font-bold text-white">TaskHub</span>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 py-6 px-4 overflow-y-auto">
                <ul className="space-y-2">
                  {menuItems.map(({ name, path, icon, badge }) => (
                    <li key={path}>
                      <NavLink
                        to={path}
                        onClick={handleMenuItemClick}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                          ${isActive ? colors.active : `${colors.text} ${colors.hover}`}`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className={isActive ? 'text-white' : colors.icon}>
                              {React.cloneElement(icon, { size: 22 })}
                            </span>
                            <span className="flex-1 text-sm">{name}</span>
                            {badge && (
                              <span className={`text-xs font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
                                {badge}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Footer Buttons */}
              <div className="p-4 border-t-2 border-blue-100 bg-gray-50">
                <div className="flex flex-col gap-2">
                  {/* Theme Toggle for Students */}
                  {role === 'student' && studentTheme && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        studentTheme.toggleLightMode();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium
                        ${studentTheme.isLightMode ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-gray-700 hover:bg-gray-600 text-gray-100'}`}
                    >
                      {studentTheme.isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                      <span className="text-sm">{studentTheme.isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                  )}
                  
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      handleMenuItemClick();
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md"
                  >
                    <LogOut size={20} />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer for top bar */}
      <div className="h-14" />
    </>
  );
}