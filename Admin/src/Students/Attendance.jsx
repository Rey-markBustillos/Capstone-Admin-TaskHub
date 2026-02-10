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
    <div className={`min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 transition-all duration-300 pt-28 sm:pt-32 md:pt-36 w-full ${isSidebarOpen ? 'md:ml-36 lg:ml-44 md:w-[calc(100%-144px)] lg:w-[calc(100%-176px)]' : 'md:ml-10 lg:ml-12 md:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]'}`}>
      <div className="w-full h-full p-2 sm:p-3 md:p-4 lg:p-6">
        {/* Back Button */}
        <div className="mb-3 sm:mb-4 md:mb-6">
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 lg:p-8 border border-blue-200 w-full">
          <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-blue-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2">
            <FaCalendarCheck className="text-base sm:text-lg md:text-xl text-blue-600 flex-shrink-0" /> 
            <span>Attendance History</span>
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6 w-full">
            {/* Attendance summary */}
            <div className="w-full lg:w-96 flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-md border-l-4 border-green-400 hover:shadow-lg transition-shadow">
                <FaCheckCircle className="text-green-600 text-sm sm:text-base md:text-lg flex-shrink-0" />
                <span className="font-semibold text-green-700 text-xs sm:text-sm md:text-base">Present:</span>
                <span className="font-bold text-base sm:text-lg md:text-xl text-green-800 ml-auto">{presentCount}</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-yellow-100 px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-md border-l-4 border-yellow-400 hover:shadow-lg transition-shadow">
                <FaClock className="text-yellow-600 text-sm sm:text-base md:text-lg flex-shrink-0" />
                <span className="font-semibold text-yellow-700 text-xs sm:text-sm md:text-base">Late:</span>
                <span className="font-bold text-base sm:text-lg md:text-xl text-yellow-800 ml-auto">{lateCount}</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-red-100 px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-md border-l-4 border-red-400 hover:shadow-lg transition-shadow">
                <FaTimesCircle className="text-red-600 text-sm sm:text-base md:text-lg flex-shrink-0" />
                <span className="font-semibold text-red-700 text-xs sm:text-sm md:text-base">Absent:</span>
                <span className="font-bold text-base sm:text-lg md:text-xl text-red-800 ml-auto">{absentCount}</span>
              </div>
              {/* Simple bar chart */}
              <div className="mt-3 sm:mt-4">
                <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-2 sm:mb-3">Attendance Distribution</h3>
                <div className="flex items-end justify-around gap-2 sm:gap-3 h-20 sm:h-28 md:h-36 bg-gray-50 rounded-lg p-2 sm:p-3">
                  <div className="flex flex-col items-center flex-1">
                    <div className="bg-gradient-to-t from-green-400 to-green-500 w-full max-w-[50px] sm:max-w-[60px] rounded-t-lg shadow-md" style={{height: total ? `${(presentCount/total)*60 + 10}px` : '10px'}}></div>
                    <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-green-700 text-center font-semibold">Present</span>
                    <span className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{presentCount}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="bg-gradient-to-t from-yellow-400 to-yellow-500 w-full max-w-[50px] sm:max-w-[60px] rounded-t-lg shadow-md" style={{height: total ? `${(lateCount/total)*60 + 10}px` : '10px'}}></div>
                    <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-yellow-700 text-center font-semibold">Late</span>
                    <span className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{lateCount}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <div className="bg-gradient-to-t from-red-400 to-red-500 w-full max-w-[50px] sm:max-w-[60px] rounded-t-lg shadow-md" style={{height: total ? `${(absentCount/total)*60 + 10}px` : '10px'}}></div>
                    <span className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-red-700 text-center font-semibold">Absent</span>
                    <span className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{absentCount}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Attendance table */}
            <div className="w-full lg:flex-1">
              {/* Filter */}
              <div className="mb-3 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2 items-center">
                <FaFilter className="text-blue-600 text-sm sm:text-base" />
                <button onClick={()=>setFilter('All')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs md:text-sm font-bold transition shadow-sm hover:shadow-md min-h-[36px] ${filter==='All'?'bg-blue-600 text-white shadow-md':'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>All</button>
                <button onClick={()=>setFilter('Present')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs md:text-sm font-bold transition shadow-sm hover:shadow-md min-h-[36px] ${filter==='Present'?'bg-green-600 text-white shadow-md':'bg-green-50 text-green-700 hover:bg-green-100'}`}>Present</button>
                <button onClick={()=>setFilter('Late')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs md:text-sm font-bold transition shadow-sm hover:shadow-md min-h-[36px] ${filter==='Late'?'bg-yellow-600 text-white shadow-md':'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>Late</button>
                <button onClick={()=>setFilter('Absent')} className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs md:text-sm font-bold transition shadow-sm hover:shadow-md min-h-[36px] ${filter==='Absent'?'bg-red-600 text-white shadow-md':'bg-red-50 text-red-700 hover:bg-red-100'}`}>Absent</button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-blue-100 -mx-1 sm:mx-0">
                <table className="min-w-full bg-white">
                  <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <tr>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-blue-900 font-bold text-xs sm:text-sm md:text-base border-b-2 border-blue-200">Date</th>
                      <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-blue-900 font-bold text-xs sm:text-sm md:text-base border-b-2 border-blue-200">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center text-gray-500 py-6 sm:py-8 md:py-12 text-xs sm:text-sm md:text-base">No attendance records found.</td>
                      </tr>
                    ) : (
                      attendance
                        .filter(rec => filter==='All' ? true : rec.status===filter)
                        .map((rec, idx) => (
                          <tr key={idx} className={`border-b border-blue-50 hover:bg-blue-50 transition-colors ${rec.status === 'Present' ? 'bg-green-50/30' : rec.status==='Late' ? 'bg-yellow-50/30' : 'bg-red-50/30'}`}>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 font-medium text-gray-800 text-xs sm:text-sm md:text-base whitespace-nowrap">{new Date(rec.date).toLocaleDateString()}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm md:text-base">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-bold text-[10px] sm:text-xs md:text-sm ${
                                rec.status === 'Present' ? 'bg-green-100 text-green-700' : 
                                rec.status==='Late' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'
                              }`}>
                                {rec.status === 'Present' ? <FaCheckCircle className="text-[10px] sm:text-xs" /> : rec.status === 'Late' ? <FaClock className="text-[10px] sm:text-xs" /> : <FaTimesCircle className="text-[10px] sm:text-xs" />}
                                <span className="whitespace-nowrap">{rec.status}</span>
                              </span>
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
