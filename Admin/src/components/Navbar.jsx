import React, { useState, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import PWAInstallPrompt from './PWAInstallPrompt';
import { formatClassTimeRange } from '../utils/dateTime';
import {
  FaBullhorn,
  FaPlusSquare,
  FaUsers,
  FaArrowLeft,
  FaTimes,
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSchool,
  FaQuestionCircle,
  FaUpload,
  FaChevronDown,
} from 'react-icons/fa';

const Navbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { classId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHamburgerClick = () => setOpen(!open);

  const menuItems = [
    { to: `/class/${classId}/attendance`, icon: FaCalendarAlt, label: 'Attendance' },
    { to: `/class/${classId}/announcements`, icon: FaBullhorn, label: 'Announcement' },
    { to: `/class/${classId}/createactivity`, icon: FaPlusSquare, label: 'Create Activity' },
    { to: `/class/${classId}/createquiz`, icon: FaQuestionCircle, label: 'Quiz Generator' },
    { to: `/class/${classId}/uploadmodule`, icon: FaUpload, label: 'Upload Module' },
    { to: `/class/${classId}/studentlist`, icon: FaUsers, label: 'Student List' },
  ];

  if (!classId) return null;

  return (
    <>
      {/* Top Class Info Bar */}
      {selectedClass && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 sm:px-6 py-4 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaSchool className="text-slate-200 text-xl sm:text-2xl" />
              </div>
              <span className="break-words text-xl font-bold leading-tight sm:text-2xl">
                {selectedClass.className}
              </span>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 text-xs sm:grid-cols-2 sm:text-sm xl:w-auto xl:grid-cols-3">
              <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <FaClock className="text-slate-200" />
                <span className="break-words">
                  <strong>Schedule:</strong> {formatClassTimeRange(selectedClass.time, selectedClass.endTime)}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <FaCalendarAlt className="text-slate-200" />
                <span className="break-words"><strong>Day:</strong> {selectedClass.day || 'N/A'}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <FaMapMarkerAlt className="text-slate-200" />
                <span className="break-words"><strong>Room:</strong> {selectedClass.roomNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-30 border-b-2 border-blue-100">
        <div className="px-4 sm:px-6 py-3">
          {/* Desktop Navigation */}
          <div className="hidden md:flex justify-between items-center">
            {/* Back to Classes */}
            <button
              onClick={() => navigate('/classes')}
              className="flex items-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 text-gray-700 hover:bg-blue-50 font-medium border-2 border-gray-200 hover:border-blue-300 shadow-sm hover:shadow"
            >
              <FaArrowLeft className="text-slate-500" />
              <span>Back to Classes</span>
            </button>

            {/* Menu Items */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {menuItems.map(({ to, icon: IconComponent, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 font-medium border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-300 hover:shadow-sm'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <IconComponent className={isActive ? 'text-white' : 'text-slate-500'} />
                      <span className="hidden lg:inline">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
              <PWAInstallPrompt />
            </div>
          </div>

          {/* Mobile Navigation Header */}
          <div className="flex md:hidden justify-between items-center">
            <button
              onClick={() => navigate('/classes')}
              className="flex items-center gap-2 py-2 px-3 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-blue-50 font-medium border border-gray-200"
            >
              <FaArrowLeft className="text-slate-500" />
              <span className="text-sm">Back</span>
            </button>

            <button
              onClick={handleHamburgerClick}
              className="flex items-center gap-2 py-2 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-blue-50 font-medium border border-gray-200"
              aria-label="Toggle menu"
            >
              <span className="text-sm font-semibold">Menu</span>
              {open ? <FaTimes size={20} className="text-slate-500" /> : <FaChevronDown size={16} className="text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && isMobile && (
          <div className="md:hidden bg-white border-t-2 border-blue-100 shadow-lg animate-fadeIn">
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
              {menuItems.map(({ to, icon: IconComponent, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all duration-200 font-medium border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                        : 'text-gray-700 hover:bg-blue-50 border-gray-100 hover:border-blue-300 hover:shadow-md'
                    }`
                  }
                  onClick={() => setOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      <IconComponent className={`text-2xl ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="text-xs text-center font-semibold">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            <div className="px-4 pb-4">
              <PWAInstallPrompt />
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
