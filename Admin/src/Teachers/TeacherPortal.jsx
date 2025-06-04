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

  if (loading) return <p>Loading your classes...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (classes.length === 0) return <p>You have no assigned classes.</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">All Subjects</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {classes.map((cls) => (
          <div
            key={cls._id}
            className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center justify-between cursor-pointer"
            onClick={() => handleClassClick(cls)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClassClick(cls);
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center text-gray-500 mr-4">
                <FaCalendarAlt />
                <span className="text-sm">Date/Time</span>
                <FaClock />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800">{cls.className}</h2>
                <p className="text-sm text-gray-600">{cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <FaMapMarkerAlt className="inline-block mr-1" />
              {cls.roomNumber}
            </div>

            <div>
              <img
                src="/teacher-avatar.png"
                alt="Teacher"
                className="w-12 h-12 rounded-full border-2 border-white"
              />
            </div>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
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