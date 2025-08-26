import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCalendarCheck, FaPercent, FaArrowLeft, FaFilter, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { NavLink, useParams } from 'react-router-dom';

const API_BASE_URL = 'https://capstone-admin-task-hub.vercel.app/api';

const Attendance = () => {
  const { classId } = useParams();
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 sm:p-8">
  <div className="max-w-6xl w-full mx-auto flex flex-col justify-center items-center min-h-[80vh] px-2 sm:px-4 md:px-8">
      <div className="mb-6 mt-4 ml-4 self-start">
        <NavLink
          to={`/student/class/${classId}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-4"
        >
          <FaArrowLeft /> Back to Class Menu
        </NavLink>
      </div>
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-4 sm:p-8 md:p-12 lg:p-16 border-8 border-indigo-600 dark:border-indigo-800 backdrop-blur-md w-full max-w-full overflow-x-auto">
          <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
            <FaCalendarCheck /> Attendance History
          </h2>
          <div className="flex flex-col md:flex-row gap-8 w-full">
            {/* Attendance summary */}
            <div className="flex-1 min-w-[220px] flex flex-col gap-4 justify-start">
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-lg shadow">
                <FaCheckCircle className="text-green-500" />
                <span className="font-semibold text-green-700 dark:text-green-200">Present:</span>
                <span className="font-bold text-lg">{presentCount}</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/40 px-4 py-2 rounded-lg shadow">
                <FaClock className="text-yellow-500" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-200">Late:</span>
                <span className="font-bold text-lg">{lateCount}</span>
              </div>
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/40 px-4 py-2 rounded-lg shadow">
                <FaTimesCircle className="text-red-500" />
                <span className="font-semibold text-red-700 dark:text-red-200">Absent:</span>
                <span className="font-bold text-lg">{absentCount}</span>
              </div>
              {/* Simple bar chart */}
              <div className="mt-4">
                <div className="flex items-end gap-4 h-24">
                  <div className="flex flex-col items-center w-16">
                    <div className="bg-green-400 dark:bg-green-600 w-8 rounded-t-lg" style={{height: total ? `${(presentCount/total)*80}px` : '8px'}}></div>
                    <span className="text-xs mt-1 text-green-700 dark:text-green-200">Present</span>
                  </div>
                  <div className="flex flex-col items-center w-16">
                    <div className="bg-yellow-400 dark:bg-yellow-600 w-8 rounded-t-lg" style={{height: total ? `${(lateCount/total)*80}px` : '8px'}}></div>
                    <span className="text-xs mt-1 text-yellow-700 dark:text-yellow-200">Late</span>
                  </div>
                  <div className="flex flex-col items-center w-16">
                    <div className="bg-red-400 dark:bg-red-600 w-8 rounded-t-lg" style={{height: total ? `${(absentCount/total)*80}px` : '8px'}}></div>
                    <span className="text-xs mt-1 text-red-700 dark:text-red-200">Absent</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Attendance table */}
            <div className="flex-1 min-w-[260px]">
              {/* Filter */}
              <div className="mb-4 flex gap-2 items-center">
                <FaFilter className="text-indigo-400" />
                <button onClick={()=>setFilter('All')} className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${filter==='All'?'bg-indigo-600 text-white':'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'}`}>All</button>
                <button onClick={()=>setFilter('Present')} className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${filter==='Present'?'bg-green-600 text-white':'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200'}`}>Present</button>
                <button onClick={()=>setFilter('Late')} className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${filter==='Late'?'bg-yellow-600 text-white':'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200'}`}>Late</button>
                <button onClick={()=>setFilter('Absent')} className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${filter==='Absent'?'bg-red-600 text-white':'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200'}`}>Absent</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-indigo-700 dark:text-indigo-300">Date</th>
                      <th className="px-4 py-2 text-left text-indigo-700 dark:text-indigo-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center text-gray-400 py-8">No attendance records found.</td>
                      </tr>
                    ) : (
                      attendance
                        .filter(rec => filter==='All' ? true : rec.status===filter)
                        .map((rec, idx) => (
                          <tr key={idx} className={rec.status === 'Present' ? 'bg-green-50 dark:bg-green-900/30' : rec.status==='Late' ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-red-50 dark:bg-red-900/30'}>
                            <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">{new Date(rec.date).toLocaleDateString()}</td>
                            <td className={
                              `px-4 py-2 font-bold ${rec.status === 'Present' ? 'text-green-600 dark:text-green-300' : rec.status==='Late' ? 'text-yellow-600 dark:text-yellow-300' : 'text-red-600 dark:text-red-300'}`
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
