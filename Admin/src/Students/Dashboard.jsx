
// NOTE: This dashboard is always full width and should NEVER render a sidebar.
// If you see a sidebar here, check your router/layout setup.
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VoiceAssistant from './VoiceAssistant';
import { CheckCircle, Clock, AlertTriangle, Megaphone, Users } from 'lucide-react';
import useAutoScrollToBottom from '../hooks/useAutoScrollToBottom';
import { StudentThemeContext } from '../contexts/StudentThemeContext';

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
  useAutoScrollToBottom([classes.length, announcements.length, activities.length, submissions.length, quizzes.length]);

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
        // Fetch quizzes from all classes with student submissions
        const allQuizzes = [];
        for (const classId of classIds.split(',')) {
          try {
            const res = await axios.get(`${API_BASE_URL}/quizzes/class/${classId.trim()}?studentId=${studentId}`);
            if (res.data && Array.isArray(res.data)) {
              allQuizzes.push(...res.data);
            }
          } catch (classErr) {
            console.error(`Error fetching quizzes for class ${classId}:`, classErr.response?.data || classErr.message);
          }
        }
        setQuizzes(allQuizzes);
      } catch (err) {
        console.error('Error fetching quizzes:', err.response?.data || err.message);
      }
    };
    fetchQuizzes();
  }, [studentId, classes]);

  // Note: Quiz submissions are fetched through individual quiz endpoints when needed

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

  // Quiz submission mapping (extract from quiz.submissions)
  const quizSubmissionMap = {};
  quizzes.forEach(quiz => {
    if (quiz.submissions && quiz.submissions.length > 0) {
      // Take the first submission (students can only submit once)
      quizSubmissionMap[quiz._id] = quiz.submissions[0];
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
    <div className={`relative min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-50 via-white to-indigo-50 w-full min-w-0 mx-0 scrollbar-hidden overflow-y-auto overflow-x-hidden pt-16 sm:pt-4 md:pt-6 pb-8 sm:pb-12 md:pb-16 px-2 sm:px-4 md:px-6 lg:px-8`}>
      {/* Welcome section */}
      <div className="w-full flex items-center justify-center py-4 sm:py-6 md:py-8">
        <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-blue-900 tracking-tight w-full text-center`}>Welcome, {studentName}!</h1>
      </div>

  <div className="relative z-10 w-full max-w-7xl p-0 sm:p-2 md:p-4 mx-auto overflow-x-hidden min-w-0 mb-2 sm:mb-4 md:mb-6">



        {/* Voice Assistant Button */}
        {studentId && (
          <div className="flex justify-center items-center w-full my-4 sm:my-6 md:my-8">
            <VoiceAssistant userId={studentId} todaysClassTime={todaysSchedule[0]?.time || ""} />
          </div>
        )}

  <main className={`rounded-xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg bg-white border-2 border-blue-200 w-full max-w-none overflow-x-hidden`}>
          {/* Summary Section */}
          <section className="mb-4 sm:mb-6 md:mb-8">
            <h2 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-3 sm:mb-4 md:mb-6 text-blue-900`}>Activity Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-5 text-center">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const pendingActivities = filteredActivities.filter(a => !submissionMap[a._id] && new Date(a.date) >= now);
                  console.log('Pending Activities button clicked:', pendingActivities.length);
                  openActivityModal('pending', pendingActivities, 'Pending Activities');
                }}
                className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-2 sm:p-3 md:p-4 rounded-xl shadow-md border-l-4 border-indigo-400 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
              >
                <CheckCircle className="text-indigo-600 mb-1 sm:mb-2" size={20} />
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-indigo-700">{totalPendingActivities}</p>
                <p className="text-indigo-900 font-semibold text-xs sm:text-sm md:text-base">Pending</p>
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
                className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-2 sm:p-3 md:p-4 rounded-xl shadow-md border-l-4 border-yellow-400 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
              >
                <Clock className="text-yellow-600 mb-1 sm:mb-2" size={20} />
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-700">{totalLateActivities}</p>
                <p className="text-yellow-900 font-semibold text-xs sm:text-sm md:text-base">Late</p>
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
                className="bg-gradient-to-r from-red-50 to-red-100 p-2 sm:p-3 md:p-4 rounded-xl shadow-md border-l-4 border-red-400 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
              >
                <AlertTriangle className="text-red-600 mb-1 sm:mb-2" size={20} />
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-700">{totalMissingActivities}</p>
                <p className="text-red-900 font-semibold text-xs sm:text-sm md:text-base">Missing</p>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const pendingQuizzes = filteredQuizzes.filter(q => !quizSubmissionMap[q._id] && new Date(q.dueDate) >= now);
                  console.log('Pending Quizzes button clicked:', pendingQuizzes.length);
                  openActivityModal('pending-quiz', pendingQuizzes, 'Pending Quizzes');
                }}
                className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 sm:p-3 md:p-4 rounded-xl shadow-md border-l-4 border-blue-400 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
              >
                <CheckCircle className="text-blue-600 mb-1 sm:mb-2" size={20} />
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-700">{totalPendingQuizzes}</p>
                <p className="text-blue-900 font-semibold text-xs sm:text-sm md:text-base">Quiz</p>
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
                className="bg-gradient-to-r from-orange-50 to-orange-100 p-2 sm:p-3 md:p-4 rounded-xl shadow-md border-l-4 border-orange-400 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
              >
                <Clock className="text-orange-600 mb-1 sm:mb-2" size={20} />
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-orange-700">{totalLateQuizzes}</p>
                <p className="text-orange-900 font-semibold text-xs sm:text-sm md:text-base">Late Quiz</p>
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
                className="bg-gradient-to-r from-red-100 to-red-200 p-2 sm:p-3 md:p-4 rounded-xl shadow-md border-l-4 border-red-500 flex flex-col items-center justify-center hover:shadow-lg transition-all cursor-pointer min-h-[80px] sm:min-h-[100px] md:min-h-[120px]"
              >
                <AlertTriangle className="text-red-700 mb-1 sm:mb-2" size={20} />
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-800">{totalMissingQuizzes}</p>
                <p className="text-red-900 font-semibold text-xs sm:text-sm md:text-base">Missing Quiz</p>
              </button>
            </div>
          </section>

          {/* Classes and Announcements - Mobile: Stacked, Desktop: Side by Side */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8 min-w-0 w-full mb-6 sm:mb-8 md:mb-10">
            {/* Classes List - Always appears first on mobile */}
            <section className="min-w-0 w-full order-1">
              {loadingClasses && <LoadingSpinner />}
              {error && <p className="text-red-600 text-sm sm:text-base">{error}</p>}
              {!loadingClasses && !error && classes.length === 0 && <p className={`text-gray-700 text-sm sm:text-base`}>You are not enrolled in any classes.</p>}

              {!loadingClasses && !error && classes.length > 0 && (
                <>
                  <h2 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-3 sm:mb-4 md:mb-6 text-blue-900`}>Your Enrolled Classes</h2>
                  <ul className="space-y-3 sm:space-y-4 md:space-y-5 pb-4">
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
                        <li key={cls._id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 md:p-5 rounded-xl shadow-md border-2 border-blue-200 hover:shadow-lg transition-all min-w-0">
                          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-900 font-bold truncate mb-2">{cls.className}</h3>
                          <div className="flex flex-col gap-2">
                            <p className="text-gray-700 text-xs sm:text-sm md:text-base"><strong>Teacher:</strong> <span className="truncate">{cls.teacherName}</span></p>
                            <p className="text-gray-700 text-xs sm:text-sm md:text-base"><strong>Room:</strong> <span className="truncate">{cls.roomNumber}</span></p>
                            <p className="text-gray-700 text-xs sm:text-sm md:text-base">
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
              <h2 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-3 sm:mb-4 md:mb-6 text-blue-900`}>Recent Announcements</h2>
              {loadingAnnouncements && <LoadingSpinner />}
              {!loadingAnnouncements && announcements.length === 0 && <p className={`text-gray-700 text-sm sm:text-base`}>No announcements available.</p>}
              {!loadingAnnouncements && announcements.length > 0 && (
                <ul className="space-y-2 sm:space-y-3 md:space-y-4 pb-4 sm:pb-8">
                  {announcements.map((ann) => (
                    <li key={ann._id} className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 md:p-5 rounded-xl shadow-md border-2 border-green-200 hover:shadow-lg transition-all text-green-900 min-w-0">
                      <p className="font-semibold text-sm sm:text-base md:text-lg truncate">{ann.title}</p>
                      <p className="text-xs sm:text-sm md:text-base italic mt-1">
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
        <div className="h-12 sm:h-16 md:h-20 w-full"></div>
      </div>

      {/* Activity Details Modal */}
      {activityModal.isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-[1px] bg-black/30 flex items-center justify-center p-3 sm:p-4 md:p-6 z-[9999]"
          onClick={closeActivityModal}
        >
          <div 
            className={`bg-white border-blue-200 rounded-xl sm:rounded-2xl shadow-2xl max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-hidden border-2`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-blue-900">{activityModal.title}</h3>
              <button
                onClick={closeActivityModal}
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
              {activityModal.activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm sm:text-base">No activities found.</p>
              ) : (
                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                  {activityModal.activities.map((activity) => {
                    const classInfo = classes.find(cls => cls._id === (activity.classId?._id || activity.classId));
                    const submission = submissionMap[activity._id];
                    return (
                      <div key={activity._id} className={`bg-blue-50 p-3 sm:p-4 md:p-5 rounded-lg border-2 border-blue-200`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">{activity.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                            activityModal.type === 'submitted' ? 'bg-green-100 text-green-800' :
                            activityModal.type === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {activityModal.type === 'submitted' ? 'Submitted' :
                             activityModal.type === 'late' ? 'Late' : 'Missing'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm md:text-base text-gray-600">
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
                          <p className="mt-2 text-sm text-gray-700">
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