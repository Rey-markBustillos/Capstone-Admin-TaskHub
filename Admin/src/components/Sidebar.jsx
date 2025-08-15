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

const colorSchemes = {
  admin: {
    active: 'bg-violet-600 text-white',
    hover: 'hover:bg-violet-100',
    text: 'text-gray-700',
    badge: 'bg-violet-500 text-white',
    icon: 'text-gray-800',
  },
  default: {
    active: 'bg-gray-700 text-white',
    hover: 'hover:bg-gray-700',
    text: 'text-gray-200',
    badge: 'bg-violet-500 text-white',
    icon: 'text-gray-300',
  },
};

export default function Sidebar({ role, onLogout }) {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup function to remove the event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array is correct here as we only want to set up the listener once.

  const menuItems = menuItemsByRole[role] || [];
  const colors = colorSchemes[role] || colorSchemes.default;
  const sidebarBgClass = role === 'admin' ? 'bg-white' : 'bg-gray-900';

  /*
    MAHALAGA: Ang main content ng iyong application ay nangangailangan ng `margin-left`
    para hindi matakpan ng sidebar na ito. Idagdag ang class na ito sa iyong main layout container:
    
    <main className={`transition-all duration-300 ${isOpen ? 'ml-56' : 'ml-16'}`}>
      // ... ang iyong page content (e.g., <Routes />)
    </main>
  */

  return (
    <div
      className={`h-screen flex flex-col justify-between fixed top-0 left-0 transition-all duration-300 z-30
        ${isOpen ? 'w-56' : 'w-16'} ${sidebarBgClass} ${colors.icon} shadow-lg`}
    >
      <div>
        {/* Header at Toggle Button */}
        <div className={`flex items-center h-16 border-b border-gray-200/10 ${isOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
          {isOpen && <span className={`text-xl font-bold ${colors.text}`}>TaskHub</span>}
          <button onClick={() => setIsOpen(!isOpen)} className={`p-1.5 rounded-full ${colors.hover} focus:outline-none focus:ring-2 focus:ring-violet-400`}>
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
                title={name} // Tooltip para sa collapsed view
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
      <div className="p-2 border-t border-gray-200/10">
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