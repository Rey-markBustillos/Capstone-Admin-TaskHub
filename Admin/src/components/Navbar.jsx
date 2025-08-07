import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBullhorn, FaPlusSquare, FaUsers, FaEnvelope } from 'react-icons/fa';


const Navbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const handleHamburgerClick = () => setOpen(!open);

  return (
    <>
     
      {/* Top Class Info Bar (This will likely still be full-width based on its parent container) */}
      {selectedClass && (
        <div className="bg-blue-600 text-white px-6 py-2 text-sm flex justify-between items-center">
          <div><strong>Class:</strong> {selectedClass.className}</div>
          <div><strong>Schedule:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</div>
          <div><strong>Room:</strong> {selectedClass.roomNumber}</div>
        </div>
      )}

      {/* Main Navbar */}
      {/* Removed w-full, changed to justify-start. The navbar will now be as wide as its content and aligned left. */}
      <nav className="bg-gray-800 text-white p-4 flex justify-start items-center sticky top-0 z-50">
        <div className="flex items-center"> {/* This container holds all nav items */}
          {/* Desktop Links */}
          {/* Removed ml-20, adjusted space-x for closer items */}
          <ul className="hidden md:flex items-center space-x-60 ml-20"> {/* Adjusted space-x, e.g., to space-x-8 */}
            <li>
              <Link to="/teacherannouncement" className="hover:text-gray-300 flex items-center">
                <FaBullhorn className="mr-2" /> Announcement
              </Link>
            </li>
            <li>
              <Link to="/createactivity" className="hover:text-gray-300 flex items-center">
                <FaPlusSquare className="mr-2" /> Create Activity
              </Link>
            </li>
            <li>
              <Link to="/studentlist" className="hover:text-gray-300 flex items-center">
                <FaUsers className="mr-2" /> StudentList
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gray-300 flex items-center">
                <FaEnvelope className="mr-2" /> Contact
              </Link>
            </li>
          </ul>

          {/* Hamburger icon */}
          {/* Removed ml-4. On mobile, it will be at the start of the navbar. */}
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

        {/* Mobile Dropdown Menu */}
        {/* Changed right-0 to left-0 to align with the left-positioned navbar */}
        {open && (
          <div className="md:hidden absolute top-full left-0 bg-gray-800 w-60 p-4 rounded-md flex flex-col items-start space-y-2 z-50"> {/* Ensure z-index if needed */}
            <Link to="/teacherannouncement" className="hover:text-gray-300 py-3 px-4 flex items-center w-full" onClick={() => setOpen(false)}>
              <FaBullhorn className="mr-3" /> Announcement
            </Link>
            <Link to="/createactivity" className="hover:text-gray-300 py-3 px-4 flex items-center w-full" onClick={() => setOpen(false)}>
              <FaPlusSquare className="mr-3" /> Create Activity
            </Link>
            <Link to="/studentlist" className="hover:text-gray-300 py-3 px-4 flex items-center w-full" onClick={() => setOpen(false)}>
              <FaUsers className="mr-3" /> StudentList
            </Link>
            <Link to="/contact" className="hover:text-gray-300 py-3 px-4 flex items-center w-full" onClick={() => setOpen(false)}>
              <FaEnvelope className="mr-3" /> Contact
            </Link>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;