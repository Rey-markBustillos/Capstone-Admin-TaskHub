import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaClock, FaCalendarDay, FaChalkboardTeacher, FaSpinner } from 'react-icons/fa';
import { MdClass } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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
  const formatTimePH = (startTimeStr, endTimeStr) => {
    if (!startTimeStr) return 'TBA';
    
    const formatSingleTime = (timeStr) => {
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
    
    const startTime = formatSingleTime(startTimeStr);
    if (!endTimeStr) return startTime;
    
    const endTime = formatSingleTime(endTimeStr);
    return `${startTime} - ${endTime}`;
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
      <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center text-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Classes</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Show a special message if the student has no classes at all
  if (!classes || classes.length === 0) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center items-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-2xl text-center">
          <MdClass className="text-6xl text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">No Classes Available</h2>
          <p className="text-lg text-gray-600">You are not currently enrolled in any classes. Please check with your administrator to get enrolled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <MdClass className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">My Enrolled Classes</h1>
              <p className="text-gray-600 text-sm sm:text-base">View and access all your enrolled classes</p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-24"></div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              className="w-full p-4 pl-12 border-2 border-blue-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Classes Grid */}
        {filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClasses.map((cls) => (
              <div
                key={cls._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-300 group"
                onClick={() => handleClassClick(cls._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClassClick(cls._id); }}
              >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-2 truncate" title={cls.className}>
                    {cls.className}
                  </h2>
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <FaChalkboardTeacher size={14} />
                    <span>{cls.teacher?.name || cls.teacherName || 'N/A'}</span>
                  </div>
                </div>

                {/* Body with class details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <FaCalendarDay className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Day</p>
                      <p className="text-gray-800 font-medium">
                        {cls.day || <span className="italic text-gray-400">Not set</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FaClock className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time</p>
                      <p className="text-gray-800 font-medium">
                        {cls.time ? formatTimePH(cls.time, cls.endTime) : <span className="italic text-gray-400">TBA</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Room</p>
                      <p className="text-gray-800 font-medium">
                        {cls.roomNumber || <span className="italic text-gray-400">Not assigned</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-blue-50 px-6 py-3 border-t-2 border-blue-100">
                  <p className="text-sm text-blue-700 font-semibold text-center group-hover:text-blue-800 transition-colors">
                    View Class Details →
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
              <div className="text-gray-300 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Classes Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No classes match your search criteria. Try a different search term.' : 'You are not enrolled in any classes yet.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPortal;