import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  FaChalkboardTeacher,
  FaUsers,
  FaChartLine,
  FaRegFileAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaBookOpen,
  FaUserGraduate,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";
import '../Css/Dashboard.css';

// Ensure API_BASE_URL ends with a slash
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, '') + '/';

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
        `${API_BASE_URL}activities/submissions/teacher/${teacherId}`,
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
      const res = await axios.get(`${API_BASE_URL}class`, { params: { teacherId } });
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

  const getSoonestClass = () => {
    const now = new Date();
    let soonest = null;
    let soonestDate = null;
    classes.forEach(cls => {
      if (Array.isArray(cls.schedule)) {
        cls.schedule.forEach(sch => {
          if (sch.date && sch.time) {
            const dt = new Date(`${sch.date}T${sch.time}`);
            if (dt > now && (!soonestDate || dt < soonestDate)) {
              soonestDate = dt;
              soonest = cls;
            }
          }
        });
      }
    });
    return soonest;
  };

  const getAllUniqueStudents = () => {
    const allStudents = classes.flatMap(c => c.students || []);
    const unique = {};
    allStudents.forEach(s => { if (s && s._id) unique[s._id] = s; });
    return Object.values(unique);
  };

  const getAllSubmissions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}activities/submissions/teacher/${teacherId}`
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
      const uniqueStudents = getAllUniqueStudents();
      const allSubs = await getAllSubmissions();
      setSubmissions(allSubs.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate)));
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
        await fetchSubmissionsForClass(newSelectedClass._id, newSelectedClass.students?.length || 0);
      }
    }
  };

  const StatCard = ({ title, value, icon, bgColor, unit = "" }) => (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
        <div className="text-blue-600 opacity-80">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}{unit}</p>
    </div>
  );

  if (loadingStats && !classes.length) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !classes.length) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex flex-col items-center justify-center text-center p-6">
        <FaExclamationTriangle className="text-5xl text-red-500 mb-4" />
        <p className="text-red-600 text-xl font-semibold mb-2">Error loading dashboard data</p>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="p-4 sm:p-6 lg:p-8 pt-16 md:pt-4 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <FaUserGraduate className="text-4xl" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {teacherName}!</h1>
              <p className="text-blue-100 text-sm sm:text-base">Here's your teaching overview for today</p>
            </div>
          </div>
        </div>

        {/* Class Selection */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label htmlFor="class-select" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaClipboardList className="text-blue-600" />
              Select Class:
            </label>
            <select
              id="class-select"
              className="flex-1 sm:flex-none bg-white border-2 border-blue-200 text-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={<FaChalkboardTeacher size={24} />}
            bgColor="border-blue-500"
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={<FaUsers size={24} />}
            bgColor="border-green-500"
          />
          <StatCard
            title="Submission Rate"
            value={loadingSubs ? <FaSpinner className="animate-spin text-2xl" /> : stats.submissionRate}
            unit={loadingSubs ? "" : "%"}
            icon={<FaChartLine size={24} />}
            bgColor="border-purple-500"
          />
          <StatCard
            title="Active Classes"
            value={classes.filter(c => c.students?.length > 0).length}
            icon={<FaBookOpen size={24} />}
            bgColor="border-orange-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Submissions - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FaRegFileAlt className="text-blue-600" />
                  Recent Submissions
                  {selectedClass && selectedClass._id !== "ALL_CLASSES" && (
                    <span className="text-sm font-normal text-gray-500">- {selectedClass.className}</span>
                  )}
                </h2>
                {loadingSubs && <FaSpinner className="animate-spin text-2xl text-blue-600" />}
              </div>

              {submissions.length === 0 && !loadingSubs ? (
                <div className="text-center py-12 text-gray-400">
                  <FaRegFileAlt size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No submissions found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {submissions.slice(0, 10).map((sub) => (
                    <div key={sub._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-grow">
                          <h3 className="text-base font-semibold text-blue-600 flex items-center gap-2 mb-1">
                            <FaBookOpen className="text-sm" /> {sub.activityId?.title || "Untitled Activity"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-gray-800">{sub.studentId?.name || "Unknown Student"}</span>
                            {" • "}
                            {new Date(sub.submissionDate).toLocaleDateString()}
                          </p>
                          {sub.activityId?.date && (
                            <p className={`text-xs mt-2 font-semibold flex items-center gap-1 ${new Date(sub.submissionDate) > new Date(sub.activityId.date) ? "text-red-500" : "text-green-500"}`}>
                              {new Date(sub.submissionDate) > new Date(sub.activityId.date) ? (
                                <>
                                  <FaTimesCircle /> Late Submission
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Ongoing Class Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-md p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FaClock /> Ongoing Class
              </h3>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                {(() => {
                  let cls = null;
                  if (selectedClass && selectedClass._id === "ALL_CLASSES") {
                    cls = getSoonestClass();
                    if (!cls) return <p className="text-center text-sm">No upcoming class</p>;
                  } else if (selectedClass) {
                    cls = selectedClass;
                  }
                  if (!cls) return <p className="text-center text-sm">No class selected</p>;
                  
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
                    <div className="text-center">
                      <p className="font-bold text-lg mb-2">{cls.className}</p>
                      {soonestSched ? (
                        <div className="text-sm space-y-1">
                          <p className="flex items-center justify-center gap-2">
                            <FaCalendarAlt /> {soonestSched.dt.toLocaleDateString()}
                          </p>
                          <p className="flex items-center justify-center gap-2">
                            <FaClock /> {soonestSched.dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm opacity-75">No upcoming schedule</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Enrolled Classes Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaClipboardList className="text-blue-600" /> Your Classes
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {classes.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No enrolled classes</p>
                ) : (
                  classes.map(cls => (
                    <div key={cls._id} className="bg-blue-50 rounded-lg p-3 border border-blue-100 hover:border-blue-300 transition-colors">
                      <p className="font-semibold text-gray-800 text-sm">{cls.className}</p>
                      <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <FaUsers className="text-blue-600" /> {cls.students?.length || 0} students
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}