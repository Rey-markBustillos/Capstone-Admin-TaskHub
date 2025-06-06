import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import { FaChalkboardTeacher, FaUsers, FaChartLine, FaRegFileAlt, FaSpinner, FaExclamationTriangle, FaChevronDown } from "react-icons/fa";

const API_BASE = "http://localhost:5000";

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
  const role = user?.role || "teacher";

  const fetchClassesAndInitialStats = useCallback(async () => {
    if (!teacherId) return;
    setLoadingStats(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/api/classes`, {
        params: { teacherId },
      });
      if (res.status !== 200) throw new Error("Failed to fetch classes");
      const fetchedClasses = res.data || [];

      const studentIdsSet = new Set();
      fetchedClasses.forEach((c) => {
        (c.students || []).forEach((s) => studentIdsSet.add(s._id || s));
      });

      setClasses(fetchedClasses);
      const initialSelectedClass = fetchedClasses.length > 0 ? fetchedClasses[0] : null;
      setSelectedClass(initialSelectedClass);

      setStats(prevStats => ({
        ...prevStats,
        totalClasses: fetchedClasses.length,
        totalStudents: studentIdsSet.size,
      }));
      
      return initialSelectedClass;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load class data.");
      return null;
    } finally {
      setLoadingStats(false);
    }
  }, [teacherId]);

  const fetchSubmissionsForClass = useCallback(async (classId) => {
    if (!teacherId || !classId) {
      setSubmissions([]);
      setStats(prev => ({ ...prev, submissionRate: 0 }));
      return;
    }
    setLoadingSubs(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE}/api/activities/submissions/${teacherId}`,
        { params: { classId } }
      );
      if (res.status !== 200) throw new Error("Failed to fetch submissions");
      const submissionsData = res.data.submissions || [];
      setSubmissions(submissionsData);

      const currentClass = classes.find(c => c._id === classId);
      const studentsInClassCount = currentClass?.students?.length || 0;
      
      let submissionRate = 0;
      if (studentsInClassCount > 0 && submissionsData.length > 0) {
        const uniqueStudentSubmitters = new Set(
          submissionsData.map(sub => sub.studentId?._id || sub.studentId) 
        );
        submissionRate = Math.round((uniqueStudentSubmitters.size / studentsInClassCount) * 100);
      }
      
      setStats(prevStats => ({
        ...prevStats,
        submissionRate,
      }));

    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load submissions.");
      setSubmissions([]);
      setStats(prev => ({ ...prev, submissionRate: 0 }));
    } finally {
      setLoadingSubs(false);
    }
  }, [teacherId, classes]);


  useEffect(() => {
    async function loadInitialData() {
      const initialClass = await fetchClassesAndInitialStats();
      if (initialClass) {
        await fetchSubmissionsForClass(initialClass._id);
      }
    }
    loadInitialData();
  }, [fetchClassesAndInitialStats, fetchSubmissionsForClass]);

  useEffect(() => {
    if (selectedClass) {
      fetchSubmissionsForClass(selectedClass._id);
    }
  }, [selectedClass, fetchSubmissionsForClass]);


  const handleClassChange = (e) => {
    const classId = e.target.value;
    const newSelectedClass = classes.find(c => c._id === classId) || null;
    setSelectedClass(newSelectedClass);
  };
  
  // Changed the 'gradient' prop to 'bgColor' for clarity in this test
  const StatCard = ({ title, value, icon, bgColor, unit = "" }) => ( 
    <div className={`text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {icon}
      </div>
      <p className="text-4xl font-bold">{value}{unit}</p>
    </div>
  );

  if (loadingStats && !selectedClass) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <Sidebar role={role} onLogout={() => { localStorage.removeItem("user"); window.location.reload(); }} />
        <main className="flex-grow p-6 flex items-center justify-center min-w-0">
          <FaSpinner className="animate-spin text-5xl text-indigo-500 dark:text-indigo-400" />
        </main>
      </div>
    );
  }
  
  if (error && !selectedClass) {
     return (
      <div className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <Sidebar role={role} onLogout={() => { localStorage.removeItem("user"); window.location.reload(); }} />
        <main className="flex-grow p-6 flex flex-col items-center justify-center text-center min-w-0">
            <FaExclamationTriangle className="text-5xl text-red-500 dark:text-red-400 mb-4" />
            <p className="text-red-600 dark:text-red-400 text-xl font-semibold">Error loading dashboard data.</p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        role={role}
        onLogout={() => {
          localStorage.removeItem("user");
          window.location.reload();
        }}
      />

      <main className="flex-grow p-6 md:p-8 mr-60 overflow-auto min-w-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">
            Teacher Dashboard
          </h1>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {classes.length > 0 ? (
              <div className="relative">
                <label htmlFor="classSelector" className="sr-only">Select Class:</label>
                <select
                  id="classSelector"
                  className="appearance-none w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={selectedClass?._id || ""}
                  onChange={handleClassChange}
                  disabled={loadingSubs}
                >
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.className}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <FaChevronDown size={16}/>
                </div>
              </div>
            ) : (
              !loadingStats && <p className="text-gray-600 dark:text-gray-400">No classes found.</p>
            )}
            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Using simple bg-color classes for testing */}
            <StatCard title="Total Classes" value={stats.totalClasses} icon={<FaChalkboardTeacher size={28} className="opacity-75"/>} bgColor="bg-blue-500" />
            <StatCard title="Total Students" value={stats.totalStudents} icon={<FaUsers size={28} className="opacity-75"/>} bgColor="bg-green-500" />
            <StatCard title="Submission Rate" value={loadingSubs ? <FaSpinner className="animate-spin text-3xl"/> : stats.submissionRate} unit={loadingSubs ? "" : "%"} icon={<FaChartLine size={28} className="opacity-75"/>} bgColor="bg-purple-500" />
          </div>

          <section className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-800 dark:text-gray-100 font-semibold">
                Recent Submissions {selectedClass ? `for ${selectedClass.className}` : ''}
              </h2>
              {loadingSubs && <FaSpinner className="animate-spin text-2xl text-indigo-500 dark:text-indigo-400"/>}
            </div>

            {submissions.length === 0 && !loadingSubs ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <FaRegFileAlt size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No submissions found for this class.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {submissions.slice(0, 5).map((sub) => (
                  <li
                    key={sub._id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg hover:border-indigo-500 dark:hover:border-indigo-400"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div className="flex-grow">
                        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">
                          {sub.activityId?.title || sub.title || "Untitled Activity"}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          <span className="font-medium">{sub.studentId?.name || sub.createdBy?.name || "Unknown Student"}</span>
                          {" submitted on "}
                          {sub.submissionDate
                            ? new Date(sub.submissionDate).toLocaleDateString()
                            : sub.date
                            ? new Date(sub.date).toLocaleDateString()
                            : "N/A"}
                        </p>
                        {sub.activityId?.date && sub.submissionDate && (
                          <p className="text-xs mt-1">
                            Status:{" "}
                            <span
                              className={`font-semibold ${
                                new Date(sub.submissionDate) > new Date(sub.activityId.date)
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-green-500 dark:text-green-400"
                              }`}
                            >
                              {new Date(sub.submissionDate) > new Date(sub.activityId.date)
                                ? "Late"
                                : "On Time"}
                            </span>
                          </p>
                        )}
                      </div>
                      <button className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}