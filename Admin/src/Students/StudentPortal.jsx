import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserTie, FaMapMarkerAlt, FaClock, FaCalendarDay, FaSearch, FaChalkboardTeacher, FaDoorOpen } from 'react-icons/fa';
import { MdClass } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import '../Css/StudentPortal.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Falling books animation component (books fall from above viewport, not stacking at top)
const FallingBooksAnimation = () => (
  <>
    <div className="falling-book" style={{ left: '5vw', animationDuration: '7s', animationDelay: '0s' }}>📚</div>
    <div className="falling-book" style={{ left: '20vw', animationDuration: '9s', animationDelay: '2s' }}>📚</div>
    <div className="falling-book" style={{ left: '35vw', animationDuration: '6s', animationDelay: '4s' }}>📚</div>
    <div className="falling-book" style={{ left: '50vw', animationDuration: '8s', animationDelay: '1s' }}>📚</div>
    <div className="falling-book" style={{ left: '65vw', animationDuration: '10s', animationDelay: '3s' }}>📚</div>
    <div className="falling-book" style={{ left: '80vw', animationDuration: '7.5s', animationDelay: '5s' }}>📚</div>
    <div className="falling-book" style={{ left: '90vw', animationDuration: '8.5s', animationDelay: '6s' }}>📚</div>
  </>
);

const StudentPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user && user.role === 'student' ? user._id : null;

  // Helper to format time as hh:mm AM/PM in PH time
  const formatTimePH = (timeStr) => {
    if (!timeStr) return 'TBA';
    const [hour, minute] = timeStr.split(':');
    if (isNaN(Number(hour)) || isNaN(Number(minute))) return timeStr;
    const date = new Date(`1970-01-01T${hour}:${minute}:00`);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    });
  };

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in. Please log in again.');
      setLoading(false);
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/class/my-classes/${studentId}`);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [studentId]);

  const handleClassClick = (classId) => {
    navigate(`/student/class/${classId}`);
  };

  const filteredClasses = classes.filter((cls) =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <p className="text-xl text-red-500 text-center">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 overflow-hidden">
      {/* Decorative background blobs (same as dashboard/login) */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3"
      >
        <div className="w-[24rem] sm:w-[40rem] h-[24rem] sm:h-[40rem] rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-30 blur-3xl"></div>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3"
      >
        <div className="w-[24rem] sm:w-[40rem] h-[24rem] sm:h-[40rem] rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 opacity-30 blur-3xl"></div>
      </div>
      {/* Falling books */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <FallingBooksAnimation />
      </div>
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 flex-grow flex flex-col w-full py-8 relative z-10">
        {/* Header */}
        <div className="flex-shrink-0">
          <div className="mb-8 pt-6 flex items-center gap-3">
            <MdClass className="text-indigo-300" size={38} />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">My Enrolled Classes</h1>
          </div>
          <hr className="mb-6 border-t-2 border-indigo-700" />

          {/* Search Bar */}
          <div className="mb-8 flex items-center gap-2">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                <FaSearch size={18} />
              </span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-slate-600 rounded-xl bg-slate-700/50 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 shadow-sm transition"
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Scrollable Grid layout */}
  <div className="flex-grow overflow-y-auto pb-8 relative hide-scrollbar" style={{ minHeight: 0, maxHeight: '70vh' }}>
          {/* Decorative scroll background */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="w-full h-full absolute inset-0 blur-3xl opacity-30">
              <svg className="w-full h-full" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="scrollbg1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#18181b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <ellipse cx="600" cy="250" rx="320" ry="60" fill="url(#scrollbg1)" />
              </svg>
            </div>
          </div>
          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {filteredClasses.map((cls) => (
                <div
                  key={cls._id}
                  className="relative bg-gradient-to-br from-indigo-900/80 via-slate-900/80 to-blue-900/80 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden border-2 border-indigo-700/60 backdrop-blur-md group"
                  style={{boxShadow:'0 8px 32px 0 rgba(31,41,55,0.18), 0 1.5px 8px 0 rgba(99,102,241,0.10)'}}
                  onClick={() => handleClassClick(cls._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClassClick(cls._id)}
                >
                  {/* Glassy overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-indigo-200/5 to-transparent pointer-events-none" />
                  {/* Animated accent blob */}
                  <svg className="absolute -top-8 -right-8 w-32 h-32 opacity-20 animate-pulse-slow pointer-events-none" viewBox="0 0 100 100" fill="none"><ellipse cx="50" cy="50" rx="48" ry="32" fill="#6366f1" /></svg>
                  {/* Accent bar */}
                  <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-b from-indigo-400 via-indigo-600 to-blue-500 rounded-l-2xl shadow-md"></div>
                  <div className="p-7 flex-grow relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <FaChalkboardTeacher className="text-indigo-300" size={26} />
                      <h2 className="text-2xl font-bold text-indigo-100 truncate" title={cls.className}>
                        {cls.className}
                      </h2>
                    </div>
                    <div className="space-y-3 text-base mt-4">
                      <p className="text-indigo-100 flex items-center">
                        <FaUserTie size={18} className="mr-3 text-indigo-400" />
                        <strong>Teacher:</strong>&nbsp;
                        {cls.teacher?.name || cls.teacherName || 'N/A'}
                      </p>
                      <p className="text-indigo-100 flex items-center">
                        <FaCalendarDay size={18} className="mr-3 text-indigo-400" />
                        <strong>Day:</strong>&nbsp;
                        {cls.day || 'TBA'}
                      </p>
                      <p className="text-indigo-100 flex items-center">
                        <FaClock size={18} className="mr-3 text-indigo-400" />
                        <strong>Time:</strong>&nbsp;
                        {formatTimePH(cls.time)}
                      </p>
                      <p className="text-indigo-100 flex items-center">
                        <FaMapMarkerAlt size={18} className="mr-3 text-indigo-400" />
                        <strong>Room:</strong>&nbsp;{cls.roomNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-900/80 via-slate-900/80 to-blue-900/80 px-7 py-4 border-t border-indigo-700 flex items-center justify-center gap-2 relative z-10">
                    <FaDoorOpen className="text-indigo-300" size={18} />
                    <p className="text-sm text-indigo-200 font-semibold text-center">
                      View Class &rarr;
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 mt-6 bg-slate-800/80 rounded-xl shadow-md border border-indigo-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <p className="text-xl text-slate-300">
                {searchTerm ? 'No classes found matching your search.' : 'You are not enrolled in any classes.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentPortal;