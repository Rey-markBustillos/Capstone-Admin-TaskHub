import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FaBullhorn, FaTasks, FaUsers, FaArrowLeft, FaBars, FaTimes, FaChalkboardTeacher, FaClock, FaMapMarkerAlt } from 'react-icons/fa';

const StudentClassNavbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const { classId } = useParams();
  const handleHamburgerClick = () => setOpen(!open);

  const getLinkClass = ({ isActive }) =>
    `flex items-center py-2 px-3 rounded-md transition-colors duration-200 ${
      isActive ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-indigo-500/80 hover:text-white'
    }`;

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
      {/* Class Details Bar */}
      {selectedClass && (
        <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-500 to-purple-600 text-white px-6 py-8 min-h-[120px] flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-4 sm:gap-8 rounded-b-3xl shadow-xl border-b-4 border-indigo-300">
          <div className="absolute left-4 top-4 opacity-20 pointer-events-none select-none">
            <FaChalkboardTeacher className="text-white text-7xl drop-shadow-xl" />
          </div>
          <div className="flex flex-col gap-2 z-10">
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-3 rounded-full shadow-lg ring-2 ring-yellow-200/40 flex items-center justify-center">
                <FaChalkboardTeacher className="text-white text-2xl" />
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold tracking-wide drop-shadow">Welcome to <span className="text-yellow-200">{selectedClass.className}</span>!</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl shadow">
                <span className="bg-gradient-to-tr from-blue-400 via-cyan-400 to-indigo-400 p-2 rounded-full shadow ring-2 ring-white/40 flex items-center justify-center">
                  <FaUsers className="text-white text-lg" />
                </span>
                <span className="font-semibold">Teacher:</span> {getTeacherName(selectedClass) || 'N/A'}
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl shadow">
                <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-2 rounded-full shadow ring-2 ring-white/40 flex items-center justify-center">
                  <FaClock className="text-white text-lg" />
                </span>
                <span className="font-semibold">Schedule:</span> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl shadow">
                <span className="bg-gradient-to-tr from-green-400 via-teal-400 to-blue-400 p-2 rounded-full shadow ring-2 ring-white/40 flex items-center justify-center">
                  <FaMapMarkerAlt className="text-white text-lg" />
                </span>
                <span className="font-semibold">Room:</span> {selectedClass.roomNumber || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="text-lg font-bold">
          <NavLink to="/studentportal" className="flex items-center gap-2 hover:text-indigo-300 transition-colors">
            <span className="bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 p-1.5 rounded-full shadow ring-2 ring-white/40 flex items-center justify-center">
              <FaArrowLeft className="text-white text-base" />
            </span>
            <span className="hidden sm:inline">Back to Classes</span>
          </NavLink>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10 mt-6 mb-6 justify-center">
          <NavLink
            to={`/student/class/${classId}/announcements`}
            className={({ isActive }) =>
              `group flex flex-col items-center justify-center px-12 py-8 rounded-3xl shadow-2xl transition-all duration-200 border-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 border-indigo-400 text-white scale-110 ring-4 ring-indigo-300/30'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:scale-105'
              } min-w-[180px] min-h-[160px]`
            }
            style={{ textDecoration: 'none' }}
          >
            <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-4 rounded-full shadow-lg ring-2 ring-yellow-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FaBullhorn className="text-white text-3xl group-hover:animate-bounce" />
            </span>
            <span className="font-extrabold text-lg tracking-wide">Announcements</span>
          </NavLink>
          <NavLink
            to={`/student/class/${classId}/activities`}
            className={({ isActive }) =>
              `group flex flex-col items-center justify-center px-12 py-8 rounded-3xl shadow-2xl transition-all duration-200 border-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 border-indigo-400 text-white scale-110 ring-4 ring-indigo-300/30'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:scale-105'
              } min-w-[180px] min-h-[160px]`
            }
            style={{ textDecoration: 'none' }}
          >
            <span className="bg-gradient-to-tr from-blue-400 via-cyan-400 to-indigo-400 p-4 rounded-full shadow-lg ring-2 ring-blue-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FaTasks className="text-white text-3xl group-hover:animate-bounce" />
            </span>
            <span className="font-extrabold text-lg tracking-wide">Activities</span>
          </NavLink>
          <NavLink
            to={`/student/class/${classId}/classlist`}
            className={({ isActive }) =>
              `group flex flex-col items-center justify-center px-12 py-8 rounded-3xl shadow-2xl transition-all duration-200 border-2 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 border-indigo-400 text-white scale-110 ring-4 ring-indigo-300/30'
                  : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:scale-105'
              } min-w-[180px] min-h-[160px]`
            }
            style={{ textDecoration: 'none' }}
          >
            <span className="bg-gradient-to-tr from-green-400 via-teal-400 to-blue-400 p-4 rounded-full shadow-lg ring-2 ring-green-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FaUsers className="text-white text-3xl group-hover:animate-bounce" />
            </span>
            <span className="font-extrabold text-lg tracking-wide">Class List</span>
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={handleHamburgerClick} className="text-2xl focus:outline-none" aria-label="Toggle menu">
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-start justify-end"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-20 w-11/12 max-w-xs bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-start space-y-4 animate-fadeIn z-50"
            onClick={e => e.stopPropagation()}
          >
            <NavLink
              to={`/student/class/${classId}/announcements`}
              className={({ isActive }) =>
                `group w-full flex flex-col items-center justify-center px-6 py-4 rounded-2xl shadow-lg transition-all duration-200 border-2 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-400 text-white scale-105'
                    : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:scale-105'
                } min-w-[120px] mb-2`
              }
              onClick={() => setOpen(false)}
            >
              <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-2.5 rounded-full shadow ring-2 ring-yellow-200/40 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaBullhorn className="text-white text-xl group-hover:animate-bounce" />
              </span>
              <span className="font-bold text-base">Announcements</span>
            </NavLink>
            <NavLink
              to={`/student/class/${classId}/activities`}
              className={({ isActive }) =>
                `group w-full flex flex-col items-center justify-center px-6 py-4 rounded-2xl shadow-lg transition-all duration-200 border-2 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-400 text-white scale-105'
                    : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:scale-105'
                } min-w-[120px] mb-2`
              }
              onClick={() => setOpen(false)}
            >
              <span className="bg-gradient-to-tr from-blue-400 via-cyan-400 to-indigo-400 p-2.5 rounded-full shadow ring-2 ring-blue-200/40 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaTasks className="text-white text-xl group-hover:animate-bounce" />
              </span>
              <span className="font-bold text-base">Activities</span>
            </NavLink>
            <NavLink
              to={`/student/class/${classId}/classlist`}
              className={({ isActive }) =>
                `group w-full flex flex-col items-center justify-center px-6 py-4 rounded-2xl shadow-lg transition-all duration-200 border-2 ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-400 text-white scale-105'
                    : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:scale-105'
                } min-w-[120px] mb-2`
              }
              onClick={() => setOpen(false)}
            >
              <span className="bg-gradient-to-tr from-green-400 via-teal-400 to-blue-400 p-2.5 rounded-full shadow ring-2 ring-green-200/40 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaUsers className="text-white text-xl group-hover:animate-bounce" />
              </span>
              <span className="font-bold text-base">Class List</span>
            </NavLink>
            <NavLink to="/studentportal" className={getLinkClass} onClick={() => setOpen(false)}>
              <span className="bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 p-1.5 rounded-full shadow ring-2 ring-white/40 flex items-center justify-center mr-2">
                <FaArrowLeft className="text-white text-base" />
              </span> Back to Classes
            </NavLink>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentClassNavbar;