import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PWAInstallPrompt from './PWAInstallPrompt';
import {
  FaBullhorn,
  FaPlusSquare,
  FaUsers,
  FaArrowLeft,
  FaBars,
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
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHamburgerClick = () => setOpen(!open);

  const menuItems = [
    { to: `/class/${classId}/attendance`, icon: FaCalendarAlt, label: 'Attendance', color: 'green' },
    { to: `/class/${classId}/announcements`, icon: FaBullhorn, label: 'Announcement', color: 'yellow' },
    { to: `/class/${classId}/createactivity`, icon: FaPlusSquare, label: 'Create Activity', color: 'orange' },
    { to: `/class/${classId}/createquiz`, icon: FaQuestionCircle, label: 'Create Quiz', color: 'blue' },
    { to: `/class/${classId}/uploadmodule`, icon: FaUpload, label: 'Upload Module', color: 'purple' },
    { to: `/class/${classId}/studentlist`, icon: FaUsers, label: 'Student List', color: 'indigo' },
  ];

  if (!classId) return null;

  return (
    <>
      {/* Top Class Info Bar */}
      {selectedClass && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 sm:px-6 py-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <FaSchool className="text-white text-xl sm:text-2xl" />
              </div>
              <span className="text-xl sm:text-2xl font-bold">{selectedClass.className}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <FaClock className="text-blue-200" />
                <span><strong>Schedule:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <FaCalendarAlt className="text-blue-200" />
                <span><strong>Day:</strong> {selectedClass.day || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <FaMapMarkerAlt className="text-blue-200" />
                <span><strong>Room:</strong> {selectedClass.roomNumber}</span>
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
              <FaArrowLeft className="text-blue-600" />
              <span>Back to Classes</span>
            </button>

            {/* Menu Items */}
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line no-unused-vars */}
              {menuItems.map(({ to, icon: IconComponent, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 py-2 px-4 rounded-lg transition-all duration-200 text-gray-700 hover:bg-${color}-50 font-medium border border-transparent hover:border-${color}-300 hover:shadow-sm`}
                >
                  <IconComponent className={`text-${color}-600`} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
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
              <FaArrowLeft className="text-blue-600" />
              <span className="text-sm">Back</span>
            </button>

            <button
              onClick={handleHamburgerClick}
              className="flex items-center gap-2 py-2 px-4 rounded-lg transition-colors duration-200 text-gray-700 hover:bg-blue-50 font-medium border border-gray-200"
              aria-label="Toggle menu"
            >
              <span className="text-sm font-semibold">Menu</span>
              {open ? <FaTimes size={20} /> : <FaChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && isMobile && (
          <div className="md:hidden bg-white border-t-2 border-blue-100 shadow-lg animate-fadeIn">
            <div className="p-4 grid grid-cols-2 gap-2">
              {/* eslint-disable-next-line no-unused-vars */}
              {menuItems.map(({ to, icon: IconComponent, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-${color}-50 font-medium border-2 border-gray-100 hover:border-${color}-300 hover:shadow-md`}
                  onClick={() => setOpen(false)}
                >
                  <IconComponent className={`text-${color}-600 text-2xl`} />
                  <span className="text-xs text-center font-semibold">{label}</span>
                </Link>
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