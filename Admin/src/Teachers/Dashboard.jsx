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
const API_BASE = 'https://capstone-admin-task-hub.vercel.app/api';

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

  const fetchSubmissionsForClass = useCallback(async (classId, studentsInClassCount) => {
    if (!teacherId || !classId) {
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

  const handleClassChange = (e) => {
    const classId = e.target.value;
    const newSelectedClass = classes.find(c => c._id === classId) || null;
    setSelectedClass(newSelectedClass);
    if (newSelectedClass) {
      fetchSubmissionsForClass(newSelectedClass._id, newSelectedClass.students?.length || 0);
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
    <div className="min-h-screen relative">
      <FallingBooksAnimation />
      <div className="relative z-10 p-6 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-8 flex items-center gap-3">
            <FaBookOpen className="text-indigo-400" /> Teacher Dashboard
          </h1>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {classes.length > 0 ? (
              <div className="relative">
                <select
                  id="classSelector"
                  className="appearance-none w-full sm:w-auto bg-gray-800/70 border border-gray-600 text-gray-200 py-3 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  value={selectedClass?._id || ""}
                  onChange={handleClassChange}
                  disabled={loadingSubs}
                >
                  {classes.map(cls => <option key={cls._id} value={cls._id}>{cls.className}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300"><FaChevronDown size={16}/></div>
              </div>
            ) : (
              !loadingStats && <p className="text-gray-400">No classes found.</p>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Classes"
              value={stats.totalClasses}
              icon={<FaChalkboardTeacher size={28} className="opacity-75" />}
              bgColor="bg-blue-600"
            />
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={<FaUsers size={28} className="opacity-75" />}
              bgColor="bg-green-600"
            />
            <StatCard
              title="Submission Rate"
              value={loadingSubs ? <FaSpinner className="animate-spin text-3xl" /> : stats.submissionRate}
              unit={loadingSubs ? "" : "%"}
              icon={<FaChartLine size={28} className="opacity-75" />}
              bgColor="bg-purple-600"
            />
          </div>

          <section className="bg-gray-800/70 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-100 font-semibold flex items-center gap-2">
                <FaRegFileAlt className="text-indigo-400" />
                Recent Submissions {selectedClass ? `for ${selectedClass.className}` : ''}
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
      </div>
    </div>
  );
}