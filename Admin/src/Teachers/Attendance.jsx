import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCalendarCheck, FaArrowLeft } from 'react-icons/fa';
import { useParams, NavLink } from 'react-router-dom';


const API_BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
const statusOptions = [
  { label: 'Present', icon: <FaCheckCircle className="text-green-400" /> },
  { label: 'Absent', icon: <FaTimesCircle className="text-red-400" /> },
  { label: 'Late', icon: <FaClock className="text-yellow-400" /> },
];


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
		const res = await axios.get(`${API_BASE_URL}/class/${classId}`);
		setStudents(res.data.students || []);
	} catch {
		setStudents([]);
	}
};
// Fetch attendance history
const fetchHistory = async () => {
try {
const res = await axios.get(`${API_BASE_URL}/attendance/class/${classId}`);
setHistory(res.data.history || []);
} catch {
setHistory([]);
}
};
if (classId) {
fetchStudents();
fetchHistory();
}
}, [classId]);



// Helper: Count Present, Late, and Absent for each student
const attendanceStats = {};
history.forEach(day => {
	day.records.forEach(rec => {
		if (!attendanceStats[rec.student._id]) {
			attendanceStats[rec.student._id] = { Present: 0, Late: 0, Absent: 0 };
		}
		if (rec.status === 'Present') attendanceStats[rec.student._id].Present++;
		if (rec.status === 'Late') attendanceStats[rec.student._id].Late++;
		if (rec.status === 'Absent') attendanceStats[rec.student._id].Absent++;
	});
});

const today = new Date().toISOString().slice(0, 10);

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
await axios.post(`${API_BASE_URL}/attendance/mark`, { records });
setMessage('Attendance marked successfully!');
} catch {
setMessage('Failed to mark attendance.');
} finally {
setSubmitting(false);
}
};

// ...existing code...
return (
	<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 p-4 sm:p-8">
		<div className="max-w-6xl mx-auto">
			<NavLink
				to={`/class/${classId}`}
				className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-6"
			>
				<FaArrowLeft /> Back to Class
			</NavLink>
			<div className="flex flex-col lg:flex-row gap-8">
				{/* Mark Attendance for Today */}
				<div className="flex-1 w-full max-w-full overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
					{/* ...existing Mark Attendance code... */}
					{(() => (
						<div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-8 border border-indigo-100 dark:border-gray-700 backdrop-blur-md mb-8 lg:mb-0">
							<h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
								<FaCalendarCheck /> Mark Attendance for Today ({today})
							</h2>
							<div className="overflow-x-auto">
								<div style={{ maxHeight: '340px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
									<table className="min-w-full text-left mb-6">
										<thead>
											<tr className="text-indigo-700 dark:text-indigo-200">
												<th className="py-2 px-4">Student</th>
												<th className="py-2 px-4">Status</th>
											</tr>
										</thead>
										<tbody>
											{students.map(student => {
												const stats = attendanceStats[student._id] || { Present: 0, Late: 0, Absent: 0 };
												return (
												<tr key={student._id} className="border-b border-indigo-100 dark:border-gray-700">
													<td className="py-2 px-4 font-semibold flex flex-col gap-1">
														<div className="flex items-center gap-2">
															{student.name}
															{stats.Absent >= 6 && (
															  <span className="ml-2 px-2 py-0.5 rounded bg-red-600 text-white text-xs font-bold animate-pulse">
																Warning: 6+ absences
															  </span>
															)}
														</div>
														<div className="flex gap-2 text-xs mt-1">
															<span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">Present: {stats.Present}</span>
															<span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-bold">Late: {stats.Late}</span>
															<span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">Absent: {stats.Absent}</span>
														</div>
													</td>
													<td className="py-2 px-4">
														<div className="flex gap-2">
															{statusOptions.map(opt => (
																<button
																	key={opt.label}
																	className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition border-2 ${attendance[student._id] === opt.label ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white/20 dark:bg-gray-800/40 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-gray-700 hover:bg-indigo-700/60 hover:text-white'}`}
																	onClick={() => handleMark(student._id, opt.label)}
																	type="button"
																>
																	{opt.icon} {opt.label}
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
							<button
								className="mt-4 px-6 py-2 rounded-lg bg-indigo-700 text-white font-bold shadow hover:bg-indigo-800 transition disabled:opacity-60"
								onClick={handleSubmit}
								disabled={submitting}
							>
								{submitting ? 'Saving...' : 'Save Attendance'}
							</button>
							{message && (
								<div className="mt-4 text-center font-semibold text-indigo-700 dark:text-indigo-300">{message}</div>
							)}
						</div>
					))()}
				</div>
				{/* Attendance History */}
				<div className="flex-1 w-full max-w-full overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
					{/* ...existing Attendance History code... */}
					{(() => (
						<div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl p-8 border border-indigo-100 dark:border-gray-700 backdrop-blur-md mt-8 lg:mt-0">
							<h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Attendance History</h3>
							<div className="overflow-x-auto scrollbar-hide">
								<table className="min-w-full text-left">
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
					))()}
				</div>
			</div>
		</div>
		</div>
	);
}

export default TeacherAttendance;


