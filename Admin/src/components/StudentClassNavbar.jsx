import React, { useState, useContext } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FaBullhorn, FaTasks, FaUsers, FaArrowLeft, FaBars, FaTimes, FaChalkboardTeacher, FaClock, FaMapMarkerAlt, FaBook, FaCalendarAlt, FaSchool, FaCalendarCheck, FaQuestionCircle } from 'react-icons/fa';
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
      {/* Top Class Info Bar */}
      {selectedClass && (
        <div className={`bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-2 sm:py-3 md:py-4 shadow-xl fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)] md:pl-8 lg:pl-12 xl:pl-16 md:pr-4 lg:pr-6 xl:pr-8 px-2 sm:px-3 md:px-4' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)] px-2 sm:px-3 md:px-4 lg:px-6'
        }`}>
          <div className="flex flex-col lg:flex-row lg:flex-wrap justify-start lg:justify-between items-start lg:items-center gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 md:p-2.5 rounded-md sm:rounded-lg shadow-lg">
                <FaSchool className="text-white text-lg sm:text-xl md:text-2xl" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold drop-shadow-md truncate max-w-[160px] sm:max-w-[200px] md:max-w-none">{selectedClass.className}</h1>
                {getTeacherName(selectedClass) && (
                  <div className="text-[9px] sm:text-[10px] md:text-xs text-blue-100 mt-0.5 flex items-center gap-1">
                    <FaChalkboardTeacher className="text-blue-200 text-[10px] sm:text-xs" />
                    <span className="truncate max-w-[140px] sm:max-w-[160px] md:max-w-none"><strong>Teacher:</strong> {getTeacherName(selectedClass)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-[9px] sm:text-[10px] md:text-xs w-full lg:w-auto">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded shadow-sm">
                <FaClock className="text-blue-200 text-[10px] sm:text-xs md:text-sm flex-shrink-0" />
                <span className="font-medium truncate max-w-[80px] sm:max-w-[100px] md:max-w-none text-[9px] sm:text-[10px] md:text-xs"><strong className="text-blue-100">Time:</strong> <span className="sm:hidden">TBA</span><span className="hidden sm:inline">{selectedClass.time ? new Date(selectedClass.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBA'}</span></span>
              </div>
              {selectedClass.day && (
                <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded shadow-sm">
                  <FaCalendarAlt className="text-blue-200 text-[10px] sm:text-xs md:text-sm flex-shrink-0" />
                  <span className="font-medium text-[9px] sm:text-[10px] md:text-xs"><strong className="text-blue-100">Day:</strong> {selectedClass.day}</span>
                </div>
              )}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded shadow-sm">
                <FaMapMarkerAlt className="text-blue-200 text-[10px] sm:text-xs md:text-sm flex-shrink-0" />
                <span className="font-medium text-[9px] sm:text-[10px] md:text-xs"><strong className="text-blue-100">Room:</strong> {selectedClass.roomNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className={`bg-white shadow-lg fixed left-0 right-0 z-30 border-b-2 border-blue-100 transition-all duration-300 ${
        selectedClass ? 'top-[84px] sm:top-[94px] md:top-[108px]' : 'top-0'
      } ${
        isSidebarOpen ? 'md:left-36 lg:left-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:left-10 lg:left-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'
      }`}>
        <div className={`py-2 sm:py-3 md:py-4 transition-all duration-300 ${
          isSidebarOpen ? 'px-3 sm:px-4 md:pl-8 lg:pl-12 xl:pl-16 md:pr-6 lg:pr-8 xl:pr-10' : 'px-3 sm:px-4 md:px-6 lg:px-8'
        }`}>
          {/* Desktop Navigation */}
          <div className="hidden md:flex justify-between items-center gap-3 lg:gap-6 xl:gap-8">
            {/* Back to Classes */}
            <NavLink
              to="/studentportal"
              className="flex items-center gap-2 py-2 md:py-2.5 px-3 md:px-4 lg:px-5 rounded-lg transition-all duration-200 text-gray-700 hover:bg-blue-600 hover:text-white font-semibold border-2 border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg hover:scale-105 min-h-[44px] whitespace-nowrap"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm md:text-base">Back</span>
            </NavLink>

            {/* Menu Items */}
            <div className="flex items-center gap-2 lg:gap-3 xl:gap-4">
              <NavLink
                to={`/student/class/${classId}/attendance`}
                className={({ isActive }) => `flex items-center gap-2 py-2.5 px-3 lg:px-4 rounded-lg transition-all duration-200 font-semibold border-2 min-h-[44px] ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <FaCalendarCheck className="text-lg" />
                <span className="hidden lg:inline">Attendance</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/announcements`}
                className={({ isActive }) => `flex items-center gap-2 py-2.5 px-3 lg:px-4 rounded-lg transition-all duration-200 font-semibold border-2 min-h-[44px] ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <FaBullhorn className="text-lg" />
                <span className="hidden lg:inline">Announcements</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/activities`}
                className={({ isActive }) => `flex items-center gap-2 py-2.5 px-3 lg:px-4 rounded-lg transition-all duration-200 font-semibold border-2 min-h-[44px] ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <FaTasks className="text-lg" />
                <span className="hidden lg:inline">Activities</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/quiz`}
                className={({ isActive }) => `flex items-center gap-2 py-2.5 px-3 lg:px-4 rounded-lg transition-all duration-200 font-semibold border-2 min-h-[44px] ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <FaQuestionCircle className="text-lg" />
                <span className="hidden lg:inline">Quiz</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/modules`}
                className={({ isActive }) => `flex items-center gap-2 py-2.5 px-3 lg:px-4 rounded-lg transition-all duration-200 font-semibold border-2 min-h-[44px] ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <FaBook className="text-lg" />
                <span className="hidden lg:inline">Modules</span>
              </NavLink>
              <NavLink
                to={`/student/class/${classId}/classlist`}
                className={({ isActive }) => `flex items-center gap-2 py-2.5 px-3 lg:px-4 rounded-lg transition-all duration-200 font-semibold border-2 min-h-[44px] ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                    : 'text-gray-700 hover:bg-blue-50 border-transparent hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <FaUsers className="text-lg" />
                <span className="hidden lg:inline">Class List</span>
              </NavLink>
            </div>
          </div>

          {/* Mobile Navigation Header */}
          <div className="flex md:hidden justify-between items-center gap-2">
            <NavLink
              to="/studentportal"
              className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 text-white bg-blue-600 hover:bg-blue-700 font-semibold border-2 border-blue-700 shadow-md hover:shadow-lg min-h-[44px] min-w-[80px] sm:min-w-[90px]"
            >
              <FaArrowLeft className="text-xs sm:text-sm" />
              <span className="text-xs sm:text-sm">Back</span>
            </NavLink>

            <button
              onClick={handleHamburgerClick}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 font-semibold border-2 shadow-md hover:shadow-lg min-h-[44px] min-w-[80px] sm:min-w-[90px] ${
                open 
                  ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' 
                  : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
              }`}
              aria-label="Toggle menu"
            >
              <span className="text-xs sm:text-sm font-bold">{open ? 'Close' : 'Menu'}</span>
              {open ? <FaTimes size={16} className="sm:w-[18px] sm:h-[18px]" /> : <FaBars size={14} className="sm:w-[16px] sm:h-[16px]" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className={`md:hidden bg-gradient-to-b from-blue-50 to-white border-t-2 border-blue-200 shadow-xl animate-fadeIn fixed left-0 right-0 z-20 transition-all duration-300 ${
          selectedClass ? 'top-[134px] sm:top-[144px]' : 'top-[56px]'
        } max-h-[calc(100vh-120px)] overflow-y-auto`}>
          <div className="p-2 sm:p-3 md:p-4 grid grid-cols-2 gap-2 sm:gap-3">
            <NavLink
              to={`/student/class/${classId}/attendance`}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-2 sm:gap-3 py-5 px-2 rounded-xl transition-all duration-200 font-bold border-2 shadow-md hover:shadow-xl hover:scale-105 min-h-[100px] ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400'
              }`}
              onClick={() => setOpen(false)}
            >
              <FaCalendarCheck className="text-3xl" />
              <span className="text-xs sm:text-sm text-center">Attendance</span>
            </NavLink>
            <NavLink
              to={`/student/class/${classId}/announcements`}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-2 sm:gap-3 py-5 px-2 rounded-xl transition-all duration-200 font-bold border-2 shadow-md hover:shadow-xl hover:scale-105 min-h-[100px] ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400'
              }`}
              onClick={() => setOpen(false)}
            >
              <FaBullhorn className="text-3xl" />
              <span className="text-xs sm:text-sm text-center">Announcements</span>
            </NavLink>
            <NavLink
              to={`/student/class/${classId}/activities`}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-2 sm:gap-3 py-5 px-2 rounded-xl transition-all duration-200 font-bold border-2 shadow-md hover:shadow-xl hover:scale-105 min-h-[100px] ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400'
              }`}
              onClick={() => setOpen(false)}
            >
              <FaTasks className="text-3xl" />
              <span className="text-xs sm:text-sm text-center">Activities</span>
            </NavLink>
            <NavLink
              to={`/student/class/${classId}/quiz`}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-2 sm:gap-3 py-5 px-2 rounded-xl transition-all duration-200 font-bold border-2 shadow-md hover:shadow-xl hover:scale-105 min-h-[100px] ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400'
              }`}
              onClick={() => setOpen(false)}
            >
              <FaQuestionCircle className="text-3xl" />
              <span className="text-xs sm:text-sm text-center">Quiz</span>
            </NavLink>
            <NavLink
              to={`/student/class/${classId}/modules`}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-2 sm:gap-3 py-5 px-2 rounded-xl transition-all duration-200 font-bold border-2 shadow-md hover:shadow-xl hover:scale-105 min-h-[100px] ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400'
              }`}
              onClick={() => setOpen(false)}
            >
              <FaBook className="text-3xl" />
              <span className="text-xs sm:text-sm text-center">Modules</span>
            </NavLink>
            <NavLink
              to={`/student/class/${classId}/classlist`}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-2 sm:gap-3 py-5 px-2 rounded-xl transition-all duration-200 font-bold border-2 shadow-md hover:shadow-xl hover:scale-105 min-h-[100px] ${
                isActive 
                  ? 'bg-blue-600 text-white border-blue-700' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 border-blue-200 hover:border-blue-400'
              }`}
              onClick={() => setOpen(false)}
            >
              <FaUsers className="text-3xl" />
              <span className="text-xs sm:text-sm text-center">Class List</span>
            </NavLink>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentClassNavbar;