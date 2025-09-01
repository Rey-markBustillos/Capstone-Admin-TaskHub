import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClock, FaCalendarAlt, FaMapMarkerAlt, FaChalkboardTeacher } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../Css/FallingBooks.css';

// FallingBooksAnimation component
const FallingBooksAnimation = () => {
  const bookEmojis = ["\uD83D\uDCDA", "\uD83D\uDCD3", "\uD83D\uDCD5", "\uD83D\uDCD7", "\uD83D\uDCD8"];
  const numberOfBooks = 7;
  return (
    <div className="dashboard-background" aria-hidden="true">
      {Array.from({ length: numberOfBooks }, (_, index) => {
        const randomLeft = Math.random() * 100;
        const randomDuration = Math.random() * 8 + 7;
        const randomDelay = Math.random() * 10;
        const randomEmoji = bookEmojis[Math.floor(Math.random() * bookEmojis.length)];
        return (
          <div
            className="falling-book"
            key={`book-${index}`}
            style={{
              left: `${randomLeft}vw`,
              animationDuration: `${randomDuration}s`,
              animationDelay: `${randomDelay}s`,
              top: 0,
              transform: "translateY(-120%)",
            }}
          >
            {randomEmoji}
          </div>
        );
      })}
    </div>
  );
};

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

const TeacherPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?._id;

  useEffect(() => {
    if (!teacherId) {
      setError('Teacher not logged in. Please log in again.');
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      try {
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";
  const res = await axios.get(`${API_BASE_URL}/class?teacherId=${teacherId}`);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load classes.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [teacherId]);

  const handleClassClick = (cls) => {
    navigate(`/class/${cls._id}`);
  };

  const filteredClasses = classes.filter((cls) =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        <p className="text-xl">Loading your classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-400">
        <p className="text-xl">Error: {error}</p>
      </div>
    );
  }

  // Show a special message if the teacher has no classes at all
  if (!classes || classes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white dark:bg-gray-800">
        <FallingBooksAnimation />
        <div className="bg-gray-800 rounded-xl shadow-md px-8 py-12 mt-8">
          <h2 className="text-3xl font-bold text-indigo-300 mb-4 flex items-center gap-2"><FaChalkboardTeacher /> No Upcoming Classes</h2>
          <p className="text-lg text-gray-300">You currently have no scheduled classes. Please check with your administrator or add a class to get started.</p>
        </div>
      </div>
    );
  }

  return (
  <div className="app-container bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 min-h-screen w-full">
      <FallingBooksAnimation />
      <div className="w-full px-2 sm:px-6 lg:px-8">
        <div className="mb-8 pt-6">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            <FaChalkboardTeacher className="text-indigo-400" /> My Subjects
          </h1>
          <hr className="mt-3 border-t-2 border-indigo-600" />
        </div>

        <div className="mb-8">
          <input
            type="text"
            className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClasses.map((cls) => (
              <div
                key={cls._id}
                className="relative bg-gradient-to-br from-indigo-900/80 to-gray-900/80 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden border border-indigo-700 group"
                onClick={() => handleClassClick(cls)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClassClick(cls); }}
              >
                {/* Optional background image or pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/class-bg.svg')] bg-cover bg-center" />
                <div className="p-6 pt-12 flex-grow flex flex-col">
                  <h2 className="text-2xl font-bold text-indigo-200 truncate mb-4" title={cls.className}>
                    {cls.className}
                  </h2>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-300 flex items-center">
                      <FaCalendarAlt size={14} className="mr-3 text-indigo-400 flex-shrink-0" />
                      <span className="font-medium">Day:</span>&nbsp;
                      {cls.day || <span className="italic text-gray-400">N/A</span>}
                    </p>
                    <p className="text-gray-300 flex items-center">
                      <FaClock size={14} className="mr-3 text-indigo-400 flex-shrink-0" />
                      <span className="font-medium">Time:</span>&nbsp;
                      {cls.time ? formatTimePH(cls.time) : <span className="italic text-gray-400">TBA</span>}
                    </p>
                    <p className="text-gray-300 flex items-center">
                      <FaMapMarkerAlt size={14} className="mr-3 text-indigo-400 flex-shrink-0" />
                      <span className="font-medium">Room:</span>&nbsp;
                      {cls.roomNumber || <span className="italic text-gray-400">N/A</span>}
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-500/30 px-6 py-3 border-t border-indigo-700">
                  <p className="text-xs text-indigo-200 font-semibold text-center tracking-wide group-hover:text-white transition">
                    View Class &rarr;
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 mt-6 bg-gray-800 rounded-xl shadow-md">
            <p className="text-xl text-gray-400">No subjects found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherPortal;