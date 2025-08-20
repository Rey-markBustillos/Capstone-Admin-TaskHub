import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserTie, FaMapMarkerAlt, FaClock, FaCalendarDay, FaSearch, FaChalkboardTeacher, FaDoorOpen } from 'react-icons/fa';
import { MdClass } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import '../Css/StudentPortal.css'

const API_BASE_URL = 'https://capstone-admin-task-hub-9c3u-p6r5s7bf2.vercel.app/api';

// Falling books animation component
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
    navigate(`/student/class/${classId}/announcements`);
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
        <div className="flex-grow overflow-y-auto pb-8" style={{ minHeight: 0, maxHeight: '70vh' }}>
          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((cls) => (
                <div
                  key={cls._id}
                  className="bg-slate-800/80 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden border border-indigo-700"
                  onClick={() => handleClassClick(cls._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClassClick(cls._id)}
                >
                  <div className="p-6 flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <FaChalkboardTeacher className="text-indigo-400" size={22} />
                      <h2 className="text-xl sm:text-2xl font-bold text-indigo-200 truncate" title={cls.className}>
                        {cls.className}
                      </h2>
                    </div>
                    <div className="space-y-3 text-sm mt-4">
                      <p className="text-slate-200 flex items-center">
                        <FaUserTie size={16} className="mr-3 text-indigo-400" />
                        <strong>Teacher:</strong>&nbsp;
                        {cls.teacher?.name || cls.teacherName || 'N/A'}
                      </p>
                      <p className="text-slate-200 flex items-center">
                        <FaCalendarDay size={16} className="mr-3 text-indigo-400" />
                        <strong>Day:</strong>&nbsp;
                        {cls.day || 'TBA'}
                      </p>
                      <p className="text-slate-200 flex items-center">
                        <FaClock size={16} className="mr-3 text-indigo-400" />
                        <strong>Time:</strong>&nbsp;
                        {formatTimePH(cls.time)}
                      </p>
                      <p className="text-slate-200 flex items-center">
                        <FaMapMarkerAlt size={16} className="mr-3 text-indigo-400" />
                        <strong>Room:</strong>&nbsp;{cls.roomNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900/60 px-6 py-3 border-t border-indigo-700 flex items-center justify-center gap-2">
                    <FaDoorOpen className="text-indigo-300" size={16} />
                    <p className="text-xs text-indigo-200 font-semibold text-center">
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