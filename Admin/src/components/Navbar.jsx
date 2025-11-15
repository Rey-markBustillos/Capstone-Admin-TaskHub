
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PWAInstallPrompt from './PWAInstallPrompt';
import {
  FaBullhorn,
  FaPlusSquare,
  FaUsers,
  FaArrowLeft,
  FaBars,
  FaTimes,
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSchool,
  FaQuestionCircle,
  FaUpload
} from 'react-icons/fa';


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
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-500 text-white px-4 py-4 text-sm flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-2 sm:gap-4 rounded-b-xl shadow-lg">
          <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <FaSchool className="text-yellow-300 text-3xl drop-shadow-lg animate-pulse" />
            <span className="text-xl sm:text-2xl font-bold text-white drop-shadow">{selectedClass.className}</span>
          </div>
          <div className="truncate flex items-center">
            <FaClock className="mr-2" />
            <strong>Schedule:</strong>&nbsp;{selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}
          </div>
          <div className="truncate flex items-center">
            <FaCalendarAlt className="mr-2" />
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
        {/* Back to Classes - Left Side */}
        <div className="hidden md:flex">
          <button
            onClick={() => navigate('/classes')}
            className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/40 hover:text-gray-200 font-semibold border border-gray-500/30 hover:border-gray-400"
          >
            <FaArrowLeft className="mr-2 text-gray-300 text-lg" />
            <span>Back to Classes</span>
          </button>
        </div>

        {/* Main Menu - Right Side */}
        <div className="hidden md:flex items-center space-x-2">
          <Link
            to={`/class/${classId}/attendance`}
            className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-green-700/40 hover:text-green-200 font-semibold border border-green-500/30 hover:border-green-400"
          >
            <FaCalendarAlt className="mr-2 text-green-300 text-lg animate-pulse" /> Attendance
          </Link>
          <Link
            to={`/class/${classId}/announcements`}
            className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-indigo-700/40 hover:text-yellow-200 font-semibold border border-yellow-500/30 hover:border-yellow-400"
          >
            <FaBullhorn className="mr-2 text-yellow-300 text-lg animate-pulse" /> Announcement
          </Link>
          <Link
            to={`/class/${classId}/createactivity`}
            className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-yellow-400/20 hover:text-yellow-300 font-semibold border border-yellow-400/30 hover:border-yellow-300"
          >
            <FaPlusSquare className="mr-2 text-yellow-400 text-lg animate-bounce" /> Create Activity
          </Link>
          <Link
            to={`/class/${classId}/createquiz`}
            className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-blue-700/40 hover:text-blue-200 font-semibold border border-blue-500/30 hover:border-blue-400"
          >
            <FaQuestionCircle className="mr-2 text-blue-300 text-lg animate-pulse" /> Create Quiz
          </Link>
          <Link
            to={`/class/${classId}/uploadmodule`}
            className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-purple-700/40 hover:text-purple-200 font-semibold border border-purple-500/30 hover:border-purple-400"
          >
            <FaUpload className="mr-2 text-purple-300 text-lg animate-bounce" /> Upload Module
          </Link>
          <Link
            to={`/class/${classId}/studentlist`}
            className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-indigo-700/40 hover:text-yellow-200 font-semibold border border-indigo-500/30 hover:border-indigo-400"
          >
            <FaUsers className="mr-2 text-yellow-200 text-lg animate-pulse" /> Student List
          </Link>
          
          {/* PWA Install Button */}
          <PWAInstallPrompt />
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
            <Link
              to={`/class/${classId}/attendance`}
              className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-green-700/40 hover:text-green-200 font-semibold w-full"
              onClick={() => setOpen(false)}
            >
              <FaCalendarAlt className="mr-2 text-green-300 text-lg animate-pulse" /> Attendance
            </Link>
            <Link
              to={`/class/${classId}/announcements`}
              className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-indigo-700/40 hover:text-yellow-200 font-semibold w-full"
              onClick={() => setOpen(false)}
            >
              <FaBullhorn className="mr-2 text-yellow-300 text-lg animate-pulse" /> Announcement
            </Link>
            <Link
              to={`/class/${classId}/createactivity`}
              className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-yellow-400/20 hover:text-yellow-300 font-semibold w-full"
              onClick={() => setOpen(false)}
            >
              <FaPlusSquare className="mr-2 text-yellow-400 text-lg animate-bounce" /> Create Activity
            </Link>
            <Link
              to={`/class/${classId}/createquiz`}
              className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-blue-700/40 hover:text-blue-200 font-semibold w-full"
              onClick={() => setOpen(false)}
            >
              <FaQuestionCircle className="mr-2 text-blue-300 text-lg animate-pulse" /> Create Quiz
            </Link>
            <Link
              to={`/class/${classId}/uploadmodule`}
              className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-purple-700/40 hover:text-purple-200 font-semibold w-full"
              onClick={() => setOpen(false)}
            >
              <FaUpload className="mr-2 text-purple-300 text-lg animate-bounce" /> Upload Module
            </Link>
            <Link
              to={`/class/${classId}/studentlist`}
              className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-indigo-700/40 hover:text-yellow-200 font-semibold w-full"
              onClick={() => setOpen(false)}
            >
              <FaUsers className="mr-2 text-yellow-200 text-lg animate-pulse" /> Student List
            </Link>
            <button
              onClick={() => { setOpen(false); navigate('/classes'); }}
              className="flex items-center py-2 px-3 rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700/40 hover:text-gray-200 font-semibold w-full border border-gray-500/30 hover:border-gray-400"
            >
              <FaArrowLeft className="mr-2 text-gray-300 text-lg" />
              <span>Back to Classes</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );

  // ...existing code...
};

export default Navbar;