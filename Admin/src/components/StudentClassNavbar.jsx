import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FaBullhorn, FaTasks, FaUsers, FaArrowLeft, FaBars, FaTimes } from 'react-icons/fa';

const StudentClassNavbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const { classId } = useParams();
  const handleHamburgerClick = () => setOpen(!open);

  const getLinkClass = ({ isActive }) =>
    `flex items-center py-2 px-3 rounded-md transition-colors duration-200 ${
      isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
    }`;

  if (!classId) return null;

  return (
    <>
      {/* Class Details Bar */}
      {selectedClass && (
        <div className="bg-indigo-600 text-white px-4 py-3 text-sm flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="truncate"><strong>Class:</strong> {selectedClass.className}</div>
          <div className="truncate"><strong>Teacher:</strong> {selectedClass.teacherName}</div>
          <div className="truncate"><strong>Schedule:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</div>
          <div className="truncate"><strong>Room:</strong> {selectedClass.roomNumber || 'N/A'}</div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div className="text-lg font-bold">
           <NavLink to="/studentportal" className="flex items-center gap-2 hover:text-gray-300 transition-colors">
             <FaArrowLeft />
             <span className="hidden sm:inline">Back to Classes</span>
           </NavLink>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-2">
            <NavLink to={`/student/class/${classId}/announcements`} className={getLinkClass}><FaBullhorn className="mr-2" /> Announcements</NavLink>
            <NavLink to={`/student/class/${classId}/activities`} className={getLinkClass}><FaTasks className="mr-2" /> Activities</NavLink>
            <NavLink to={`/student/class/${classId}/classlist`} className={getLinkClass}><FaUsers className="mr-2" /> Class List</NavLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={handleHamburgerClick} className="text-2xl" aria-label="Toggle menu">
             {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        {/* Mobile Menu Dropdown */}
        {open && (
          <div className="md:hidden absolute top-full right-0 bg-gray-800 w-full max-w-xs p-4 shadow-lg rounded-b-lg flex flex-col items-start space-y-2 z-10 animate-fadeIn">
            <NavLink to={`/student/class/${classId}/announcements`} className={getLinkClass} onClick={() => setOpen(false)}><FaBullhorn className="mr-2" />Announcements</NavLink>
            <NavLink to={`/student/class/${classId}/activities`} className={getLinkClass} onClick={() => setOpen(false)}><FaTasks className="mr-2" />Activities</NavLink>
            <NavLink to={`/student/class/${classId}/classlist`} className={getLinkClass} onClick={() => setOpen(false)}><FaUsers className="mr-2" />Class List</NavLink>
          </div>
        )}
      </nav>
    </>
  );
};

export default StudentClassNavbar;