import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarCheck, FaArrowLeft } from 'react-icons/fa';
import { useParams, NavLink } from 'react-router-dom';

// Handle API base URL properly
const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return "http://localhost:5000/api/";
  // Remove any trailing /api/ or / and add /api/
  const cleanUrl = envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const finalUrl = `${cleanUrl}/api/`;
  // Debug log to see the final URL
  console.log('API Base URL:', finalUrl);
  return finalUrl;
})();

const statusOptions = [
  { label: 'Present', icon: <FaCheckCircle className="text-green-400" /> },
  { label: 'Absent', icon: <FaTimesCircle className="text-red-400" /> },
  { label: 'Late', icon: <FaClock className="text-yellow-400" /> },
];

const today = new Date().toISOString().slice(0, 10); // <-- Dapat nasa taas ito!

const TeacherAttendance = () => {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: status }
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]); // [{date, records: [{student, status}]}]

  useEffect(() => {
    // Fetch enrolled students in class
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}class/${classId}`);
        setStudents(res.data.students || []);
      } catch {
        setStudents([]);
      }
    };
    // Fetch attendance history
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}attendance/class/${classId}`);
        setHistory(res.data.history || []);
      } catch (error) {
        console.error('Failed to fetch attendance history:', error);
        setHistory([]);
      }
    };
    // Load existing attendance for today
    const loadTodaysAttendance = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}attendance/class/${classId}`);
        const todaysRecord = res.data.history?.find(day => day.date === today);
        if (todaysRecord && todaysRecord.records) {
          const todaysAttendance = {};
          todaysRecord.records.forEach(rec => {
            todaysAttendance[rec.student._id] = rec.status;
          });
          setAttendance(todaysAttendance);
        }
      } catch (error) {
        console.error('Failed to load today\'s attendance:', error);
      }
    };
    if (classId) {
      fetchStudents();
      fetchHistory();
      loadTodaysAttendance();
    }
  }, [classId]);

  // Helper: Count Present, Late, and Absent for each student
  const attendanceStats = {};
  if (Array.isArray(history)) {
    history.forEach(day => {
      if (day && Array.isArray(day.records)) {
        day.records.forEach(rec => {
          if (rec && rec.student && rec.student._id && rec.status) {
            if (!attendanceStats[rec.student._id]) {
              attendanceStats[rec.student._id] = { Present: 0, Late: 0, Absent: 0 };
            }
            const status = rec.status;
            if (status === 'Present' || status === 'Late' || status === 'Absent') {
              attendanceStats[rec.student._id][status]++;
            }
          }
        });
      }
    });
  }

  const handleMark = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status: attendance[s._id] || 'Absent',
        date: today,
        classId,
      }));
      const response = await axios.post(`${API_BASE_URL}attendance/mark`, { records });
      setMessage(response.data.message || 'Attendance marked successfully!');
      // Don't clear the form - keep the marked attendance visible
      // Refresh history after successful submit
      try {
        const res = await axios.get(`${API_BASE_URL}attendance/class/${classId}`);
        setHistory(res.data.history || []);
      } catch (error) {
        console.error('Failed to refresh attendance history:', error);
      }
    } catch (error) {
      console.error('Failed to submit attendance:', error);
      setMessage(`Failed to mark attendance: ${error.response?.data?.message || error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <NavLink
          to={`/class/${classId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-6"
        >
          <FaArrowLeft /> Back to Class
        </NavLink>
        <div className="flex flex-col lg:flex-row gap-8 min-h-0 flex-1">
          {/* Mark Attendance for Today */}
          <div className="flex-1 w-full max-w-full overflow-hidden">
            <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-6 sm:p-8 border border-indigo-100 dark:border-gray-700 backdrop-blur-md mb-8 lg:mb-0 overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
              <div className="mb-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 mb-2">
                  <FaCalendarCheck className="flex-shrink-0" /> 
                  <span className="truncate">Mark Attendance</span>
                </h2>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">Today: {today}</p>
                {Object.keys(attendance).length > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    📝 Attendance already marked for today - changes will update existing records
                  </p>
                )}
              </div>
              <div className="flex-1 min-h-0">
                <div 
                  style={{ 
                    maxHeight: 'calc(100vh - 400px)',
                    minHeight: '300px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#6366f1 #e5e7eb'
                  }} 
                  className="border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <table className="w-full text-left mb-4">
                    <thead className="sticky top-0 bg-indigo-50 dark:bg-gray-800 z-10">
                      <tr className="text-indigo-700 dark:text-indigo-200">
                        <th className="py-3 px-2 sm:px-4 text-sm font-semibold">Student</th>
                        <th className="py-3 px-2 sm:px-4 text-sm font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => {
                        const stats = attendanceStats[student._id] || { Present: 0, Late: 0, Absent: 0 };
                        return (
                          <tr key={student._id} className="border-b border-indigo-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                                  <span className="truncate">{student.name}</span>
                                  {stats.Absent >= 6 && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-xs font-bold animate-pulse flex-shrink-0">
                                      ⚠️ 6+
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1 text-xs">
                                  <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">P:{stats.Present}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">L:{stats.Late}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">A:{stats.Absent}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                {statusOptions.map(opt => (
                                  <button
                                    key={opt.label}
                                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 transition-all duration-200 border-2 min-h-[36px] ${attendance[student._id] === opt.label ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white/90 dark:bg-gray-800/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-gray-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:border-indigo-400 hover:shadow-sm'}`}
                                    onClick={() => handleMark(student._id, opt.label)}
                                    type="button"
                                  >
                                    <span className="flex-shrink-0">{opt.icon}</span>
                                    <span className="hidden sm:inline">{opt.label}</span>
                                    <span className="sm:hidden">{opt.label.charAt(0)}</span>
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )})}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center">
                <button
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Save Attendance
                    </>
                  )}
                </button>
                {students.length > 0 && (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    {students.length} students • {Object.keys(attendance).length} marked
                  </p>
                )}
              </div>
              {message && (
                <div className="mt-4 text-center font-semibold text-indigo-700 dark:text-indigo-300">{message}</div>
              )}
            </div>
          </div>
          {/* Attendance History */}
          <div className="flex-1 w-full max-w-full overflow-hidden">
            <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-6 sm:p-8 border border-indigo-100 dark:border-gray-700 backdrop-blur-md mt-8 lg:mt-0 overflow-hidden flex flex-col max-h-[calc(100vh-200px)]">
              <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Attendance History ({history.length} days)</h3>
              {history.length === 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    No attendance records found. Mark attendance to see history.
                  </p>
                </div>
              )}
              <div className="flex-1 min-h-0">
                <div style={{
                  maxHeight: 'calc(100vh - 300px)',
                  overflowY: 'auto',
                  padding: '1rem',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#6366f1 #e5e7eb'
                }}>
                  <table className="min-w-full text-left border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="text-indigo-700 dark:text-indigo-200">
                        <th className="py-2 px-4">Date</th>
                        <th className="py-2 px-4">Student</th>
                        <th className="py-2 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-2 px-4 text-center text-gray-400">No attendance records yet.</td>
                        </tr>
                      )}
                      {history.map(day => (
                        day.records.map(rec => (
                          <tr key={day.date + rec.student._id} className="border-b border-indigo-100 dark:border-gray-700">
                            <td className="py-2 px-4">{day.date}</td>
                            <td className="py-2 px-4">{rec.student.name}</td>
                            <td className="py-2 px-4">{rec.status}</td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherAttendance;