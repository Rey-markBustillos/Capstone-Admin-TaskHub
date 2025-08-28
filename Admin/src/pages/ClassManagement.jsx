import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE = 'https://capstone-admin-taskhub-1.onrender.com/api';

const daysOfWeek = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newClass, setNewClass] = useState({
    teacher: '',
    className: '',
    time: '',
    day: '',
    roomNumber: '',
  });
  const [editClass, setEditClass] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  // Handle Excel import for students
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      // Assume first row is header, look for 'email' column
      const header = data[0].map(h => h.toLowerCase());
      const emailIdx = header.indexOf('email');
      if (emailIdx === -1) {
        setImportError('Excel must have an Email column.');
        setTimeout(() => setImportError(''), 3000);
        return;
      }
      const emails = data.slice(1).map(row => row[emailIdx]).filter(Boolean);
      // Find matching students by email
      const matched = students.filter(s => emails.includes(s.email));
      if (matched.length === 0) {
        setImportError('No matching student accounts found.');
        setTimeout(() => setImportError(''), 3000);
        return;
      }
      // Add only matched student IDs
      const newIds = matched.map(s => s._id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...newIds])));
      setImportSuccess(`${matched.length} student(s) matched and selected.`);
      setTimeout(() => setImportSuccess(''), 3000);
    };
    reader.readAsBinaryString(file);
  };

  // Helper to format time as hh:mm AM/PM in PH time
  const formatTimePH = (timeStr) => {
    if (!timeStr) return 'N/A';
    const [hour, minute] = timeStr.split(':');
    if (isNaN(Number(hour)) || isNaN(Number(minute))) return timeStr;
    const date = new Date(`1970-01-01T${hour}:${minute}:00`);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    });
  };

  const fetchAllData = useCallback(() => {
    setLoading(true);
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    // Prepare promises for all fetches
    let classPromise;
    if (parsedUser && parsedUser.role === 'student') {
      classPromise = axios.get(`${API_BASE}/class/my-classes/${parsedUser._id}`);
    } else {
      classPromise = axios.get(`${API_BASE}/class`);
    }

    Promise.all([
      classPromise,
      axios.get(`${API_BASE}/users?role=teacher`),
      axios.get(`${API_BASE}/users?role=student`)
    ])
      .then(([classRes, teacherRes, studentRes]) => {
        setClasses(classRes.data);
        setTeachers(teacherRes.data);
        setStudents(studentRes.data);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      })
      .finally(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddClass = () => {
    if (!newClass.className || !newClass.teacher || !newClass.day) {
      setError('Class Name, Teacher, and Day are required.');
      return;
    }
    setError('');

    const payload = {
      className: newClass.className,
      teacher: newClass.teacher,
      time: newClass.time,
      day: newClass.day,
      roomNumber: newClass.roomNumber,
    };

    axios.post(`${API_BASE}/class`, payload)
      .then((response) => {
        setClasses(prevClasses => [response.data, ...prevClasses]);
        setShowAddClassModal(false);
        setNewClass({ teacher: '', className: '', time: '', day: '', roomNumber: '' });
      })
      .catch((error) => {
        console.error('Error adding class:', error);
        const serverMessage = error.response?.data?.message || 'An error occurred while adding the class.';
        setError(serverMessage);
      });
  };

  const handleEditClass = () => {
    if (!editClass.className || !editClass.teacher || !editClass.day) {
      setError('Class Name, Teacher, and Day are required.');
      return;
    }
    setError('');

    const payload = {
      className: editClass.className,
      teacher: editClass.teacher,
      time: editClass.time,
      day: editClass.day,
      roomNumber: editClass.roomNumber,
    };

    axios.put(`${API_BASE}/class/${editClass._id}`, payload)
      .then((response) => {
        setClasses(classes.map(cls =>
          cls._id === editClass._id ? response.data : cls
        ));
        setShowEditClassModal(false);
        setEditClass(null);
      })
      .catch((error) => {
        console.error('Error editing class:', error);
        const serverMessage = error.response?.data?.message || 'An error occurred while editing the class.';
        setError(serverMessage);
      });
  };

  // Delete class and cascade delete activities and submissions
  const handleDeleteClass = (id) => {
    axios.delete(`${API_BASE}/class/${id}`)
      .then(() => {
        setClasses(classes.filter((classItem) => classItem._id !== id));
      })
      .catch((error) => console.error('Error deleting class:', error));
  };

  const openAddStudentModal = (classId) => {
    setSelectedClassId(classId);
    const currentClass = classes.find(c => c._id === classId);
    const enrolledStudentIds = currentClass ? (currentClass.students || []).map(s => s._id || s) : [];
    setSelectedStudentIds(enrolledStudentIds);
    setStudentSearchTerm('');
    setShowAddStudentModal(true);
  };

  const openEditClassModal = (classItem) => {
    setEditClass({
      ...classItem,
      teacher: classItem.teacher?._id || classItem.teacher,
      time: typeof classItem.time === "string"
        ? classItem.time
        : (classItem.time ? new Date(classItem.time).toISOString().slice(11, 16) : ''),
      day: classItem.day || '',
      roomNumber: classItem.roomNumber || '',
    });
    setError('');
    setShowEditClassModal(true);
  };

  const handleAddStudentsToClass = () => {
    axios.put(`${API_BASE}/class/${selectedClassId}/students`, {
      studentIds: selectedStudentIds,
    })
      .then((response) => {
        setClasses(classes.map(cls =>
          cls._id === selectedClassId ? response.data : cls
        ));
        setShowAddStudentModal(false);
        setSuccess('Students successfully enrolled in the class.');
        setTimeout(() => setSuccess(''), 2500);
      })
      .catch((error) => {
        setError('Error adding students.');
        setTimeout(() => setError(''), 2500);
        console.error('Error adding students:', error);
      });
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <svg className="animate-spin h-10 w-10 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span className="text-indigo-700 text-lg font-semibold">Loading Class Management...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6  min-h-screen">
      {success && <div className="bg-green-100 text-green-800 p-3 rounded mb-4 text-center font-semibold">{success}</div>}
      {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4 text-center font-semibold">{error}</div>}
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        Class Management
      </h1>
      {/* Only show Add Class button for admin/teacher */}
      {user && user.role !== 'student' && (
        <button
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
          onClick={() => {
            setShowAddClassModal(true);
            setError('');
          }}
        >
          Add New Class
        </button>
      )}

      <div className="mt-8 p-6 border-gray-300 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          Existing Classes
        </h2>
        <div className="max-h-[500px] overflow-y-scroll pr-2">
          <ul className="space-y-5">
            {classes.map((classItem) => (
              <li key={classItem._id} className="border border-gray-200 bg-white/80 p-5 rounded-2xl shadow-md hover:shadow-xl transition-shadow flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </span>
                    <span className="text-lg font-bold text-indigo-700">{classItem.className}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-2">
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <b>Teacher:</b> {classItem.teacher?.name || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <rect x="3" y="7" width="18" height="13" rx="2" />
                        <path d="M16 3v4M8 3v4" />
                      </svg>
                      <b>Room:</b> {classItem.roomNumber || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      <b>Day:</b> {classItem.day || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      <b>Time:</b> {formatTimePH(classItem.time)}
                    </span>
                  </div>
                  <div className="text-gray-600 mt-2 text-sm">
                    <b>Students ({(classItem.students || []).length}):</b>
                    <span className="ml-2">
                      {(classItem.students || []).length > 0
                        ? classItem.students.map(s => s.name || s).join(', ')
                        : 'No students enrolled.'}
                    </span>
                  </div>
                </div>
                {/* Only show management buttons for admin/teacher */}
                {user && user.role !== 'student' && (
                  <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2"
                      onClick={() => openAddStudentModal(classItem._id)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Enroll Students
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center gap-2"
                      onClick={() => openEditClassModal(classItem)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
                      </svg>
                      Edit Class
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                      onClick={() => handleDeleteClass(classItem._id)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Delete Class
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>  

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-10 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-indigo-500 relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 text-3xl shadow border-2 border-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <h3 className="text-2xl font-bold text-gray-800">Add New Class</h3>
            </div>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
            <div className="space-y-4">
              <label className="block" htmlFor="className">
                <span className="text-gray-700 font-medium">Class Name</span>
                <input
                  id="className"
                  name="className"
                  type="text"
                  value={newClass.className}
                  onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Introduction to React"
                  autoComplete="off"
                />
              </label>
              <label className="block" htmlFor="teacher">
                <span className="text-gray-700 font-medium">Teacher</span>
                <select
                  id="teacher"
                  name="teacher"
                  value={newClass.teacher}
                  onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block" htmlFor="day">
                <span className="text-gray-700 font-medium">Day</span>
                <select
                  id="day"
                  name="day"
                  value={newClass.day}
                  onChange={(e) => setNewClass({ ...newClass, day: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a Day</option>
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="block" htmlFor="time">
                <span className="text-gray-700 font-medium">Time</span>
                <input
                  id="time"
                  name="time"
                  type="time"
                  value={newClass.time}
                  onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  autoComplete="off"
                />
              </label>
              <label className="block" htmlFor="roomNumber">
                <span className="text-gray-700 font-medium">Room Number</span>
                <input
                  id="roomNumber"
                  name="roomNumber"
                  type="text"
                  value={newClass.roomNumber}
                  onChange={(e) => setNewClass({ ...newClass, roomNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Room 101"
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => setShowAddClassModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                onClick={handleAddClass}
              >
                Add Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && editClass && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-10 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-yellow-500 relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 text-3xl shadow border-2 border-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <h3 className="text-2xl font-bold text-gray-800">Edit Class</h3>
            </div>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-sm">{error}</p>}
            <div className="space-y-4">
              <label className="block" htmlFor="editClassName">
                <span className="text-gray-700 font-medium">Class Name</span>
                <input
                  id="editClassName"
                  name="editClassName"
                  type="text"
                  value={editClass.className}
                  onChange={(e) => setEditClass({ ...editClass, className: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Introduction to React"
                  autoComplete="off"
                />
              </label>
              <label className="block" htmlFor="editTeacher">
                <span className="text-gray-700 font-medium">Teacher</span>
                <select
                  id="editTeacher"
                  name="editTeacher"
                  value={editClass.teacher}
                  onChange={(e) => setEditClass({ ...editClass, teacher: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block" htmlFor="editDay">
                <span className="text-gray-700 font-medium">Day</span>
                <select
                  id="editDay"
                  name="editDay"
                  value={editClass.day}
                  onChange={(e) => setEditClass({ ...editClass, day: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a Day</option>
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="block" htmlFor="editTime">
                <span className="text-gray-700 font-medium">Time</span>
                <input
                  id="editTime"
                  name="editTime"
                  type="time"
                  value={editClass.time}
                  onChange={(e) => setEditClass({ ...editClass, time: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  autoComplete="off"
                />
              </label>
              <label className="block" htmlFor="editRoomNumber">
                <span className="text-gray-700 font-medium">Room Number</span>
                <input
                  id="editRoomNumber"
                  name="editRoomNumber"
                  type="text"
                  value={editClass.roomNumber}
                  onChange={(e) => setEditClass({ ...editClass, roomNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Room 101"
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => setShowEditClassModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                onClick={handleEditClass}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-10 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Enrolled Students</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <input
                id="studentSearch"
                name="studentSearch"
                type="text"
                placeholder="Search students by name or email..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="w-full sm:w-64 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                autoComplete="off"
              />
              <label className="inline-block cursor-pointer">
                <span className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2 rounded transition-colors">Import Excel</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>
            {importError && <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">{importError}</div>}
            {importSuccess && <div className="bg-green-100 text-green-700 p-2 rounded mb-2 text-sm">{importSuccess}</div>}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4 space-y-3">
              {filteredStudents.length > 0 ? (
                <div className="max-h-72 overflow-y-auto pr-2">
                  {filteredStudents.map((student) => (
                    <div key={student._id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                      <input
                        id={`student-${student._id}`}
                        name={`student-${student._id}`}
                        type="checkbox"
                        checked={selectedStudentIds.includes(student._id)}
                        onChange={() => toggleStudentSelection(student._id)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor={`student-${student._id}`} className="ml-3 text-gray-700">
                        {student.name} <span className="text-sm text-gray-500">({student.email})</span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No students found.</p>
              )}
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => setShowAddStudentModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                onClick={handleAddStudentsToClass}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;