import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://capstone-admin-task-hub-9c3u.vercel.app/api';

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
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [user, setUser] = useState(null);

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

  // Fetch user and classes based on role
  const fetchAllData = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    // Fetch classes for student or all for admin/teacher
    if (parsedUser && parsedUser.role === 'student') {
      axios.get(`${API_BASE_URL}/class/my-classes/${parsedUser._id}`)
        .then((response) => setClasses(response.data))
        .catch((error) => console.error('Error fetching classes:', error));
    } else {
      axios.get(`${API_BASE_URL}/class`)
        .then((response) => setClasses(response.data))
        .catch((error) => console.error('Error fetching classes:', error));
    }

    axios.get(`${API_BASE_URL}/users?role=teacher`)
      .then((response) => setTeachers(response.data))
      .catch((error) => console.error('Error fetching teachers:', error));

    axios.get(`${API_BASE_URL}/users?role=student`)
      .then((response) => setStudents(response.data))
      .catch((error) => console.error('Error fetching students:', error));
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

    axios.post(`${API_BASE_URL}/class`, payload)
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

    axios.put(`${API_BASE_URL}/class/${editClass._id}`, payload)
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
    axios.delete(`${API_BASE_URL}/class/${id}`)
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
    axios.put(`${API_BASE_URL}/class/${selectedClassId}/students`, {
      studentIds: selectedStudentIds,
    })
      .then((response) => {
        setClasses(classes.map(cls =>
          cls._id === selectedClassId ? response.data : cls
        ));
        setShowAddStudentModal(false);
      })
      .catch((error) => console.error('Error adding students:', error));
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

  return (
    <div className="max-w-6xl mx-auto p-6  min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Class Management</h1>
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

      <div className="mt-8 p-6 border-gray-600 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Existing Classes</h2>
        <ul className="space-y-4">
          {classes.map((classItem) => (
            <li key={classItem._id} className="border border-gray-600 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div className="flex-1 mb-4 md:mb-0">
                  <p className="text-xl font-bold text-indigo-700">{classItem.className}</p>
                  <p className="text-gray-600"><b>Teacher:</b> {classItem.teacher?.name || 'N/A'}</p>
                  <p className="text-gray-600"><b>Room:</b> {classItem.roomNumber || 'N/A'}</p>
                  <p className="text-gray-600"><b>Day:</b> {classItem.day || 'N/A'}</p>
                  <p className="text-gray-600"><b>Time:</b> {formatTimePH(classItem.time)}</p>
                  <p className="text-gray-600 mt-2">
                    <b>Students ({(classItem.students || []).length}):</b>
                    <span className="text-sm ml-2">
                      {(classItem.students || []).length > 0
                        ? classItem.students.map(s => s.name || s).join(', ')
                        : 'No students enrolled.'}
                    </span>
                  </p>
                </div>
                {/* Only show management buttons for admin/teacher */}
                {user && user.role !== 'student' && (
                  <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                      onClick={() => openAddStudentModal(classItem._id)}
                    >
                      Manage Students
                    </button>
                    <button
                      className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium"
                      onClick={() => openEditClassModal(classItem)}
                    >
                      Edit Class
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                      onClick={() => handleDeleteClass(classItem._id)}
                    >
                      Delete Class
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-10 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Class</h3>
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
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Class</h3>
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
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Manage Students</h3>
            <input
              id="studentSearch"
              name="studentSearch"
              type="text"
              placeholder="Search students by name or email..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-indigo-500"
              autoComplete="off"
            />
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4 space-y-3">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
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
                ))
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