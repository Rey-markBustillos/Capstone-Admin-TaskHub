import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { FaCalendarCheck, FaPercent, FaArrowLeft, FaFilter, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { NavLink, useParams } from 'react-router-dom';
import SidebarContext from '../contexts/SidebarContext';
import { StudentThemeContext } from '../contexts/StudentThemeContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

const Attendance = () => {
  const { classId } = useParams();
  const { isSidebarOpen } = useContext(SidebarContext);
  const { isLightMode } = useContext(StudentThemeContext);
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const studentId = user?._id;

  const [attendance, setAttendance] = useState([]);
  // const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  // Attendance summary
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status === 'Absent').length;
  const lateCount = attendance.filter(a => a.status === 'Late').length;
  // For chart
  const total = attendance.length;

  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      // setLoading(true);
      // setError('');
      try {
        const res = await axios.get(`${API_BASE_URL}/attendance/student/${studentId}?classId=${classId}`);
        setAttendance(res.data.records || []);
      } catch {
        // setError('Failed to fetch attendance.');
      } finally {
        // setLoading(false);
      }
    };
    if (studentId && classId) fetchAttendance();
  }, [studentId, classId]);

  return (
    <div className={`min-h-screen ${isLightMode ? 'bg-white' : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900'} p-2 sm:p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 w-[calc(100%-144px)] sm:w-[calc(100%-176px)]' : 'ml-10 sm:ml-12 w-[calc(100%-40px)] sm:w-[calc(100%-48px)]'}`}>
  <div className="w-full max-w-none mx-auto flex flex-col justify-center items-center min-h-[80vh] px-1 sm:px-2 md:px-4 lg:px-8">
      <div className="mb-4 sm:mb-6 mt-2 sm:mt-4 ml-2 sm:ml-4 self-start">
        <NavLink
          to={`/student/class/${classId}`}
          className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-5 py-1 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base rounded-lg ${isLightMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-700 hover:bg-indigo-800'} text-white font-semibold shadow transition mb-1 sm:mb-2 md:mb-4`}
        >
          <FaArrowLeft className="text-[10px] sm:text-xs md:text-sm" /> <span className="hidden sm:inline">Back to Class Menu</span><span className="sm:hidden">Back</span>
        </NavLink>
      </div>
  <div className={`${isLightMode ? 'bg-white/90 border-indigo-300' : 'bg-gray-900/80 border-indigo-800'} rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl p-2 sm:p-3 md:p-6 lg:p-8 xl:p-12 border-2 sm:border-4 md:border-6 lg:border-8 backdrop-blur-md w-full max-w-none overflow-x-auto`}>
          <h2 className={`text-sm sm:text-lg md:text-2xl font-bold ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'} mb-2 sm:mb-3 md:mb-4 flex items-center gap-1 sm:gap-2`}>
            <FaCalendarCheck className="text-sm sm:text-base md:text-xl" /> Attendance History
          </h2>
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 w-full">
            {/* Attendance summary */}
            <div className="flex-1 min-w-[200px] sm:min-w-[220px] flex flex-col gap-3 sm:gap-4 justify-start">
              <div className="flex items-center gap-1 sm:gap-2 bg-green-100 dark:bg-green-900/40 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg shadow">
                <FaCheckCircle className="text-green-500 text-xs sm:text-sm md:text-base" />
                <span className="font-semibold text-green-700 dark:text-green-200 text-xs sm:text-sm md:text-base">Present:</span>
                <span className="font-bold text-sm sm:text-base md:text-lg">{presentCount}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-yellow-100 dark:bg-yellow-900/40 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg shadow">
                <FaClock className="text-yellow-500 text-xs sm:text-sm md:text-base" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-200 text-xs sm:text-sm md:text-base">Late:</span>
                <span className="font-bold text-sm sm:text-base md:text-lg">{lateCount}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 bg-red-100 dark:bg-red-900/40 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg shadow">
                <FaTimesCircle className="text-red-500 text-xs sm:text-sm md:text-base" />
                <span className="font-semibold text-red-700 dark:text-red-200 text-xs sm:text-sm md:text-base">Absent:</span>
                <span className="font-bold text-sm sm:text-base md:text-lg">{absentCount}</span>
              </div>
              {/* Simple bar chart */}
              <div className="mt-2 sm:mt-3 md:mt-4">
                <div className="flex items-end justify-center sm:justify-start gap-2 sm:gap-3 md:gap-4 h-16 sm:h-20 md:h-24">
                  <div className="flex flex-col items-center w-8 sm:w-12 md:w-16">
                    <div className="bg-green-400 dark:bg-green-600 w-4 sm:w-6 md:w-8 rounded-t-lg" style={{height: total ? `${(presentCount/total)*40 + 6}px` : '6px'}}></div>
                    <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-green-700 dark:text-green-200 text-center">Present</span>
                  </div>
                  <div className="flex flex-col items-center w-8 sm:w-12 md:w-16">
                    <div className="bg-yellow-400 dark:bg-yellow-600 w-4 sm:w-6 md:w-8 rounded-t-lg" style={{height: total ? `${(lateCount/total)*40 + 6}px` : '6px'}}></div>
                    <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-yellow-700 dark:text-yellow-200 text-center">Late</span>
                  </div>
                  <div className="flex flex-col items-center w-8 sm:w-12 md:w-16">
                    <div className="bg-red-400 dark:bg-red-600 w-4 sm:w-6 md:w-8 rounded-t-lg" style={{height: total ? `${(absentCount/total)*40 + 6}px` : '6px'}}></div>
                    <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-red-700 dark:text-red-200 text-center">Absent</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Attendance table */}
            <div className="flex-1 min-w-[240px] sm:min-w-[260px]">
              {/* Filter */}
              <div className="mb-2 sm:mb-3 md:mb-4 flex flex-wrap gap-1 sm:gap-2 items-center">
                <FaFilter className="text-indigo-400 text-xs sm:text-sm md:text-base" />
                <button onClick={()=>setFilter('All')} className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition ${filter==='All'?'bg-indigo-600 text-white':'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'}`}>All</button>
                <button onClick={()=>setFilter('Present')} className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition ${filter==='Present'?'bg-green-600 text-white':'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200'}`}>Present</button>
                <button onClick={()=>setFilter('Late')} className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition ${filter==='Late'?'bg-yellow-600 text-white':'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200'}`}>Late</button>
                <button onClick={()=>setFilter('Absent')} className={`px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs md:text-sm font-semibold transition ${filter==='Absent'?'bg-red-600 text-white':'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200'}`}>Absent</button>
              </div>
              <div className="overflow-x-auto">
                <table className={`min-w-full ${isLightMode ? 'bg-white' : 'bg-gray-800'} rounded-lg shadow-md`}>
                  <thead>
                    <tr>
                      <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm md:text-base">Date</th>
                      <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 text-left text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm md:text-base">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center text-gray-400 py-4 sm:py-6 md:py-8 text-xs sm:text-sm md:text-base">No attendance records found.</td>
                      </tr>
                    ) : (
                      attendance
                        .filter(rec => filter==='All' ? true : rec.status===filter)
                        .map((rec, idx) => (
                          <tr key={idx} className={rec.status === 'Present' ? 'bg-green-50 dark:bg-green-900/30' : rec.status==='Late' ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-red-50 dark:bg-red-900/30'}>
                            <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 font-medium text-gray-800 dark:text-gray-100 text-xs sm:text-sm md:text-base">{new Date(rec.date).toLocaleDateString()}</td>
                            <td className={
                              `px-1 sm:px-2 md:px-4 py-1 sm:py-2 font-bold text-xs sm:text-sm md:text-base ${rec.status === 'Present' ? 'text-green-600 dark:text-green-300' : rec.status==='Late' ? 'text-yellow-600 dark:text-yellow-300' : 'text-red-600 dark:text-red-300'}`
                            }>
                              {rec.status}
                            </td>
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
};

export default Attendance;
