import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserTie, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const API_BASE_URL = 'http://localhost:5000/api';

const StudentPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user && user.role === 'student' ? user._id : null;

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in. Please log in again.');
      setLoading(false);
      return;
    }
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/class?studentId=${studentId}`);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [studentId]);

  // Function to handle navigation
  const handleClassClick = (classId) => {
    // Navigate to the activities page by default, or announcements
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
    <div className="min-h-screen py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 pt-6">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">My Enrolled Classes</h1>
          <hr className="mt-3 border-t-2 border-gray-300 dark:border-gray-600" />
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Grid layout */}
        {filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <div
                key={cls._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer flex flex-col overflow-hidden"
                onClick={() => handleClassClick(cls._id)} // Updated onClick
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClassClick(cls._id)}
              >
                <div className="p-6 flex-grow">
                  <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 truncate" title={cls.className}>
                    {cls.className}
                  </h2>
                  <div className="space-y-3 text-sm mt-4">
                    <p className="text-gray-700 dark:text-gray-300 flex items-center">
                      <FaUserTie size={16} className="mr-3 text-indigo-500 dark:text-indigo-400" />
                      <strong>Teacher:</strong>&nbsp;{cls.teacherName}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex items-center">
                      <FaClock size={16} className="mr-3 text-indigo-500 dark:text-indigo-400" />
                      <strong>Time:</strong>&nbsp;{cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex items-center">
                      <FaMapMarkerAlt size={16} className="mr-3 text-indigo-500 dark:text-indigo-400" />
                      <strong>Room:</strong>&nbsp;{cls.roomNumber || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-indigo-500/20 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold text-center">
                    View Class &rarr;
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 dark:text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No classes found matching your search.' : 'You are not enrolled in any classes.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentPortal;