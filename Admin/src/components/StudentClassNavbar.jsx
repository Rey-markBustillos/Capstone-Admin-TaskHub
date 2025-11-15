import React, { useState, useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FaBullhorn, FaTasks, FaUsers, FaArrowLeft, FaBars, FaTimes, FaChalkboardTeacher, FaClock, FaMapMarkerAlt, FaBook } from 'react-icons/fa';
import SidebarContext from '../contexts/SidebarContext';

const StudentClassNavbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);
  const handleHamburgerClick = () => setOpen(!open);

  if (!classId) return null;

  // Helper to get teacher name regardless of API shape
  const getTeacherName = (cls) => {
    if (!cls) return '';
    // If populated (object)
    if (cls.teacher && typeof cls.teacher === 'object' && cls.teacher.name) {
      return cls.teacher.name;
    }
    // If denormalized (string)
    if (cls.teacherName) return cls.teacherName;
    // If teacher is string (id), fallback
    return '';
  };

  return (
    <>
      {/* Class Details Bar - Simplified & Clean */}
      {selectedClass && (
        <div className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 text-white px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between shadow-lg border-b border-indigo-400/30 transition-all duration-200 ease-in-out overflow-hidden">
          {/* Left side - Class info */}
          <div className={`flex items-center gap-3 sm:gap-4 min-w-0 flex-1 ${isSidebarOpen ? 'ml-44' : 'ml-12'}`}>
            <span className="bg-white/20 p-2 sm:p-3 rounded-xl shadow-lg flex items-center justify-center flex-shrink-0">
              <FaChalkboardTeacher className="text-white text-lg sm:text-xl" />
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-lg sm:text-xl font-bold tracking-wide truncate">{selectedClass.className}</span>
              <span className="text-sm text-indigo-100 truncate">{getTeacherName(selectedClass) || 'No teacher assigned'}</span>
            </div>
          </div>
          
          {/* Right side - Quick info */}
          <div className="hidden sm:flex items-center gap-4 flex-shrink-0 mr-4">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <FaClock className="text-indigo-200 text-sm flex-shrink-0" />
              <span className="text-sm font-medium truncate max-w-32">{selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
              <FaMapMarkerAlt className="text-indigo-200 text-sm flex-shrink-0" />
              <span className="text-sm font-medium truncate">{selectedClass.roomNumber || 'No room'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation - Modern & Clean */}
      <nav className={`w-full bg-white/98 backdrop-blur-md text-gray-800 px-4 py-3.5 flex justify-between items-center sticky top-0 z-30 shadow-sm border-b border-gray-200/60 transition-all duration-200 ease-in-out overflow-hidden ${isSidebarOpen ? 'ml-44' : 'ml-12'}`}>
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 text-sm min-w-0 flex-1">
          <NavLink to="/studentportal" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-medium flex-shrink-0 group">
            <FaArrowLeft className="text-xs group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Classes</span>
          </NavLink>
          <span className="text-gray-300 hidden sm:inline">/</span>
          <span className="text-gray-700 font-semibold truncate">{selectedClass?.className || 'Class'}</span>
        </div>

        {/* Desktop Menu - Modern Pills with Better Spacing */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-shrink-0">
          <NavLink
            to={`/student/class/${classId}/announcements`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm'
              }`
            }
          >
            <FaBullhorn className="text-sm flex-shrink-0" />
            <span className="hidden lg:inline">Announcements</span>
            <span className="lg:hidden">News</span>
          </NavLink>
          <NavLink
            to={`/student/class/${classId}/activities`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm'
              }`
            }
          >
            <FaTasks className="text-sm flex-shrink-0" />
            <span className="hidden lg:inline">Activities</span>
            <span className="lg:hidden">Tasks</span>
          </NavLink>
          <NavLink
            to={`/student/class/${classId}/classlist`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm'
              }`
            }
          >
            <FaUsers className="text-sm flex-shrink-0" />
            <span className="hidden lg:inline">Class List</span>
            <span className="lg:hidden">People</span>
          </NavLink>
          <NavLink
            to={`/student/class/${classId}/modules`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap min-w-fit ${
                isActive
                  ? 'bg-indigo-500 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm'
              }`
            }
          >
            <FaBook className="text-sm flex-shrink-0" />
            <span className="hidden lg:inline">Modules</span>
            <span className="lg:hidden">Books</span>
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={handleHamburgerClick} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors duration-200" aria-label="Toggle menu">
            {open ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown - Modern Design */}
      {open && (
        <div
          className={`md:hidden fixed inset-0 z-50 transition-all duration-200 ease-in-out ${isSidebarOpen ? 'ml-44' : 'ml-12'}`}
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-16 right-4 left-4 max-w-sm mx-auto bg-white rounded-xl shadow-xl p-4 animate-in slide-in-from-top-2 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="border-b border-gray-200 pb-3 mb-3">
              <h3 className="font-semibold text-gray-800">Navigation</h3>
            </div>
            
            {/* Mobile Menu Items - Improved Spacing */}
            <div className="space-y-1">
              <NavLink
                to={`/student/class/${classId}/announcements`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <div className="p-2 rounded-lg bg-indigo-100">
                  <FaBullhorn className="text-sm text-indigo-600" />
                </div>
                <span className="font-medium text-base">Announcements</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/activities`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <div className="p-2 rounded-lg bg-indigo-100">
                  <FaTasks className="text-sm text-indigo-600" />
                </div>
                <span className="font-medium text-base">Activities</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/classlist`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <div className="p-2 rounded-lg bg-indigo-100">
                  <FaUsers className="text-sm text-indigo-600" />
                </div>
                <span className="font-medium text-base">Class List</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/modules`}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <div className="p-2 rounded-lg bg-indigo-100">
                  <FaBook className="text-sm text-indigo-600" />
                </div>
                <span className="font-medium text-base">Modules</span>
              </NavLink>
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>
              
              {/* Back to Classes - Improved */}
              <NavLink 
                to="/studentportal" 
                className="flex items-center gap-4 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                onClick={() => setOpen(false)}
              >
                <div className="p-2 rounded-lg bg-gray-100">
                  <FaArrowLeft className="text-sm text-gray-600" />
                </div>
                <span className="font-medium text-base">Back to Classes</span>
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentClassNavbar;