import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentPortal = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClass, setSelectedClass] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);

  // Get user from localStorage and check if student
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user && user.role === 'student' ? user._id : null;

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in');
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/classes?studentId=${studentId}`);
        setClasses(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [studentId]);

  // Fetch activities for selected class
  useEffect(() => {
    if (!selectedClass) {
      setActivities([]);
      setActivitiesError(null);
      return;
    }

    const fetchActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError(null);
      try {
        // Assuming your API supports filtering by classId
        const res = await axios.get(`http://localhost:5000/api/activities?classId=${selectedClass._id}`);
        setActivities(res.data);
      } catch (err) {
        setActivitiesError(err.response?.data?.message || err.message);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, [selectedClass]);

  if (loading) return <p>Loading your classes...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (classes.length === 0) return <p>You are not enrolled in any classes.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Your Enrolled Classes</h1>
      <ul className="space-y-4">
        {classes.map((cls) => (
          <li
            key={cls._id}
            className="bg-gray-100 p-4 rounded shadow cursor-pointer hover:bg-gray-200"
            onClick={() => setSelectedClass(cls)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedClass(cls);
            }}
          >
            <h2 className="text-xl font-bold">{cls.className}</h2>
            <p><strong>Teacher:</strong> {cls.teacherName}</p>
            <p><strong>Room:</strong> {cls.roomNumber}</p>
            <p><strong>Time:</strong> {cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}</p>
          </li>
        ))}
      </ul>

      {/* Activities Modal */}
      {selectedClass && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedClass(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="activities-modal-title"
          >
            <h2 id="activities-modal-title" className="text-xl font-bold mb-4">
              Activities for {selectedClass.className}
            </h2>

            {activitiesLoading && <p>Loading activities...</p>}
            {activitiesError && <p className="text-red-600">Error: {activitiesError}</p>}

            {!activitiesLoading && activities.length === 0 && <p>No activities available for this class.</p>}

            <ul className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <li key={activity._id} className="py-3">
                  <h3 className="font-semibold">{activity.title}</h3>
                  <p className="text-sm text-gray-600">{activity.description || 'No description'}</p>
                  <p className="text-xs text-gray-500">
                    Date: {activity.date ? new Date(activity.date).toLocaleString() : 'N/A'}
                  </p>
                  {activity.score !== undefined && (
                    <p className="text-xs text-gray-500">Score: {activity.score}</p>
                  )}
                  {activity.link && (
                    <p className="text-xs text-blue-600">
                      <a href={activity.link} target="_blank" rel="noreferrer">Link</a>
                    </p>
                  )}
                  {activity.attachment && (
                    <p className="text-xs text-gray-500">Attachment: {activity.attachment}</p>
                  )}
                </li>
              ))}
            </ul>

            <button
              className="mt-6 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              onClick={() => setSelectedClass(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
