import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaBullhorn, FaPlusSquare, FaUsers, FaArrowLeft, FaBars, FaTimes, FaClock, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

const Navbar = ({ selectedClass }) => {
  const [open, setOpen] = useState(false);
  const { classId } = useParams();
  const navigate = useNavigate();
  const handleHamburgerClick = () => setOpen(!open);

  if (!classId) return null;

  return (
    <>
      {/* Top Class Info Bar */}
      {selectedClass && (
        <div className="bg-blue-600 text-white px-4 py-3 text-sm flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="truncate flex items-center">
            <FaCalendarAlt className="mr-2" />
            <strong>Class:</strong>&nbsp;{selectedClass.className}
          </div>
          <div className="truncate flex items-center">
            <FaClock className="mr-2" />
            <strong>Schedule:</strong>&nbsp;{selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}
          </div>
          <div className="truncate flex items-center">
            <span className="mr-2 font-bold">🗓️</span>
            <strong>Day:</strong>&nbsp;{selectedClass.day || 'N/A'}
          </div>
          <div className="truncate flex items-center">
            <FaMapMarkerAlt className="mr-2" />
            <strong>Room:</strong>&nbsp;{selectedClass.roomNumber}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
        {/* Back to Classes */}
        <div className="text-lg font-bold">
          <button
            onClick={() => navigate('/classes')}
            className="flex items-center gap-2 hover:text-gray-300 transition-colors"
          >
            <FaArrowLeft />
            <span className="hidden sm:inline">Back to Classes</span>
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-2">
          <Link to={`/class/${classId}/announcements`} className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white">
            <FaBullhorn className="mr-2" /> Announcement
          </Link>
          <Link to={`/class/${classId}/createactivity`} className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white">
            <FaPlusSquare className="mr-2" /> Create Activity
          </Link>
          <Link to={`/class/${classId}/studentlist`} className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white">
            <FaUsers className="mr-2" /> Student List
          </Link>
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
            <button
              onClick={() => { setOpen(false); navigate('/classes'); }}
              className="flex items-center gap-2 hover:text-gray-300 transition-colors py-2 px-3 rounded-md w-full"
            >
              <FaArrowLeft />
              <span>Back to Classes</span>
            </button>
            <Link to={`/class/${classId}/announcements`} className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white w-full" onClick={() => setOpen(false)}>
              <FaBullhorn className="mr-2" /> Announcement
            </Link>
            <Link to={`/class/${classId}/createactivity`} className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white w-full" onClick={() => setOpen(false)}>
              <FaPlusSquare className="mr-2" /> Create Activity
            </Link>
            <Link to={`/class/${classId}/studentlist`} className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/50 hover:text-white w-full" onClick={() => setOpen(false)}>
              <FaUsers className="mr-2" /> Student List
            </Link>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;