import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

// eslint-disable-next-line no-empty-pattern
const StudentDashboard = ({ }) => {
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [, setLoadingActivities] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentName = user?.name || 'Student';
  const studentId = user && user.role === 'student' ? user._id : null;

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in');
      setLoadingClasses(false);
      setLoadingActivities(false);
      setLoadingAnnouncements(false);
      return;
    }

    // Fetch classes
    const fetchClasses = async () => {
      try {
        // UPDATED: Pinalitan ang 'classes' to 'class' para tumugma sa backend route
        const res = await axios.get(`http://localhost:5000/api/class?studentId=${studentId}`);
        setClasses(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoadingClasses(false);
      }
    };

    // Fetch activities
    const fetchActivities = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/activities?studentId=${studentId}`);
        setActivities(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoadingActivities(false);
      }
    };

    // Fetch announcements (example endpoint or mock)
    const fetchAnnouncements = async () => {
      try {
        // Replace with your real announcements API if available
        const res = await axios.get(`http://localhost:5000/api/announcements?studentId=${studentId}`);
        setAnnouncements(res.data);
      } catch {
        // fallback to mock announcements if API fails or not available
        setAnnouncements([
          { _id: '1', title: 'Welcome to the new semester!', date: '2025-06-01' },
          { _id: '2', title: 'Midterm exams start next month.', date: '2025-06-15' },
        ]);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchClasses();
    fetchActivities();
    fetchAnnouncements();
  }, [studentId]);


  // Compute counts for summary
  const now = new Date();
  const totalSubmitted = activities.filter(a => a.attachment).length;
  const totalLate = activities.filter(a => a.attachment && new Date(a.submittedAt) > new Date(a.date)).length;
  const totalMissing = activities.filter(a => !a.attachment && new Date(a.date) < now).length;

  return (
    <div className="min-h-screen relative">
      {/* Background with falling books */}
      <div className="app-background" aria-hidden="true">
        <FallingBooksAnimation />
      </div>

      {/* UPDATED: Added overflow-y-auto to enable scrolling */}
      <div className="relative z-10 h-screen overflow-y-auto pl-0 p-6" style={{ marginLeft: '-1rem', width: 'calc(100% + 1rem)' }}>
        <header className="max-w-4xl mx-auto flex justify-between items-center mb-8 text-white">
          <h1 className="text-3xl font-bold">Welcome, {studentName}!</h1>
        </header>

        <main className="max-w-6xl mr-50 mx-auto rounded-lg p-6 shadow-lg">
          {/* Summary Section */}
          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Activity Summary</h2>
            <div className="grid grid-cols-4 gap-6 text-center">
              <div className="bg-indigo-100 p-4 rounded shadow">
                <p className="text-3xl font-bold text-indigo-700">{totalSubmitted}</p>
                <p className="text-indigo-900 font-semibold">Submitted</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded shadow">
                <p className="text-3xl font-bold text-yellow-700">{totalLate}</p>
                <p className="text-yellow-900 font-semibold">Late</p>
              </div>
              <div className="bg-red-100 p-4 rounded shadow">
                <p className="text-3xl font-bold text-red-700">{totalMissing}</p>
                <p className="text-red-900 font-semibold">Missing</p>
              </div>
              <div className="bg-green-100 p-4 rounded shadow">
                <p className="text-3xl font-bold text-green-700">{announcements.length}</p>
                <p className="text-green-900 font-semibold">Announcements</p>
              </div>
            </div>
          </section>

          {/* Classes List */}
          {loadingClasses && <LoadingSpinner />}
          {error && <p className="text-red-600">{error}</p>}
          {!loadingClasses && !error && classes.length === 0 && <p>You are not enrolled in any classes.</p>}

          {!loadingClasses && !error && classes.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mb-4 text-gray-100">Your Enrolled Classes</h2>
              <ul className="space-y-4">
                {classes.map((cls) => (
                  <li key={cls._id} className="bg-gray-200 p-4 rounded shadow">
                    <h3 className="text-xl text-black font-bold">{cls.className}</h3>
                    <div className="flex items-center">
                      <p className="text-black mr-4"><strong>Teacher:</strong> {cls.teacherName}</p>
                      <p className="text-black mr-4"><strong>Room:</strong> {cls.roomNumber}</p>
                      <p className="text-black"><strong>Time:</strong> {cls.time ? new Date(cls.time).toLocaleString() : 'TBA'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Announcements Section */}
          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Announcements</h2>
            {loadingAnnouncements && <LoadingSpinner />}
            {!loadingAnnouncements && announcements.length === 0 && <p>No announcements available.</p>}
            {!loadingAnnouncements && announcements.length > 0 && (
              <ul className="space-y-3">
                {announcements.map((ann) => (
                  <li key={ann._id} className="bg-green-100 p-3 rounded shadow text-green-900">
                    <p className="font-semibold">{ann.title}</p>
                    <p className="text-sm italic">{new Date(ann.date).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;