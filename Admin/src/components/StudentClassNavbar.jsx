import React, { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { FaBullhorn, FaTasks, FaUsers } from 'react-icons/fa';

const StudentClassNavbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const { classId } = useParams();
  const handleHamburgerClick = () => setOpen(!open);

  const getLinkClass = ({ isActive }) =>
    `hover:text-gray-300 flex items-center py-2 px-3 rounded-md ${isActive ? 'bg-gray-700' : ''}`;

  if (!classId) return null;

  return (
    <>
      {selectedClass && (
        <div className="bg-indigo-600 text-white px-6 py-2 text-sm flex flex-wrap justify-between items-center gap-4">
          <div><strong>Class:</strong> {selectedClass.className}</div>
          <div><strong>Teacher:</strong> {selectedClass.teacherName}</div>
          <div><strong>Schedule:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</div>
          <div><strong>Room:</strong> {selectedClass.roomNumber || 'N/A'}</div>
        </div>
      )}

      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="text-lg font-bold">
           <NavLink to="/studentportal">Back to Classes</NavLink>
        </div>
        <div className="flex items-center">
          <ul className="hidden md:flex items-center space-x-6">
            <li><NavLink to={`/student/class/${classId}/announcements`} className={getLinkClass}><FaBullhorn className="mr-2" /> Announcements</NavLink></li>
            <li><NavLink to={`/student/class/${classId}/activities`} className={getLinkClass}><FaTasks className="mr-2" /> Activities</NavLink></li>
            <li><NavLink to={`/student/class/${classId}/classlist`} className={getLinkClass}><FaUsers className="mr-2" /> Class List</NavLink></li>
          </ul>
          <button onClick={handleHamburgerClick} className="md:hidden ml-4" aria-label="Toggle menu">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </div>
        {open && (
          <div className="md:hidden absolute top-full right-0 bg-gray-800 w-60 p-4 rounded-md flex flex-col items-start space-y-2 z-40">
            <NavLink to={`/student/class/${classId}/announcements`} className={getLinkClass} onClick={() => setOpen(false)}>Announcements</NavLink>
            <NavLink to={`/student/class/${classId}/activities`} className={getLinkClass} onClick={() => setOpen(false)}>Activities</NavLink>
            <NavLink to={`/student/class/${classId}/classlist`} className={getLinkClass} onClick={() => setOpen(false)}>Class List</NavLink>
          </div>
        )}
      </nav>
    </>
  );
};

export default StudentClassNavbar;