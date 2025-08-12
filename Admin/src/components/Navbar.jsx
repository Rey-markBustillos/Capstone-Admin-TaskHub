import React, { useState } from 'react';
// Import useParams to get the classId from the URL
import { Link, useParams } from 'react-router-dom';
import { FaBullhorn, FaPlusSquare, FaUsers } from 'react-icons/fa'; // Removed FaEnvelope

const Navbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const { classId } = useParams(); // Get classId from the route parameters
  const handleHamburgerClick = () => setOpen(!open);

  // A safeguard to prevent rendering the navbar on pages without a classId
  if (!classId) {
    return null;
  }

  return (
    <>
      {/* Top Class Info Bar */}
      {selectedClass && (
        <div className="bg-blue-600 text-white px-6 py-2 text-sm flex justify-between items-center">
          <div><strong>Class:</strong> {selectedClass.className}</div>
          <div><strong>Schedule:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</div>
          <div><strong>Room:</strong> {selectedClass.roomNumber}</div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-gray-800 text-white p-4 flex justify-start items-center sticky top-0 z-50">
        <div className="flex items-center">
          {/* Desktop Links - Updated with dynamic classId */}
          <ul className="hidden md:flex items-center space-x-60 ml-20">
            <li>
              {/* Use the classId to build the correct link */}
              <Link to={`/class/${classId}/announcements`} className="hover:text-gray-300 flex items-center">
                <FaBullhorn className="mr-2" /> Announcement
              </Link>
            </li>
            <li>
              <Link to={`/class/${classId}/createactivity`} className="hover:text-gray-300 flex items-center">
                <FaPlusSquare className="mr-2" /> Create Activity
              </Link>
            </li>
            <li>
              <Link to={`/class/${classId}/studentlist`} className="hover:text-gray-300 flex items-center">
                <FaUsers className="mr-2" /> Student List
              </Link>
            </li>
            {/* Removed Contact link as it doesn't have a route */}
          </ul>

          {/* Hamburger icon */}
          <button
            onClick={handleHamburgerClick}
            className="md:hidden flex flex-col justify-between w-6 h-4 bg-transparent border-none cursor-pointer"
            aria-label="Toggle menu"
          >
            <div className={`h-0.5 w-full bg-white rounded transition-all duration-300 ${open ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`h-0.5 w-full bg-white rounded transition-opacity duration-300 ${open ? 'opacity-0' : ''}`}></div>
            <div className={`h-0.5 w-full bg-white rounded transition-all duration-300 ${open ? '-rotate-45 translate-y-1.5' : ''}`}></div>
          </button>
        </div>

        {/* Mobile Dropdown Menu - Updated with dynamic classId */}
        {open && (
          <div className="md:hidden absolute top-full left-0 bg-gray-800 w-60 p-4 rounded-md flex flex-col items-start space-y-2 z-50">
            <Link to={`/class/${classId}/announcements`} className="hover:text-gray-300 py-3 px-4 flex items-center w-full" onClick={() => setOpen(false)}>
              <FaBullhorn className="mr-3" /> Announcement
            </Link>
            <Link to={`/class/${classId}/createactivity`} className="hover:text-gray-300 py-3 px-4 flex items-center w-full" onClick={() => setOpen(false)}>
              <FaPlusSquare className="mr-3" /> Create Activity
            </Link>
            <Link to={`/class/${classId}/studentlist`} className="hover:text-gray-300 py-3 px-4 flex items-center w-full" onClick={() => setOpen(false)}>
              <FaUsers className="mr-3" /> Student List
            </Link>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;