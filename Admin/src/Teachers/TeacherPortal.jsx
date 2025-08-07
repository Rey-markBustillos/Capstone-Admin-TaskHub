import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClock, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import TeacherAnnouncement from './TeacherAnnouncement';
import { useNavigate } from 'react-router-dom';

const TeacherPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user && user.role === 'teacher' ? user._id : null;

  useEffect(() => {
    if (!teacherId) {
      setError('Teacher not logged in');
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/classes?teacherId=${teacherId}`);
        setClasses(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [teacherId]);

  const handleCloseModal = () => {
    setSelectedClass(null);
  };

  const handleClassClick = (cls) => {
    setSelectedClass(cls);
    navigate('/teacherannouncement');
  };

  const filteredClasses = classes.filter((cls) =>
    cls.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading your classes...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (classes.length === 0) return <p>You have no assigned classes.</p>;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 pt-6">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">All Subjects</h1>
          <hr className="mt-3 border-t-2 border-gray-300 dark:border-gray-600" />
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            placeholder="Search subjects..."
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
                onClick={() => handleClassClick(cls)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleClassClick(cls);
                }}
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-grow mr-4">
                      <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 truncate" title={cls.className}>
                        {cls.className}
                      </h2>
                    </div>
                    <img
                      src={user?.profilePicture || "/teacher-avatar.png"} // Use user's profile picture if available
                      alt={user?.name || "Teacher"}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-600 flex-shrink-0"
                    />
                  </div>
                  <div className="space-y-3 text-sm mb-4">
                    <p className="text-gray-700 dark:text-gray-300 flex items-center">
                      <FaCalendarAlt size={16} className="mr-3 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                      <span className="font-medium">Date:</span>&nbsp;
                      {cls.time ? new Date(cls.time).toLocaleDateString() : <span className="italic text-gray-500 dark:text-gray-400">TBA</span>}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex items-center">
                      <FaClock size={16} className="mr-3 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                      <span className="font-medium">Time:</span>&nbsp;
                      {cls.time ? new Date(cls.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="italic text-gray-500 dark:text-gray-400">TBA</span>}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 flex items-center">
                      <FaMapMarkerAlt size={16} className="mr-3 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                      <span className="font-medium">Room:</span>&nbsp;
                      {cls.roomNumber || <span className="italic text-gray-500 dark:text-gray-400">N/A</span>}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-blue-400/70 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-indigo-600 dark:text-indigo-300 font-semibold text-center">
                    View Details &rarr;
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 dark:text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <p className="text-xl text-gray-600 dark:text-gray-400">No subjects found matching your search.</p>
          </div>
        )}
      </div>

      {selectedClass && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto p-8 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >

            {/* Modal Header */}
            <h2 id="modal-title" className="text-2xl font-bold text-gray-800 mb-4">
              {selectedClass.className}
            </h2>
            <Navbar selectedClass={selectedClass} />
            {/* Navbar Placed Inside the Modal */}
            <Navbar />

            {/* TeacherAnnouncement Component */}
            <TeacherAnnouncement selectedClass={selectedClass} />

            {/* Back Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close modal"
              type="button"
            >
              &#8592; Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;
