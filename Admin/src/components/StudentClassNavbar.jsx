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
        <div className="bg-indigo-600 text-white px-4 py-3 text-sm flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="truncate flex items-center gap-2">
            <FaChalkboardTeacher className="text-white" />
            <strong>Class:</strong> {selectedClass.className}
          </div>
          <div className="truncate flex items-center gap-2">
            <FaUsers className="text-white" />
            <strong>Teacher:</strong> {getTeacherName(selectedClass) || 'N/A'}
          </div>
          <div className="truncate flex items-center gap-2">
            <FaClock className="text-white" />
            <strong>Schedule:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}
          </div>
          <div className="truncate flex items-center gap-2">
            <FaMapMarkerAlt className="text-white" />
            <strong>Room:</strong> {selectedClass.roomNumber || 'N/A'}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="text-lg font-bold">
          <NavLink to="/studentportal" className="flex items-center gap-2 hover:text-indigo-300 transition-colors">
            <FaArrowLeft />
            <span className="hidden sm:inline">Back to Classes</span>
          </NavLink>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-2">
          <NavLink to={`/student/class/${classId}/announcements`} className={getLinkClass}>
            <FaBullhorn className="mr-2" /> Announcements
          </NavLink>
          <NavLink to={`/student/class/${classId}/activities`} className={getLinkClass}>
            <FaTasks className="mr-2" /> Activities
          </NavLink>
          <NavLink to={`/student/class/${classId}/classlist`} className={getLinkClass}>
            <FaUsers className="mr-2" /> Class List
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
            className="mt-20 w-11/12 max-w-xs bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-start space-y-2 animate-fadeIn z-50"
            onClick={e => e.stopPropagation()}
          >
            <NavLink to={`/student/class/${classId}/announcements`} className={getLinkClass} onClick={() => setOpen(false)}>
              <FaBullhorn className="mr-2" /> Announcements
            </NavLink>
            <NavLink to={`/student/class/${classId}/activities`} className={getLinkClass} onClick={() => setOpen(false)}>
              <FaTasks className="mr-2" /> Activities
            </NavLink>
            <NavLink to={`/student/class/${classId}/classlist`} className={getLinkClass} onClick={() => setOpen(false)}>
              <FaUsers className="mr-2" /> Class List
            </NavLink>
            <NavLink to="/studentportal" className={getLinkClass} onClick={() => setOpen(false)}>
              <FaArrowLeft className="mr-2" /> Back to Classes
            </NavLink>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentClassNavbar;