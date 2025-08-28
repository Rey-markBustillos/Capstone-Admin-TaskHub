import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VoiceAssistant from './VoiceAssistant';
import { CheckCircle, Clock, AlertTriangle, Megaphone } from 'lucide-react';

const API_BASE = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Falling books animation (unchanged)
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

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentName = user?.name || 'Student';
  const studentId = user && user.role === 'student' ? user._id : null;

  const [todaysSchedule, setTodaysSchedule] = useState([]);

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in');
      setLoadingClasses(false);
      setLoadingAnnouncements(false);
      return;
    }

    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API_BASE}/class/my-classes/${studentId}`);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoadingClasses(false);
      }
    };

    const fetchTodaySchedule = async () => {
      try {
        const res = await axios.get(`${API_BASE}/schedule/today?userId=${studentId}`);
        setTodaysSchedule(res.data.schedule || []);
      } catch {
        setTodaysSchedule([]);
      }
    };

    fetchClasses();
    fetchTodaySchedule();
    const handleStorage = (e) => {
      if (e.key === 'user') {
        fetchClasses();
        fetchTodaySchedule();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [studentId]);

  useEffect(() => {
    if (!studentId || classes.length === 0) {
      setActivities([]);
      return;
    }
    const fetchActivities = async () => {
      try {
        const classIds = classes.map(cls => cls._id).join(',');
        if (!classIds) {
          setActivities([]);
          return;
        }
        const res = await axios.get(`${API_BASE}/activities?classIds=${classIds}`);
        setActivities(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };
    fetchActivities();
  }, [studentId, classes]);

  useEffect(() => {
    if (!studentId) {
      setSubmissions([]);
      return;
    }
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/submissions/student/${studentId}`);
        setSubmissions(res.data.submissions || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      }
    };
    fetchSubmissions();
  }, [studentId, activities]);

  useEffect(() => {
    if (!studentId || classes.length === 0) {
      setAnnouncements([]);
      setLoadingAnnouncements(false);
      return;
    }
    setLoadingAnnouncements(true);
    const fetchAnnouncements = async () => {
      try {
        const classIds = classes.map(cls => cls._id).join(',');
        if (!classIds) {
          setAnnouncements([]);
          setLoadingAnnouncements(false);
          return;
        }
        const res = await axios.get(`${API_BASE}/announcements?classIds=${classIds}&studentId=${studentId}`);
        setAnnouncements(res.data || []);
      } catch {
        setAnnouncements([
          { _id: '1', title: 'Welcome to the new semester!', date: '2025-06-01' },
          { _id: '2', title: 'Midterm exams start next month.', date: '2025-06-15' },
        ]);
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, [studentId, classes]);

  const now = new Date();
  const submissionMap = {};
  submissions.forEach(sub => {
    const actId = sub.activityId && sub.activityId._id ? sub.activityId._id : sub.activityId;
    if (actId) {
      submissionMap[actId] = sub;
    }
  });

  const filteredActivities = activities.filter(a =>
    classes.some(cls => cls._id === (a.classId?._id || a.classId))
  );

  const totalSubmitted = filteredActivities.filter(a => submissionMap[a._id]).length;
  const totalLate = filteredActivities.filter(a => {
    const sub = submissionMap[a._id];
    return sub && new Date(sub.submissionDate) > new Date(a.date);
  }).length;
  const totalMissing = filteredActivities.filter(a => {
    const sub = submissionMap[a._id];
    return !sub && new Date(a.date) < now;
  }).length;

  return (
  <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 overflow-hidden w-full">
      {/* Welcome section at the very top, no margin above */}
      <div className="w-full flex items-center justify-center pt-8 pb-6">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight w-full text-center">Welcome, {studentName}!</h1>
      </div>
      {/* Decorative background blobs (same as login) */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3"
      >
        <div className="w-[24rem] sm:w-[40rem] h-[24rem] sm:h-[40rem] rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-30 blur-3xl"></div>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3"
      >
        <div className="w-[24rem] sm:w-[40rem] h-[24rem] sm:h-[40rem] rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 opacity-30 blur-3xl"></div>
      </div>
      {/* Falling books */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <FallingBooksAnimation />
      </div>

  <div className="relative z-10 w-full h-full overflow-y-auto p-2 sm:p-4 md:p-6 max-w-none mx-auto">



        {/* Voice Assistant Button */}
        {studentId && (
          <div className="flex justify-center items-center w-full my-8">
            <VoiceAssistant userId={studentId} todaysClassTime={todaysSchedule[0]?.time || ""} />
          </div>
        )}

        <main className="rounded-lg p-2 sm:p-4 md:p-6 shadow-lg backdrop-blur-xl border border-indigo-700">
          {/* Summary Section */}
          <section className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Activity Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div className="bg-indigo-100/80 p-3 sm:p-4 rounded shadow flex flex-col items-center">
                <CheckCircle className="text-indigo-600 mb-1" size={32} />
                <p className="text-2xl sm:text-3xl font-bold text-indigo-700">{totalSubmitted}</p>
                <p className="text-indigo-900 font-semibold text-xs sm:text-base">Submitted</p>
              </div>
              <div className="bg-yellow-100/80 p-3 sm:p-4 rounded shadow flex flex-col items-center">
                <Clock className="text-yellow-600 mb-1" size={32} />
                <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{totalLate}</p>
                <p className="text-yellow-900 font-semibold text-xs sm:text-base">Late</p>
              </div>
              <div className="bg-red-100/80 p-3 sm:p-4 rounded shadow flex flex-col items-center">
                <AlertTriangle className="text-red-600 mb-1" size={32} />
                <p className="text-2xl sm:text-3xl font-bold text-red-700">{totalMissing}</p>
                <p className="text-red-900 font-semibold text-xs sm:text-base">Missing</p>
              </div>
              <div className="bg-green-100/80 p-3 sm:p-4 rounded shadow flex flex-col items-center">
                <Megaphone className="text-green-600 mb-1" size={32} />
                <p className="text-2xl sm:text-3xl font-bold text-green-700">{announcements.length}</p>
                <p className="text-green-900 font-semibold text-xs sm:text-base">Announcements</p>
              </div>
            </div>
          </section>

          {/* Classes List */}
          {loadingClasses && <LoadingSpinner />}
          {error && <p className="text-red-600">{error}</p>}
          {!loadingClasses && !error && classes.length === 0 && <p className="text-white">You are not enrolled in any classes.</p>}

          {!loadingClasses && !error && classes.length > 0 && (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Your Enrolled Classes</h2>
              <ul className="space-y-3 sm:space-y-4">
                {classes.map((cls) => {
                  // Find soonest schedule for this class
                  let soonestSched = null;
                  if (Array.isArray(cls.schedule) && cls.schedule.length > 0) {
                    const now = new Date();
                    cls.schedule.forEach(sch => {
                      if (sch.date && sch.time) {
                        const dt = new Date(`${sch.date}T${sch.time}`);
                        if (dt > now && (!soonestSched || dt < soonestSched.dt)) {
                          soonestSched = { ...sch, dt };
                        }
                      }
                    });
                  }
                  return (
                    <li key={cls._id} className="bg-gray-200/80 p-3 sm:p-4 rounded shadow">
                      <h3 className="text-lg sm:text-xl text-black font-bold">{cls.className}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <p className="text-black mr-0 sm:mr-4"><strong>Teacher:</strong> {cls.teacherName}</p>
                        <p className="text-black mr-0 sm:mr-4"><strong>Room:</strong> {cls.roomNumber}</p>
                        <p className="text-black">
                          <strong>Time:</strong> {
                            soonestSched
                              ? soonestSched.dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ` | ${soonestSched.dt.toLocaleString('en-US', { weekday: 'long' })}`
                              : (cls.time && !isNaN(new Date(`1970-01-01T${cls.time}`).getTime())
                                  ? new Date(`1970-01-01T${cls.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'TBA')
                          }
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Announcements Section */}
          <section className="mt-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Announcements</h2>
            {loadingAnnouncements && <LoadingSpinner />}
            {!loadingAnnouncements && announcements.length === 0 && <p className="text-white">No announcements available.</p>}
            {!loadingAnnouncements && announcements.length > 0 && (
              <ul className="space-y-2 sm:space-y-3">
                {announcements.map((ann) => (
                  <li key={ann._id} className="bg-green-100/80 p-2 sm:p-3 rounded shadow text-green-900">
                    <p className="font-semibold">{ann.title}</p>
                    <p className="text-xs sm:text-sm italic">{new Date(ann.date).toLocaleDateString()}</p>
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