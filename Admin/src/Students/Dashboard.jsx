import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LoadingSpinner = () => (
  <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center py-6">
    <svg
      className="animate-spin h-10 w-10 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
    <span className="sr-only">Loading...</span>
  </div>
);

const StudentDashboard = ({ onLogout }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user and studentId
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentName = user?.name || 'Student';
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    if (typeof onLogout === 'function') onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {studentName}!</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        {loading && <LoadingSpinner />}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && classes.length === 0 && <p>You are not enrolled in any classes.</p>}

        {!loading && !error && classes.length > 0 && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Your Enrolled Classes</h2>
            <ul className="space-y-4">
              {classes.map((cls) => (
                <li key={cls._id} className="bg-gray-100 p-4 rounded shadow">
                  <h3 className="text-xl font-bold">{cls.className}</h3>
                  <p><strong>Teacher:</strong> {cls.teacherName}</p>
                  <p><strong>Room:</strong> {cls.roomNumber}</p>
                  <p><strong>Time:</strong> {cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
