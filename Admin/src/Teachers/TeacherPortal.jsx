import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClock, FaCalendarAlt } from 'react-icons/fa';

const TeacherPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  const [activityData, setActivityData] = useState({
    title: '',
    description: '',
    date: '',
    score: '',
    link: '',
    attachment: '',
  });
  const [activityError, setActivityError] = useState('');
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySuccess, setActivitySuccess] = useState('');

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
        // Corrected line with template string in backticks:
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

  // ... rest of your code


  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setActivityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    setActivityError('');
    setActivitySuccess('');
    setActivityLoading(true);

    if (!activityData.title || !activityData.date || !selectedClass?._id) {
      setActivityError('Title, Date, and Class are required.');
      setActivityLoading(false);
      return;
    }

    try {
      const payload = {
        ...activityData,
        score: activityData.score ? Number(activityData.score) : undefined,
        createdBy: teacherId,
        classId: selectedClass._id,
      };

      await axios.post('http://localhost:5000/api/activities', payload);

      setActivitySuccess('Activity created successfully!');
      setActivityData({
        title: '',
        description: '',
        date: '',
        score: '',
        link: '',
        attachment: '',
      });
    } catch (err) {
      setActivityError(err.response?.data?.message || err.message || 'Failed to create activity');
    } finally {
      setActivityLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setActivityError('');
    setActivitySuccess('');
    setActivityData({
      title: '',
      description: '',
      date: '',
      score: '',
      link: '',
      attachment: '',
    });
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
            className="bg-gray-100 rounded-lg p-4 shadow-md flex items-center justify-between cursor-pointer hover:bg-gray-200"
            onClick={() => setSelectedClass(cls)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedClass(cls);
            }}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center text-gray-500 mr-4">
                <FaCalendarAlt />
                <span className="text-sm">Date/Time</span>
                <FaClock />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800">{cls.className}</h2>
                <p className="text-sm text-gray-600">{cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600">{cls.roomNumber}</div>

            <div>
              <img
                src="/teacher-avatar.png"
                alt="Teacher"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
            </div>
          </div>
        ))}
      </div>

      {selectedClass && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row gap-8 p-6 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Back Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Close modal"
              type="button"
            >
              &#8592; Back
            </button>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto pr-4">
              <h2
                id="modal-title"
                className="text-2xl font-semibold mb-4 border-b pb-2 sticky top-0 bg-white z-10"
              >
                {selectedClass.className} - Students
              </h2>
              <ul className="divide-y divide-gray-200">
                {selectedClass.students && selectedClass.students.length > 0 ? (
                  selectedClass.students.map((student) => (
                    <li key={student._id} className="py-3">
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-600">No students enrolled in this class.</p>
                )}
              </ul>
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block w-px bg-gray-300 mx-6" />

            {/* Create Activity Form */}
            <div className="flex-1 overflow-y-auto pl-4">
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2 sticky top-0 bg-white z-10">
                Create Activity for this Class
              </h2>
              <form
                onSubmit={handleCreateActivity}
                className="flex flex-col gap-4"
                style={{ maxHeight: 'calc(90vh - 72px)', overflowY: 'auto' }}
              >
                <input
                  type="text"
                  name="title"
                  placeholder="Title *"
                  value={activityData.title}
                  onChange={handleActivityChange}
                  className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  value={activityData.description}
                  onChange={handleActivityChange}
                  className="border border-gray-300 p-3 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
                <input
                  type="datetime-local"
                  name="date"
                  value={activityData.date}
                  onChange={handleActivityChange}
                  className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  name="score"
                  placeholder="Score"
                  value={activityData.score}
                  onChange={handleActivityChange}
                  className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="any"
                />
                <input
                  type="url"
                  name="link"
                  placeholder="Link (URL)"
                  value={activityData.link}
                  onChange={handleActivityChange}
                  className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="attachment"
                  placeholder="Attachment URL or filename"
                  value={activityData.attachment}
                  onChange={handleActivityChange}
                  className="border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {activityError && (
                  <p className="text-red-600 font-medium">{activityError}</p>
                )}
                {activitySuccess && (
                  <p className="text-green-600 font-medium">{activitySuccess}</p>
                )}

                <button
                  type="submit"
                  disabled={activityLoading}
                  className="mt-auto bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {activityLoading ? 'Creating...' : 'Create Activity'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;