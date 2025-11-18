
// NOTE: This dashboard is always full width and should NEVER render a sidebar.
// If you see a sidebar here, check your router/layout setup.
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VoiceAssistant from './VoiceAssistant';
import { CheckCircle, Clock, AlertTriangle, Megaphone, Users } from 'lucide-react';
import useAutoScrollToBottom from '../hooks/useAutoScrollToBottom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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
  const [quizzes, setQuizzes] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentName = user?.name || 'Student';
  const studentId = user && user.role === 'student' ? user._id : null;

  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [activityModal, setActivityModal] = useState({ isOpen: false, type: '', activities: [], title: '' });

  const openActivityModal = (type, activities, title) => {
    console.log('Opening modal:', { type, activities: activities.length, title });
    setActivityModal({ isOpen: true, type, activities, title });
  };

  const closeActivityModal = () => {
    setActivityModal({ isOpen: false, type: '', activities: [], title: '' });
  };

  // Auto-scroll to bottom hook - triggers on data changes (using lengths to avoid array size warnings)
  useAutoScrollToBottom([classes.length, announcements.length, activities.length, submissions.length, quizzes.length, quizSubmissions.length]);

  useEffect(() => {
    if (!studentId) {
      setError('Student not logged in');
      setLoadingClasses(false);
      setLoadingAnnouncements(false);
      return;
    }

    const fetchClasses = async () => {
      try {
  const res = await axios.get(`${API_BASE_URL}/class/my-classes/${studentId}`);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoadingClasses(false);
      }
    };

    const fetchTodaySchedule = async () => {
      try {
  const res = await axios.get(`${API_BASE_URL}/schedule/today?userId=${studentId}`);
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
  const res = await axios.get(`${API_BASE_URL}/activities?classIds=${classIds}`);
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
  const res = await axios.get(`${API_BASE_URL}/submissions/student/${studentId}`);
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
  const res = await axios.get(`${API_BASE_URL}/announcements?classIds=${classIds}&studentId=${studentId}`);
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

  // Fetch quizzes
  useEffect(() => {
    if (!studentId || classes.length === 0) {
      setQuizzes([]);
      return;
    }
    const fetchQuizzes = async () => {
      try {
        const classIds = classes.map(cls => cls._id).join(',');
        if (!classIds) {
          setQuizzes([]);
          return;
        }
        const res = await axios.get(`${API_BASE_URL}/quiz?classIds=${classIds}`);
        setQuizzes(res.data || []);
      } catch (err) {
        console.error('Error fetching quizzes:', err.response?.data || err.message);
      }
    };
    fetchQuizzes();
  }, [studentId, classes]);

  // Fetch quiz submissions
  useEffect(() => {
    if (!studentId) {
      setQuizSubmissions([]);
      return;
    }
    const fetchQuizSubmissions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/quiz-submissions/student/${studentId}`);
        setQuizSubmissions(res.data || []);
      } catch (err) {
        console.error('Error fetching quiz submissions:', err.response?.data || err.message);
      }
    };
    fetchQuizSubmissions();
  }, [studentId, quizzes]);

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

  const filteredQuizzes = quizzes.filter(q =>
    classes.some(cls => cls._id === (q.classId?._id || q.classId))
  );

  // Quiz submission mapping
  const quizSubmissionMap = {};
  quizSubmissions.forEach(sub => {
    const quizId = sub.quizId && sub.quizId._id ? sub.quizId._id : sub.quizId;
    if (quizId) {
      quizSubmissionMap[quizId] = sub;
    }
  });

  // Activity calculations
  const totalPendingActivities = filteredActivities.filter(a => !submissionMap[a._id] && new Date(a.date) >= now).length;
  const totalLateActivities = filteredActivities.filter(a => {
    const sub = submissionMap[a._id];
    return sub && new Date(sub.submissionDate) > new Date(a.date);
  }).length;
  const totalMissingActivities = filteredActivities.filter(a => {
    const sub = submissionMap[a._id];
    return !sub && new Date(a.date) < now;
  }).length;

  // Quiz calculations
  const totalPendingQuizzes = filteredQuizzes.filter(q => !quizSubmissionMap[q._id] && new Date(q.dueDate) >= now).length;
  const totalLateQuizzes = filteredQuizzes.filter(q => {
    const sub = quizSubmissionMap[q._id];
    return sub && new Date(sub.submissionDate) > new Date(q.dueDate);
  }).length;
  const totalMissingQuizzes = filteredQuizzes.filter(q => {
    const sub = quizSubmissionMap[q._id];
    return !sub && new Date(q.dueDate) < now;
  }).length;

  return (
    // This page is intentionally full width, no sidebar allowed
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 w-full min-w-0 mx-0 scrollbar-hidden overflow-y-auto overflow-x-hidden pt-4 pb-8 sm:pb-12">
      {/* Welcome section */}
      <div className="w-full flex items-center justify-center py-6">
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

  <div className="relative z-10 w-full max-w-full p-2 sm:p-4 md:p-6 mx-auto overflow-x-hidden min-w-0 mb-4 sm:mb-6">



        {/* Voice Assistant Button */}
        {studentId && (
          <div className="flex justify-center items-center w-full my-8">
            <VoiceAssistant userId={studentId} todaysClassTime={todaysSchedule[0]?.time || ""} />
          </div>
        )}

  <main className="rounded-lg p-2 sm:p-4 md:p-6 shadow-lg backdrop-blur-xl border border-indigo-700 w-full max-w-none overflow-x-hidden">
          {/* Summary Section */}
          <section className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Activity Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-center">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const pendingActivities = filteredActivities.filter(a => !submissionMap[a._id] && new Date(a.date) >= now);
                  console.log('Pending Activities button clicked:', pendingActivities.length);
                  openActivityModal('pending', pendingActivities, 'Pending Activities');
                }}
                className="bg-indigo-100/80 p-2 sm:p-3 rounded shadow flex flex-col items-center hover:bg-indigo-200/80 transition-colors cursor-pointer"
              >
                <CheckCircle className="text-indigo-600 mb-1" size={24} />
                <p className="text-lg sm:text-2xl font-bold text-indigo-700">{totalPendingActivities}</p>
                <p className="text-indigo-900 font-semibold text-xs">Pending Activities</p>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const lateActivities = filteredActivities.filter(a => {
                    const sub = submissionMap[a._id];
                    return sub && new Date(sub.submissionDate) > new Date(a.date);
                  });
                  console.log('Late Activities button clicked:', lateActivities.length);
                  openActivityModal('late', lateActivities, 'Late Activities');
                }}
                className="bg-yellow-100/80 p-2 sm:p-3 rounded shadow flex flex-col items-center hover:bg-yellow-200/80 transition-colors cursor-pointer"
              >
                <Clock className="text-yellow-600 mb-1" size={24} />
                <p className="text-lg sm:text-2xl font-bold text-yellow-700">{totalLateActivities}</p>
                <p className="text-yellow-900 font-semibold text-xs">Late Activities</p>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const missingActivities = filteredActivities.filter(a => {
                    const sub = submissionMap[a._id];
                    return !sub && new Date(a.date) < now;
                  });
                  console.log('Missing Activities button clicked:', missingActivities.length);
                  openActivityModal('missing', missingActivities, 'Missing Activities');
                }}
                className="bg-red-100/80 p-2 sm:p-3 rounded shadow flex flex-col items-center hover:bg-red-200/80 transition-colors cursor-pointer"
              >
                <AlertTriangle className="text-red-600 mb-1" size={24} />
                <p className="text-lg sm:text-2xl font-bold text-red-700">{totalMissingActivities}</p>
                <p className="text-red-900 font-semibold text-xs">Missing Activities</p>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const pendingQuizzes = filteredQuizzes.filter(q => !quizSubmissionMap[q._id] && new Date(q.dueDate) >= now);
                  console.log('Pending Quizzes button clicked:', pendingQuizzes.length);
                  openActivityModal('pending-quiz', pendingQuizzes, 'Pending Quizzes');
                }}
                className="bg-blue-100/80 p-2 sm:p-3 rounded shadow flex flex-col items-center hover:bg-blue-200/80 transition-colors cursor-pointer"
              >
                <CheckCircle className="text-blue-600 mb-1" size={24} />
                <p className="text-lg sm:text-2xl font-bold text-blue-700">{totalPendingQuizzes}</p>
                <p className="text-blue-900 font-semibold text-xs">Pending Quiz</p>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const lateQuizzes = filteredQuizzes.filter(q => {
                    const sub = quizSubmissionMap[q._id];
                    return sub && new Date(sub.submissionDate) > new Date(q.dueDate);
                  });
                  console.log('Late Quizzes button clicked:', lateQuizzes.length);
                  openActivityModal('late-quiz', lateQuizzes, 'Late Quizzes');
                }}
                className="bg-orange-100/80 p-2 sm:p-3 rounded shadow flex flex-col items-center hover:bg-orange-200/80 transition-colors cursor-pointer"
              >
                <Clock className="text-orange-600 mb-1" size={24} />
                <p className="text-lg sm:text-2xl font-bold text-orange-700">{totalLateQuizzes}</p>
                <p className="text-orange-900 font-semibold text-xs">Late Quiz</p>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const missingQuizzes = filteredQuizzes.filter(q => {
                    const sub = quizSubmissionMap[q._id];
                    return !sub && new Date(q.dueDate) < now;
                  });
                  console.log('Missing Quizzes button clicked:', missingQuizzes.length);
                  openActivityModal('missing-quiz', missingQuizzes, 'Missing Quizzes');
                }}
                className="bg-red-200/80 p-2 sm:p-3 rounded shadow flex flex-col items-center hover:bg-red-300/80 transition-colors cursor-pointer"
              >
                <AlertTriangle className="text-red-700 mb-1" size={24} />
                <p className="text-lg sm:text-2xl font-bold text-red-800">{totalMissingQuizzes}</p>
                <p className="text-red-900 font-semibold text-xs">Missing Quiz</p>
              </button>
            </div>
          </section>

          {/* Classes and Announcements - Mobile: Stacked, Desktop: Side by Side */}
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 min-w-0 w-full mb-8">
            {/* Classes List - Always appears first on mobile */}
            <section className="min-w-0 w-full order-1">
              {loadingClasses && <LoadingSpinner />}
              {error && <p className="text-red-600">{error}</p>}
              {!loadingClasses && !error && classes.length === 0 && <p className="text-white">You are not enrolled in any classes.</p>}

              {!loadingClasses && !error && classes.length > 0 && (
                <>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Your Enrolled Classes</h2>
                  <ul className="space-y-3 sm:space-y-4 pb-4">
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
                        <li key={cls._id} className="bg-gray-200/80 p-3 sm:p-4 rounded shadow min-w-0">
                          <h3 className="text-lg sm:text-xl text-black font-bold truncate">{cls.className}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                            <p className="text-black mr-0 sm:mr-4 text-sm sm:text-base"><strong>Teacher:</strong> <span className="truncate">{cls.teacherName}</span></p>
                            <p className="text-black mr-0 sm:mr-4 text-sm sm:text-base"><strong>Room:</strong> <span className="truncate">{cls.roomNumber}</span></p>
                            <p className="text-black text-sm sm:text-base">
                              <strong>Time:</strong> <span className="truncate">{
                                soonestSched
                                  ? soonestSched.dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ` | ${soonestSched.dt.toLocaleString('en-US', { weekday: 'long' })}`
                                  : (cls.time && !isNaN(new Date(`1970-01-01T${cls.time}`).getTime())
                                      ? new Date(`1970-01-01T${cls.time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : 'TBA')
                              }</span>
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>

            {/* Announcements Section - Always appears second on mobile */}
            <section className="min-w-0 w-full order-2">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Announcements</h2>
              {loadingAnnouncements && <LoadingSpinner />}
              {!loadingAnnouncements && announcements.length === 0 && <p className="text-white">No announcements available.</p>}
              {!loadingAnnouncements && announcements.length > 0 && (
                <ul className="space-y-2 sm:space-y-3 pb-8">
                  {announcements.map((ann) => (
                    <li key={ann._id} className="bg-green-100/80 p-2 sm:p-3 rounded shadow text-green-900 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{ann.title}</p>
                      <p className="text-xs sm:text-sm italic">
                        {(() => {
                          // Try different date fields in order of preference
                          const dateToUse = ann.createdAt || ann.date || ann.announcementDate || new Date().toISOString();
                          const dateObj = new Date(dateToUse);
                          
                          // Check if date is valid
                          if (dateObj && !isNaN(dateObj.getTime())) {
                            return `Posted on ${dateObj.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at ${dateObj.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}`;
                          } else {
                            // Fallback to current date
                            const now = new Date();
                            return `Posted on ${now.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at ${now.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}`;
                          }
                        })()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
        
        {/* Extra spacing for mobile scroll */}
        <div className="h-8 sm:h-12 w-full"></div>
      </div>

      {/* Activity Details Modal */}
      {activityModal.isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-[1px] flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={closeActivityModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{activityModal.title}</h3>
              <button
                onClick={closeActivityModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {activityModal.activities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activities found.</p>
              ) : (
                <div className="space-y-4">
                  {activityModal.activities.map((activity) => {
                    const classInfo = classes.find(cls => cls._id === (activity.classId?._id || activity.classId));
                    const submission = submissionMap[activity._id];
                    return (
                      <div key={activity._id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{activity.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            activityModal.type === 'submitted' ? 'bg-green-100 text-green-800' :
                            activityModal.type === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {activityModal.type === 'submitted' ? 'Submitted' :
                             activityModal.type === 'late' ? 'Late' : 'Missing'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <p><strong>Class:</strong> {classInfo?.className || 'Unknown Class'}</p>
                          <p><strong>Teacher:</strong> {classInfo?.teacherName || 'Unknown Teacher'}</p>
                          <p><strong>Due Date:</strong> {(() => {
                            const dateObj = new Date(activity.date);
                            if (dateObj && !isNaN(dateObj.getTime())) {
                              return `${dateObj.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })} at ${dateObj.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}`;
                            }
                            return 'No due date';
                          })()}</p>
                          {submission && (
                            <p><strong>Submitted:</strong> {(() => {
                              const subDate = new Date(submission.submissionDate);
                              if (subDate && !isNaN(subDate.getTime())) {
                                return `${subDate.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })} at ${subDate.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}`;
                              }
                              return 'Unknown date';
                            })()}</p>
                          )}
                        </div>
                        {activity.description && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            <strong>Description:</strong> {activity.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;