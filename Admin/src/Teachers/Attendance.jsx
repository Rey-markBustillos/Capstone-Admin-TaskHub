import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarCheck, FaArrowLeft, FaFilter } from 'react-icons/fa';
import { useParams, NavLink } from 'react-router-dom';
import SidebarContext from '../contexts/SidebarContext';

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

const today = new Date().toISOString().slice(0, 10);

const TeacherAttendance = () => {
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);
  const isLightMode = true; // Teachers always use light mode
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: status }
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]); // [{date, records: [{student, status}]}]
  const [filter, setFilter] = useState('All');

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

  // Get all unique records for history filtering
  const allRecords = history.flatMap(day => 
    day.records.map(rec => ({ ...rec, date: day.date }))
  );

  // Calculate stats across all history
  const totalPresent = allRecords.filter(r => r.status === 'Present').length;
  const totalLate = allRecords.filter(r => r.status === 'Late').length;
  const totalAbsent = allRecords.filter(r => r.status === 'Absent').length;
  const totalRecords = allRecords.length;

  return (
    <div className={`min-h-full ${isLightMode ? 'bg-white' : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900'} p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
      <div className="w-full max-w-none mx-auto px-1 sm:px-2 md:px-4 lg:px-8">
        <div className="mb-4 sm:mb-6 mt-2 sm:mt-4">
          <NavLink
            to={`/class/${classId}`}
            className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-5 py-1 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base rounded-lg ${isLightMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-700 hover:bg-indigo-800'} text-white font-semibold shadow transition mb-1 sm:mb-2 md:mb-4`}
          >
            <FaArrowLeft className="text-[10px] sm:text-xs md:text-sm" /> <span className="hidden sm:inline">Back to Class</span><span className="sm:hidden">Back</span>
          </NavLink>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Mark Attendance for Today */}
          <div className="flex-1">
            <div className={`${isLightMode ? 'bg-white/90 border-indigo-300' : 'bg-gray-900/80 border-indigo-800'} rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl p-2 sm:p-3 md:p-6 lg:p-8 border-2 sm:border-4 md:border-6 backdrop-blur-md`}>
              <h2 className={`text-sm sm:text-lg md:text-2xl font-bold ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} mb-2 sm:mb-3 md:mb-4 flex items-center gap-1 sm:gap-2`}>
                <FaCalendarCheck className="text-sm sm:text-base md:text-xl" /> Mark Attendance
              </h2>
              <p className={`text-xs sm:text-sm ${isLightMode ? 'text-indigo-600' : 'text-indigo-300'} mb-3`}>Today: {today}</p>
              {Object.keys(attendance).length > 0 && (
                <p className={`text-xs ${isLightMode ? 'text-amber-700 bg-amber-50' : 'text-amber-200 bg-amber-900/40'} p-2 rounded-lg mb-3`}>
                  📝 Attendance already marked for today - changes will update existing records
                </p>
              )}

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className={`min-w-full ${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md`}>
                  <thead className="sticky top-0 bg-gradient-to-r from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800">
                    <tr>
                      <th className={`px-2 sm:px-4 py-2 text-left ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} text-xs sm:text-sm md:text-base`}>Student</th>
                      <th className={`px-2 sm:px-4 py-2 text-left ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} text-xs sm:text-sm md:text-base`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const stats = attendanceStats[student._id] || { Present: 0, Late: 0, Absent: 0 };
                      return (
                        <tr key={student._id} className={`border-b ${isLightMode ? 'border-indigo-100 hover:bg-indigo-50' : 'border-indigo-900/50 hover:bg-indigo-900/30'}`}>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-col gap-1 sm:gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-xs sm:text-sm md:text-base ${isLightMode ? 'text-gray-800' : 'text-gray-100'}`}>{student.name}</span>
                                {stats.Absent >= 6 && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-xs font-bold animate-pulse">
                                    ⚠️ 6+
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1 text-xs">
                                <span className={`px-1.5 py-0.5 rounded ${isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-900/40 text-green-200'} font-medium`}>P:{stats.Present}</span>
                                <span className={`px-1.5 py-0.5 rounded ${isLightMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-900/40 text-yellow-200'} font-medium`}>L:{stats.Late}</span>
                                <span className={`px-1.5 py-0.5 rounded ${isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-900/40 text-red-200'} font-medium`}>A:{stats.Absent}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {statusOptions.map(opt => (
                                <button
                                  key={opt.label}
                                  className={`px-2 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1 transition-all duration-200 border-2 ${
                                    attendance[student._id] === opt.label 
                                      ? opt.label === 'Present' 
                                        ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                        : opt.label === 'Late'
                                        ? 'bg-yellow-600 text-white border-yellow-600 shadow-md'
                                        : 'bg-red-600 text-white border-red-600 shadow-md'
                                      : `${isLightMode ? 'bg-white border-indigo-300' : 'bg-gray-700 border-indigo-700'} ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} hover:shadow-sm`
                                  }`}
                                  onClick={() => handleMark(student._id, opt.label)}
                                  type="button"
                                >
                                  {opt.icon}
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

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 items-center">
                <button
                  className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg ${isLightMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-700 hover:bg-indigo-800'} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base`}
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
                  <p className={`text-xs sm:text-sm ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'}`}>
                    {students.length} students • {Object.keys(attendance).length} marked
                  </p>
                )}
              </div>
              {message && (
                <div className={`mt-4 text-center font-semibold text-sm ${message.includes('Failed') ? 'text-red-600' : isLightMode ? 'text-green-700' : 'text-green-300'}`}>{message}</div>
              )}
            </div>
          </div>

          {/* Attendance History with Stats */}
          <div className="flex-1">
            <div className={`${isLightMode ? 'bg-white/90 border-indigo-300' : 'bg-gray-900/80 border-indigo-800'} rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl p-2 sm:p-3 md:p-6 lg:p-8 border-2 sm:border-4 md:border-6 backdrop-blur-md`}>
              <h2 className={`text-sm sm:text-lg md:text-2xl font-bold ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} mb-2 sm:mb-3 md:mb-4 flex items-center gap-1 sm:gap-2`}>
                <FaCalendarCheck className="text-sm sm:text-base md:text-xl" /> Attendance History
              </h2>

              {/* Stats Summary */}
              <div className="mb-4 space-y-2">
                <div className={`flex items-center gap-2 ${isLightMode ? 'bg-green-100' : 'bg-green-900/40'} px-3 py-2 rounded-lg shadow`}>
                  <FaCheckCircle className="text-green-500 text-sm" />
                  <span className={`font-semibold ${isLightMode ? 'text-green-700' : 'text-green-200'} text-xs sm:text-sm`}>Total Present:</span>
                  <span className="font-bold text-sm sm:text-base">{totalPresent}</span>
                </div>
                <div className={`flex items-center gap-2 ${isLightMode ? 'bg-yellow-100' : 'bg-yellow-900/40'} px-3 py-2 rounded-lg shadow`}>
                  <FaClock className="text-yellow-500 text-sm" />
                  <span className={`font-semibold ${isLightMode ? 'text-yellow-700' : 'text-yellow-200'} text-xs sm:text-sm`}>Total Late:</span>
                  <span className="font-bold text-sm sm:text-base">{totalLate}</span>
                </div>
                <div className={`flex items-center gap-2 ${isLightMode ? 'bg-red-100' : 'bg-red-900/40'} px-3 py-2 rounded-lg shadow`}>
                  <FaTimesCircle className="text-red-500 text-sm" />
                  <span className={`font-semibold ${isLightMode ? 'text-red-700' : 'text-red-200'} text-xs sm:text-sm`}>Total Absent:</span>
                  <span className="font-bold text-sm sm:text-base">{totalAbsent}</span>
                </div>

                {/* Simple bar chart */}
                <div className="mt-3">
                  <div className="flex items-end justify-center gap-3 h-20">
                    <div className="flex flex-col items-center w-12">
                      <div className={`${isLightMode ? 'bg-green-400' : 'bg-green-600'} w-8 rounded-t-lg`} style={{height: totalRecords ? `${(totalPresent/totalRecords)*60 + 6}px` : '6px'}}></div>
                      <span className={`text-xs mt-1 ${isLightMode ? 'text-green-700' : 'text-green-200'}`}>Present</span>
                    </div>
                    <div className="flex flex-col items-center w-12">
                      <div className={`${isLightMode ? 'bg-yellow-400' : 'bg-yellow-600'} w-8 rounded-t-lg`} style={{height: totalRecords ? `${(totalLate/totalRecords)*60 + 6}px` : '6px'}}></div>
                      <span className={`text-xs mt-1 ${isLightMode ? 'text-yellow-700' : 'text-yellow-200'}`}>Late</span>
                    </div>
                    <div className="flex flex-col items-center w-12">
                      <div className={`${isLightMode ? 'bg-red-400' : 'bg-red-600'} w-8 rounded-t-lg`} style={{height: totalRecords ? `${(totalAbsent/totalRecords)*60 + 6}px` : '6px'}}></div>
                      <span className={`text-xs mt-1 ${isLightMode ? 'text-red-700' : 'text-red-200'}`}>Absent</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter */}
              <div className="mb-3 flex flex-wrap gap-2 items-center">
                <FaFilter className={`${isLightMode ? 'text-indigo-600' : 'text-indigo-400'} text-xs sm:text-sm`} />
                <button onClick={()=>setFilter('All')} className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold transition ${filter==='All'?'bg-indigo-600 text-white':`${isLightMode ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-900/40 text-indigo-200'}`}`}>All</button>
                <button onClick={()=>setFilter('Present')} className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold transition ${filter==='Present'?'bg-green-600 text-white':`${isLightMode ? 'bg-green-100 text-green-700' : 'bg-green-900/40 text-green-200'}`}`}>Present</button>
                <button onClick={()=>setFilter('Late')} className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold transition ${filter==='Late'?'bg-yellow-600 text-white':`${isLightMode ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-900/40 text-yellow-200'}`}`}>Late</button>
                <button onClick={()=>setFilter('Absent')} className={`px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold transition ${filter==='Absent'?'bg-red-600 text-white':`${isLightMode ? 'bg-red-100 text-red-700' : 'bg-red-900/40 text-red-200'}`}`}>Absent</button>
              </div>

              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className={`min-w-full ${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md`}>
                  <thead className="sticky top-0 bg-gradient-to-r from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800">
                    <tr>
                      <th className={`px-2 sm:px-4 py-2 text-left ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} text-xs sm:text-sm`}>Date</th>
                      <th className={`px-2 sm:px-4 py-2 text-left ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} text-xs sm:text-sm`}>Student</th>
                      <th className={`px-2 sm:px-4 py-2 text-left ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} text-xs sm:text-sm`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRecords.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={`text-center py-6 text-xs sm:text-sm ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>No attendance records found.</td>
                      </tr>
                    ) : (
                      allRecords
                        .filter(rec => filter === 'All' ? true : rec.status === filter)
                        .map((rec, idx) => (
                          <tr key={idx} className={`border-b ${
                            rec.status === 'Present' 
                              ? isLightMode ? 'bg-green-50' : 'bg-green-900/30'
                              : rec.status === 'Late'
                              ? isLightMode ? 'bg-yellow-50' : 'bg-yellow-900/30'
                              : isLightMode ? 'bg-red-50' : 'bg-red-900/30'
                          } ${isLightMode ? 'border-indigo-100' : 'border-indigo-900/50'}`}>
                            <td className={`px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm ${isLightMode ? 'text-gray-800' : 'text-gray-100'}`}>{rec.date}</td>
                            <td className={`px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm ${isLightMode ? 'text-gray-800' : 'text-gray-100'}`}>{rec.student.name}</td>
                            <td className={`px-2 sm:px-4 py-2 font-bold text-xs sm:text-sm ${
                              rec.status === 'Present' 
                                ? isLightMode ? 'text-green-600' : 'text-green-300'
                                : rec.status === 'Late'
                                ? isLightMode ? 'text-yellow-600' : 'text-yellow-300'
                                : isLightMode ? 'text-red-600' : 'text-red-300'
                            }`}>{rec.status}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherAttendance;