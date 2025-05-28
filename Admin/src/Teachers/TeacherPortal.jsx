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

  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setActivityData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    setActivityError('');
    setActivitySuccess('');
    setActivityLoading(true);

    // Validate required fields including selectedClass
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
        classId: selectedClass._id,  // send classId for backend linking
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

  // Clear activity messages when modal closes
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-5xl w-full p-6 flex max-h-[80vh] gap-10"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Student List */}
            <div className="flex-1 overflow-y-auto pr-4">
              <h2 id="modal-title" className="text-xl font-bold mb-4">{selectedClass.className} - Students</h2>
              <ul className="divide-y divide-gray-200 max-h-[calc(80vh-100px)] overflow-y-auto">
                {selectedClass.students && selectedClass.students.length > 0 ? (
                  selectedClass.students.map((student) => (
                    <li key={student._id} className="py-2">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </li>
                  ))
                ) : (
                  <p>No students enrolled in this class.</p>
                )}
              </ul>
            </div>

            {/* Vertical divider with wider margin */}
            <div className="w-px bg-gray-300 mx-10" />

            {/* Create Activity Form */}
            <div className="flex-1 overflow-y-auto pl-4">
              <h2 className="text-xl font-bold mb-4">Create Activity for this Class</h2>
              <form
                onSubmit={handleCreateActivity}
                className="flex flex-col gap-4 max-h-[calc(80vh-100px)] overflow-y-auto"
              >
                <input
                  type="text"
                  name="title"
                  placeholder="Title *"
                  value={activityData.title}
                  onChange={handleActivityChange}
                  className="border p-2 rounded"
                  required
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  value={activityData.description}
                  onChange={handleActivityChange}
                  className="border p-2 rounded"
                  rows={3}
                />
                <input
                  type="datetime-local"
                  name="date"
                  value={activityData.date}
                  onChange={handleActivityChange}
                  className="border p-2 rounded"
                  required
                />
                <input
                  type="number"
                  name="score"
                  placeholder="Score"
                  value={activityData.score}
                  onChange={handleActivityChange}
                  className="border p-2 rounded"
                  min="0"
                  step="any"
                />
                <input
                  type="url"
                  name="link"
                  placeholder="Link (URL)"
                  value={activityData.link}
                  onChange={handleActivityChange}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  name="attachment"
                  placeholder="Attachment URL or filename"
                  value={activityData.attachment}
                  onChange={handleActivityChange}
                  className="border p-2 rounded"
                />

                {activityError && <p className="text-red-600">{activityError}</p>}
                {activitySuccess && <p className="text-green-600">{activitySuccess}</p>}

                <button
                  type="submit"
                  disabled={activityLoading}
                  className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
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
