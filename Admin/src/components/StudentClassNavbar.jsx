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
        <div className={`bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 shadow-xl fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'
        }`}>
          <div className="flex flex-col lg:flex-row lg:flex-wrap justify-start lg:justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 sm:p-3 rounded-xl shadow-lg">
                <FaSchool className="text-white text-2xl sm:text-3xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow-md">{selectedClass.className}</h1>
                {getTeacherName(selectedClass) && (
                  <div className="text-xs sm:text-sm text-blue-100 mt-1 flex items-center gap-2">
                    <FaChalkboardTeacher className="text-blue-200" />
                    <span><strong>Teacher:</strong> {getTeacherName(selectedClass)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors px-3 sm:px-4 py-2 rounded-lg shadow-md">
                <FaClock className="text-blue-200 text-sm sm:text-base flex-shrink-0" />
                <span className="font-medium"><strong className="text-blue-100">Schedule:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</span>
              </div>
              {selectedClass.day && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors px-3 sm:px-4 py-2 rounded-lg shadow-md">
                  <FaCalendarAlt className="text-blue-200 text-sm sm:text-base flex-shrink-0" />
                  <span className="font-medium"><strong className="text-blue-100">Day:</strong> {selectedClass.day}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors px-3 sm:px-4 py-2 rounded-lg shadow-md">
                <FaMapMarkerAlt className="text-blue-200 text-sm sm:text-base flex-shrink-0" />
                <span className="font-medium"><strong className="text-blue-100">Room:</strong> {selectedClass.roomNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className={`bg-white shadow-lg fixed z-30 border-b-2 border-blue-100 transition-all duration-300 ${
        selectedClass ? 'top-[88px] sm:top-[100px]' : 'top-0'
      } ${
        isSidebarOpen ? 'left-36 sm:left-44 right-0 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'left-10 sm:left-12 right-0 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'
      }`}>
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          {/* Desktop Navigation */}
          <div className="hidden md:flex justify-between items-center">
            {/* Back to Classes */}
            <NavLink
              to="/studentportal"
              className="flex items-center gap-2 py-2.5 px-5 rounded-lg transition-all duration-200 text-gray-700 hover:bg-blue-600 hover:text-white font-semibold border-2 border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg hover:scale-105 min-h-[44px]"
            >
              <FaArrowLeft className="text-sm" />
              <span>Back to Classes</span>
            </NavLink>

            {/* Menu Items */}
            <div className="flex items-center gap-2 lg:gap-3">
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
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-200 text-white bg-blue-600 hover:bg-blue-700 font-semibold border-2 border-blue-700 shadow-md hover:shadow-lg min-h-[44px]"
            >
              <FaArrowLeft className="text-sm" />
              <span className="text-sm">Back</span>
            </NavLink>

            <button
              onClick={handleHamburgerClick}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-200 font-semibold border-2 shadow-md hover:shadow-lg min-h-[44px] ${
                open 
                  ? 'bg-red-500 text-white border-red-600 hover:bg-red-600' 
                  : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
              }`}
              aria-label="Toggle menu"
            >
              <span className="text-sm font-bold">{open ? 'Close' : 'Menu'}</span>
              {open ? <FaTimes size={18} /> : <FaBars size={16} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className={`md:hidden bg-gradient-to-b from-blue-50 to-white border-t-2 border-blue-200 shadow-xl animate-fadeIn fixed z-20 transition-all duration-300 ${
          selectedClass ? 'top-[144px] sm:top-[164px]' : 'top-[56px]'
        } ${
          isSidebarOpen ? 'left-36 sm:left-44 right-0 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'left-10 sm:left-12 right-0 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'
        } max-h-[calc(100vh-200px)] overflow-y-auto`}>
          <div className="p-3 sm:p-4 grid grid-cols-2 gap-3">
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