import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// TANGGALIN: Ang mga import para sa backend models ay hindi dapat nandito.
// import Class from '../models/Class';
// import User from '../models/User';
// import Announcement from '../models/Announcement';
// import mongoose from 'mongoose';

const API_BASE_URL = 'http://localhost:5000/api';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newClass, setNewClass] = useState({
    teacherId: '',
    className: '',
    time: '',
    roomNumber: '',
  });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [error, setError] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const fetchAllData = useCallback(() => {
    axios.get(`${API_BASE_URL}/class`)
      .then((response) => setClasses(response.data))
      .catch((error) => console.error('Error fetching classes:', error));

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
    if (!newClass.className || !newClass.teacherId) {
      setError('Class Name and Teacher are required.');
      return;
    }
    setError('');

    const payload = {
      className: newClass.className,
      teacher: newClass.teacherId,
      time: newClass.time,
      roomNumber: newClass.roomNumber,
    };

    axios.post(`${API_BASE_URL}/class`, payload)
      .then((response) => {
        setClasses(prevClasses => [response.data, ...prevClasses]);
        setShowAddClassModal(false);
        setNewClass({ teacherId: '', className: '', time: '', roomNumber: '' });
      })
      .catch((error) => {
        console.error('Error adding class:', error);
        const serverMessage = error.response?.data?.message || 'An error occurred while adding the class.';
        setError(serverMessage);
      });
  };

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
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Class Management</h1>
      <button
        className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
        onClick={() => {
          setShowAddClassModal(true);
          setError('');
        }}
      >
        Add New Class
      </button>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Existing Classes</h2>
        <ul className="space-y-4">
          {classes.map((classItem) => (
            <li key={classItem._id} className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start">
                <div className="flex-1 mb-4 md:mb-0">
                  <p className="text-xl font-bold text-indigo-700">{classItem.className}</p>
                  <p className="text-gray-600"><b>Teacher:</b> {classItem.teacher?.name || 'N/A'}</p>
                  <p className="text-gray-600"><b>Room:</b> {classItem.roomNumber || 'N/A'}</p>
                  <p className="text-gray-600"><b>Time:</b> {classItem.time ? new Date(classItem.time).toLocaleString() : 'N/A'}</p>
                  <p className="text-gray-600 mt-2">
                    <b>Students ({(classItem.students || []).length}):</b> 
                    <span className="text-sm ml-2">
                      {(classItem.students || []).length > 0
                        ? classItem.students.map(s => s.name || s).join(', ')
                        : 'No students enrolled.'}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
                  <button
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium"
                    onClick={() => openAddStudentModal(classItem._id)}
                  >
                    Manage Students
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                    onClick={() => handleDeleteClass(classItem._id)}
                  >
                    Delete Class
                  </button>
                </div>
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
              <label className="block">
                <span className="text-gray-700 font-medium">Class Name</span>
                <input
                  type="text"
                  value={newClass.className}
                  onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Introduction to React"
                />
              </label>
              <label className="block">
                <span className="text-gray-700 font-medium">Teacher</span>
                <select
                  value={newClass.teacherId}
                  onChange={(e) => setNewClass({ ...newClass, teacherId: e.target.value })}
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
              <label className="block">
                <span className="text-gray-700 font-medium">Time</span>
                <input
                  type="datetime-local"
                  value={newClass.time}
                  onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                />
              </label>
              <label className="block">
                <span className="text-gray-700 font-medium">Room Number</span>
                <input
                  type="text"
                  value={newClass.roomNumber}
                  onChange={(e) => setNewClass({ ...newClass, roomNumber: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Room 101"
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

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-10 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Manage Students</h3>
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-2 focus:ring-indigo-500"
            />
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4 space-y-3">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div key={student._id} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                    <input
                      type="checkbox"
                      id={`student-${student._id}`}
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