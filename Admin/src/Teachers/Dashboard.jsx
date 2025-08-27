import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaChartLine,
  FaRegFileAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaChevronDown,
  FaBookOpen,
  FaUserGraduate,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
} from "react-icons/fa";
import '../Css/Dashboard.css';

const SERVER_URL = 'https://capstone-admin-task-hub.vercel.app';
const API_BASE = 'http://localhost:5000/api';

// --- FallingBooksAnimation: Improved version ---
const FallingBooksAnimation = () => {
  const bookEmojis = ["\uD83D\uDCDA", "\uD83D\uDCD3", "\uD83D\uDCD5", "\uD83D\uDCD7", "\uD83D\uDCD8", "\uD83D\uDCD9"];
  const numberOfBooks = 7; // Reduced for less clutter

  return (
    <div className="dashboard-background" aria-hidden="true">
      {Array.from({ length: numberOfBooks }, (_, index) => {
        // Randomize horizontal position, animation duration, and delay
        const randomLeft = Math.random() * 100;
        const randomDuration = Math.random() * 8 + 7; // 7s to 15s
        const randomDelay = Math.random() * 10; // 0s to 10s
        const randomEmoji = bookEmojis[Math.floor(Math.random() * bookEmojis.length)];

        // Use translateY(-120%) to start above the visible area (no stacking at top)
        return (
          <div
            className="falling-book"
            key={`book-${index}`}
            style={{
              left: `${randomLeft}vw`,
              animationDuration: `${randomDuration}s`,
              animationDelay: `${randomDelay}s`,
              top: 0,
              transform: "translateY(-120%)", // Start above the top
            }}
          >
            {randomEmoji}
          </div>
        );
      })}
    </div>
  );
};

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    submissionRate: 0,
  });
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [error, setError] = useState(null);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?._id;
  const teacherName = user?.name || "Teacher";

  const fetchSubmissionsForClass = useCallback(async (classId, studentsInClassCount) => {
  if (!teacherId) {
      setSubmissions([]);
      setStats(prev => ({ ...prev, submissionRate: 0 }));
      return;
    }
    setLoadingSubs(true);
    setError(null);
    try {
  const res = await axios.get(
  `${API_BASE}/activities/submissions/teacher/${teacherId}`,
    { params: { classId } }
  );
      const submissionsData = res.data.submissions || [];
      const sortedSubmissions = submissionsData.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
      setSubmissions(sortedSubmissions);

      let submissionRate = 0;
      if (studentsInClassCount > 0) {
        const uniqueStudentSubmitters = new Set(submissionsData.map(sub => sub.studentId?._id));
        submissionRate = Math.round((uniqueStudentSubmitters.size / studentsInClassCount) * 100);
      }

      setStats(prevStats => ({ ...prevStats, submissionRate }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load submissions.");
      setSubmissions([]);
      setStats(prev => ({ ...prev, submissionRate: 0 }));
    } finally {
      setLoadingSubs(false);
    }
  }, [teacherId]);

  const fetchClassesAndInitialStats = useCallback(async () => {
    if (!teacherId) return;
    setLoadingStats(true);
    setError(null);
    try {
  const res = await axios.get(`${API_BASE}/class`, { params: { teacherId } });
      const fetchedClasses = res.data || [];
      const studentIdsSet = new Set();
      fetchedClasses.forEach(c => c.students?.forEach(s => studentIdsSet.add(s._id)));

      setClasses(fetchedClasses);
      const initialSelectedClass = fetchedClasses[0] || null;
      setSelectedClass(initialSelectedClass);

      setStats({
        totalClasses: fetchedClasses.length,
        totalStudents: studentIdsSet.size,
        submissionRate: 0,
      });

      if (initialSelectedClass) {
        await fetchSubmissionsForClass(initialSelectedClass._id, initialSelectedClass.students?.length || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load class data.");
    } finally {
      setLoadingStats(false);
    }
  }, [teacherId, fetchSubmissionsForClass]);

  useEffect(() => {
    fetchClassesAndInitialStats();
  }, [fetchClassesAndInitialStats]);



  // Helper to get the class with the soonest upcoming schedule
  const getSoonestClass = () => {
    // Assume each class has a 'schedule' array with { date, time } objects
    const now = new Date();
    let soonest = null;
    let soonestDate = null;
    classes.forEach(cls => {
      if (Array.isArray(cls.schedule)) {
        cls.schedule.forEach(sch => {
          if (sch.date && sch.time) {
            const dt = new Date(`${sch.date}T${sch.time}`);
            if (dt > now && (!soonestDate || dt < soonestDate)) {
              soonest = cls;
              soonestDate = dt;
            }
          }
        });
      }
    });
    return soonest;
  };

  // Helper to get all unique students across all classes
  const getAllUniqueStudents = () => {
    const allStudents = classes.flatMap(c => c.students || []);
    const unique = {};
    allStudents.forEach(s => { if (s && s._id) unique[s._id] = s; });
    return Object.values(unique);
  };

  // Helper to get all submissions across all classes
  const getAllSubmissions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/activities/submissions/teacher/${teacherId}`
      );
      return res.data.submissions || [];
    } catch {
      return [];
    }
  };

  const handleClassChange = async (e) => {
    const classId = e.target.value;
    if (classId === "ALL_CLASSES") {
      setSelectedClass({ _id: "ALL_CLASSES", className: "All Classes" });
      // Calculate total students and submissions across all classes
      const uniqueStudents = getAllUniqueStudents();
      const allSubs = await getAllSubmissions();
      setSubmissions(allSubs.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate)));
      // Submission rate: unique students who submitted / total unique students
      let submissionRate = 0;
      if (uniqueStudents.length > 0) {
        const uniqueSubmitters = new Set(allSubs.map(sub => sub.studentId?._id));
        submissionRate = Math.round((uniqueSubmitters.size / uniqueStudents.length) * 100);
      }
      setStats(prev => ({
        ...prev,
        totalClasses: classes.length,
        totalStudents: uniqueStudents.length,
        submissionRate
      }));
    } else {
      const newSelectedClass = classes.find(c => c._id === classId) || null;
      setSelectedClass(newSelectedClass);
      if (newSelectedClass) {
        fetchSubmissionsForClass(newSelectedClass._id, newSelectedClass.students?.length || 0);
      }
    }
  };

  const StatCard = ({ title, value, icon, bgColor, unit = "" }) => (
    <div className={`text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h2>
      </div>
      <p className="text-4xl font-bold">{value}{unit}</p>
    </div>
  );

  if (loadingStats && !classes.length) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <FallingBooksAnimation />
        <FaSpinner className="animate-spin text-5xl text-indigo-400" />
      </div>
    );
  }

  if (error && !classes.length) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center text-center p-6">
        <FallingBooksAnimation />
        <FaExclamationTriangle className="text-5xl text-red-400 mb-4" />
        <p className="text-red-400 text-xl font-semibold">Error loading dashboard data.</p>
        <p className="text-gray-300 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full">
      <FallingBooksAnimation />
      <div className="relative z-10 p-6 md:p-8 overflow-y-auto h-screen w-full">
        <div className="w-full">
          {/* Welcome and Stats Section Combined */}
          <div className="mb-10">
            <div className="w-full bg-gradient-to-br from-indigo-800 via-indigo-600 to-purple-700 rounded-3xl shadow-2xl p-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="flex flex-col items-center lg:items-start gap-2 z-10">
                <div className="flex items-center gap-4 mb-2">
                  <FaUserGraduate className="text-yellow-300 text-5xl drop-shadow-lg animate-pulse" />
                  <span className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">Welcome,</span>
                </div>
                <span className="text-3xl sm:text-4xl font-bold text-yellow-200 drop-shadow-lg mb-2">{teacherName}</span>
                <span className="text-indigo-100 text-lg font-medium">Empowering your teaching journey 🚀</span>
              </div>
              {/* StatCards removed from welcome section */}
              {/* Decorative background shapes */}
              <div className="absolute -top-10 -left-10 w-60 h-60 bg-indigo-900 opacity-30 rounded-full blur-2xl z-0"></div>
              <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-purple-900 opacity-20 rounded-full blur-2xl z-0"></div>
            </div>
          </div>
          {/* Class Selection Dropdown */}
          <div className="mb-8 flex items-center gap-4">
            <label htmlFor="class-select" className="text-gray-200 font-semibold">
              Select Class:
            </label>
            <select
              id="class-select"
              className="bg-gray-800 text-gray-100 rounded px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={selectedClass ? selectedClass._id : "ALL_CLASSES"}
              onChange={handleClassChange}
            >
              <option value="ALL_CLASSES">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-8">
            {/* StatCards & Ongoing Class Side by Side */}
            <div className="flex flex-col lg:flex-row gap-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                <StatCard
                  title="Total Classes"
                  value={stats.totalClasses}
                  icon={<FaChalkboardTeacher size={32} className="opacity-90" />}
                  bgColor="bg-blue-700/80"
                />
                <StatCard
                  title="Total Students"
                  value={stats.totalStudents}
                  icon={<FaUsers size={32} className="opacity-90" />}
                  bgColor="bg-green-700/80"
                />
                <StatCard
                  title="Submission Rate"
                  value={loadingSubs ? <FaSpinner className="animate-spin text-3xl" /> : stats.submissionRate}
                  unit={loadingSubs ? "" : "%"}
                  icon={<FaChartLine size={32} className="opacity-90" />}
                  bgColor="bg-purple-700/80"
                />
              </div>
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-gray-900 rounded-xl shadow-lg p-6 border border-indigo-700 h-full flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-yellow-200 mb-4 flex items-center gap-2">
                    <FaBookOpen className="text-yellow-300" /> Ongoing Class
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-semibold text-center shadow">
                    {(() => {
                      let cls = null;
                      if (selectedClass && selectedClass._id === "ALL_CLASSES") {
                        cls = getSoonestClass();
                        if (!cls) return 'No upcoming class';
                      } else if (selectedClass) {
                        cls = selectedClass;
                      }
                      if (!cls) return 'No class selected';
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
                        <>
                          <div>{cls.className}</div>
                          {soonestSched ? (
                            <div className="text-sm text-indigo-300 mt-1">
                              {soonestSched.dt.toLocaleString('en-US', { weekday: 'long' })} | {soonestSched.dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 mt-1">No upcoming schedule</div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
            {/* Recent Submissions & Enrolled Classes Stacked Vertically */}
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1">
                <section className="bg-gray-800/70 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl text-gray-100 font-semibold flex items-center gap-2">
                      <FaRegFileAlt className="text-indigo-400" />
                      Recent Submissions {selectedClass && selectedClass._id === "ALL_CLASSES" ? 'for All Classes' : selectedClass ? `for ${selectedClass.className}` : ''}
                    </h2>
                    {loadingSubs && <FaSpinner className="animate-spin text-2xl text-indigo-400" />}
                  </div>

                  {submissions.length === 0 && !loadingSubs ? (
                    <div className="text-center py-10 text-gray-400">
                      <FaRegFileAlt size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No submissions found for this class.</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {submissions.slice(0, 5).map((sub) => (
                        <li key={sub._id} className="p-4 bg-gray-900/50 rounded-lg shadow-md border border-gray-700 transition-all hover:shadow-lg hover:border-indigo-500">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div className="flex-grow">
                              <h3 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                                <FaBookOpen /> {sub.activityId?.title || "Untitled Activity"}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                <span className="font-medium text-gray-200">{sub.studentId?.name || "Unknown Student"}</span>
                                {" submitted on "}
                                {new Date(sub.submissionDate).toLocaleDateString()}
                              </p>
                              {sub.activityId?.date && (
                                <p className={`text-xs mt-1 font-semibold flex items-center gap-1 ${new Date(sub.submissionDate) > new Date(sub.activityId.date) ? "text-red-400" : "text-green-400"}`}>
                                  {new Date(sub.submissionDate) > new Date(sub.activityId.date) ? (
                                    <>
                                      <FaTimesCircle /> Late
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle /> On Time
                                    </>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-gray-900 rounded-xl shadow-lg p-6 border border-indigo-700 h-full flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-yellow-200 mb-4 flex items-center gap-2">
                    <FaClipboardList className="text-yellow-300" /> Enrolled Classes
                  </h3>
                  <ul className="space-y-3">
                    {classes.slice(0, 3).map(cls => (
                      <li key={cls._id} className="bg-gray-900 rounded-lg p-3 text-gray-100 font-semibold shadow text-center">
                        {cls.className}
                      </li>
                    ))}
                    {classes.length === 0 && <li className="text-gray-400">No enrolled classes.</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}