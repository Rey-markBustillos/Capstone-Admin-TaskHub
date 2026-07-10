import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarCheck, FaArrowLeft, FaFilter } from 'react-icons/fa';
import { useParams, NavLink } from 'react-router-dom';

const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return 'http://localhost:5000/api/';
  const cleanUrl = envUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${cleanUrl}/api/`;
})();

const statusOptions = [
  { label: 'Present', icon: <FaCheckCircle className="text-emerald-500" /> },
  { label: 'Absent', icon: <FaTimesCircle className="text-rose-500" /> },
  { label: 'Late', icon: <FaClock className="text-amber-500" /> },
];

const statusStyles = {
  Present: {
    summary: 'border border-emerald-200 bg-emerald-50 text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700',
    selected: 'border-emerald-500 bg-emerald-500 text-white shadow-sm',
    idle: 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50',
    row: 'bg-emerald-50/70',
    text: 'text-emerald-700',
    bar: 'bg-emerald-400',
  },
  Late: {
    summary: 'border border-amber-200 bg-amber-50 text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    selected: 'border-amber-500 bg-amber-500 text-white shadow-sm',
    idle: 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50',
    row: 'bg-amber-50/70',
    text: 'text-amber-700',
    bar: 'bg-amber-400',
  },
  Absent: {
    summary: 'border border-rose-200 bg-rose-50 text-rose-800',
    badge: 'bg-rose-100 text-rose-700',
    selected: 'border-rose-500 bg-rose-500 text-white shadow-sm',
    idle: 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50',
    row: 'bg-rose-50/70',
    text: 'text-rose-700',
    bar: 'bg-rose-400',
  },
};

const today = new Date().toISOString().slice(0, 10);

const formatDisplayDate = (dateValue) => {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TeacherAttendance = () => {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}class/${classId}`);
        setStudents(res.data.students || []);
      } catch {
        setStudents([]);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}attendance/class/${classId}`);
        setHistory(res.data.history || []);
      } catch (error) {
        console.error('Failed to fetch attendance history:', error);
        setHistory([]);
      }
    };

    const loadTodaysAttendance = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}attendance/class/${classId}`);
        const todaysRecord = res.data.history?.find((day) => day.date === today);
        if (todaysRecord?.records) {
          const todaysAttendance = {};
          todaysRecord.records.forEach((rec) => {
            todaysAttendance[rec.student._id] = rec.status;
          });
          setAttendance(todaysAttendance);
        }
      } catch (error) {
        console.error("Failed to load today's attendance:", error);
      }
    };

    if (classId) {
      fetchStudents();
      fetchHistory();
      loadTodaysAttendance();
    }
  }, [classId]);

  const attendanceStats = {};
  if (Array.isArray(history)) {
    history.forEach((day) => {
      if (day && Array.isArray(day.records)) {
        day.records.forEach((rec) => {
          if (rec?.student?._id && rec.status) {
            if (!attendanceStats[rec.student._id]) {
              attendanceStats[rec.student._id] = { Present: 0, Late: 0, Absent: 0 };
            }
            if (attendanceStats[rec.student._id][rec.status] !== undefined) {
              attendanceStats[rec.student._id][rec.status] += 1;
            }
          }
        });
      }
    });
  }

  const handleMark = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setMessage('');
    try {
      const records = students.map((student) => ({
        studentId: student._id,
        status: attendance[student._id] || 'Absent',
        date: today,
        classId,
      }));

      const response = await axios.post(`${API_BASE_URL}attendance/mark`, { records });
      setMessage(response.data.message || 'Attendance marked successfully!');

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

  const allRecords = history.flatMap((day) =>
    day.records.map((rec) => ({ ...rec, date: day.date }))
  );

  const totalPresent = allRecords.filter((record) => record.status === 'Present').length;
  const totalLate = allRecords.filter((record) => record.status === 'Late').length;
  const totalAbsent = allRecords.filter((record) => record.status === 'Absent').length;
  const totalRecords = allRecords.length;
  const filteredRecords = allRecords.filter((record) => (filter === 'All' ? true : record.status === filter));

  return (
    <div className="min-h-full bg-slate-50 py-8 px-2 sm:px-6 lg:px-8">
      <div className="w-full max-w-none mx-auto">
        <div className="mb-5 sm:mb-7 mt-2 sm:mt-4">
          <NavLink
            to={`/class/${classId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
          >
            <FaArrowLeft className="text-[10px] sm:text-xs" />
            <span className="hidden sm:inline">Back to Class</span>
            <span className="sm:hidden">Back</span>
          </NavLink>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white px-4 sm:px-6 py-5 sm:py-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Teacher Portal</p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Attendance</h1>
                <p className="mt-2 text-sm text-slate-500">A softer, cleaner layout for recording attendance and reviewing class history.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-700">Today</span>: {formatDisplayDate(today)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:gap-6">
          <div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 md:p-7 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                    <FaCalendarCheck className="text-slate-500" />
                    Mark Attendance
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Choose each student&apos;s status, then save the record for today.</p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600">
                  {students.length} students
                </div>
              </div>

              {Object.keys(attendance).length > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Attendance is already marked for today. Saving again will update today&apos;s records.
                </div>
              )}

              <div className="space-y-3 md:hidden">
                {students.map((student) => {
                  const stats = attendanceStats[student._id] || { Present: 0, Late: 0, Absent: 0 };

                  return (
                    <article key={student._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold text-slate-800">{student.name}</span>
                          {stats.Absent >= 6 && (
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                              6+ absences
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyles.Present.badge}`}>Present: {stats.Present}</span>
                          <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyles.Late.badge}`}>Late: {stats.Late}</span>
                          <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyles.Absent.badge}`}>Absent: {stats.Absent}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {statusOptions.map((option) => (
                            <button
                              key={option.label}
                              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-150 ${
                                attendance[student._id] === option.label
                                  ? statusStyles[option.label].selected
                                  : statusStyles[option.label].idle
                              }`}
                              onClick={() => handleMark(student._id, option.label)}
                              type="button"
                            >
                              {option.icon}
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                <table className="min-w-full bg-white">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const stats = attendanceStats[student._id] || { Present: 0, Late: 0, Absent: 0 };

                      return (
                        <tr key={student._id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/80">
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm sm:text-base text-slate-800">{student.name}</span>
                                {stats.Absent >= 6 && (
                                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                                    6+ absences
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyles.Present.badge}`}>Present: {stats.Present}</span>
                                <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyles.Late.badge}`}>Late: {stats.Late}</span>
                                <span className={`rounded-full px-2.5 py-1 font-medium ${statusStyles.Absent.badge}`}>Absent: {stats.Absent}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-5 py-3 sm:py-4">
                            <div className="flex flex-wrap gap-2">
                              {statusOptions.map((option) => (
                                <button
                                  key={option.label}
                                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-150 ${
                                    attendance[student._id] === option.label
                                      ? statusStyles[option.label].selected
                                      : statusStyles[option.label].idle
                                  }`}
                                  onClick={() => handleMark(student._id, option.label)}
                                  type="button"
                                >
                                  {option.icon}
                                  <span>{option.label}</span>
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  {Object.keys(attendance).length} marked out of {students.length}
                </div>
                <button
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 sm:px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-b-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Save Attendance
                    </>
                  )}
                </button>
              </div>

              {message && (
                <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${message.includes('Failed') ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 md:p-7 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                <FaCalendarCheck className="text-slate-500" />
                Attendance History
              </h2>
              <p className="mt-2 text-sm text-slate-500">Review totals and filter past records by status.</p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className={`rounded-2xl px-4 py-4 shadow-sm ${statusStyles.Present.summary}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FaCheckCircle />
                    Present
                  </div>
                  <div className="mt-2 text-2xl font-bold">{totalPresent}</div>
                </div>
                <div className={`rounded-2xl px-4 py-4 shadow-sm ${statusStyles.Late.summary}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FaClock />
                    Late
                  </div>
                  <div className="mt-2 text-2xl font-bold">{totalLate}</div>
                </div>
                <div className={`rounded-2xl px-4 py-4 shadow-sm ${statusStyles.Absent.summary}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <FaTimesCircle />
                    Absent
                  </div>
                  <div className="mt-2 text-2xl font-bold">{totalAbsent}</div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Overview</span>
                  <span className="text-xs text-slate-500">{totalRecords} total records</span>
                </div>
                <div className="flex h-28 items-end justify-center gap-5">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-20 items-end">
                      <div className={`w-10 rounded-t-2xl ${statusStyles.Present.bar}`} style={{ height: totalRecords ? `${(totalPresent / totalRecords) * 72 + 8}px` : '8px' }}></div>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Present</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-20 items-end">
                      <div className={`w-10 rounded-t-2xl ${statusStyles.Late.bar}`} style={{ height: totalRecords ? `${(totalLate / totalRecords) * 72 + 8}px` : '8px' }}></div>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Late</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-20 items-end">
                      <div className={`w-10 rounded-t-2xl ${statusStyles.Absent.bar}`} style={{ height: totalRecords ? `${(totalAbsent / totalRecords) * 72 + 8}px` : '8px' }}></div>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Absent</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <FaFilter className="text-sm text-slate-400" />
                <button onClick={() => setFilter('All')} className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${filter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>All</button>
                <button onClick={() => setFilter('Present')} className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${filter === 'Present' ? statusStyles.Present.selected : statusStyles.Present.badge}`}>Present</button>
                <button onClick={() => setFilter('Late')} className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${filter === 'Late' ? statusStyles.Late.selected : statusStyles.Late.badge}`}>Late</button>
                <button onClick={() => setFilter('Absent')} className={`rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${filter === 'Absent' ? statusStyles.Absent.selected : statusStyles.Absent.badge}`}>Absent</button>
              </div>

              <div className="mt-4 space-y-3 md:hidden">
                {filteredRecords.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    No attendance records found.
                  </div>
                ) : (
                  filteredRecords.map((record, idx) => (
                    <article key={`${record.student?._id || record.student?.name || 'student'}-${record.date}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{record.student.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDisplayDate(record.date)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[record.status]?.badge || 'bg-slate-100 text-slate-700'}`}>
                          {record.status}
                        </span>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
                <table className="min-w-full bg-white">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur">
                    <tr className="border-b border-slate-200">
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Student</th>
                      <th className="px-3 sm:px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-10 text-center text-sm text-slate-400">No attendance records found.</td>
                      </tr>
                    ) : (
                      filteredRecords.map((record, idx) => (
                        <tr key={idx} className={`border-b border-slate-100 ${statusStyles[record.status]?.row || 'bg-white'}`}>
                          <td className="px-3 sm:px-5 py-3 text-sm font-medium text-slate-700">{formatDisplayDate(record.date)}</td>
                          <td className="px-3 sm:px-5 py-3 text-sm font-medium text-slate-800">{record.student.name}</td>
                          <td className={`px-3 sm:px-5 py-3 text-sm font-semibold ${statusStyles[record.status]?.text || 'text-slate-700'}`}>{record.status}</td>
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

export default TeacherAttendance;
