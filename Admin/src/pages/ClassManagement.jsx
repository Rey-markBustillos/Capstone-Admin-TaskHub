import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newClass, setNewClass] = useState({
    teacherId: '',
    className: '',
    time: '',
    roomNumber: '',
    profilePic: '',
  });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Fetch classes, teachers, and students on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/classes')
      .then((response) => setClasses(response.data))
      .catch((error) => console.error('Error fetching classes:', error));

    axios.get('http://localhost:5000/api/users?role=teacher')
      .then((response) => setTeachers(response.data))
      .catch((error) => console.error('Error fetching teachers:', error));

    axios.get('http://localhost:5000/api/users?role=student')
      .then((response) => setStudents(response.data))
      .catch((error) => console.error('Error fetching students:', error));
  }, []);

  // Add new class
  const handleAddClass = () => {
    const payload = {
      teacherName: teachers.find(t => t._id === newClass.teacherId)?.name || '',
      className: newClass.className,
      time: newClass.time,
      roomNumber: newClass.roomNumber,
      profilePic: newClass.profilePic,
      students: [], // initially empty
      teacherId: newClass.teacherId,
    };
    axios.post('http://localhost:5000/api/classes', payload)
      .then((response) => {
        setClasses([...classes, response.data]);
        setShowAddClassModal(false);
        setNewClass({
          teacherId: '',
          className: '',
          time: '',
          roomNumber: '',
          profilePic: '',
        });
      })
      .catch((error) => {
        console.error('Error adding class:', error);
      });
  };

  // Delete class
  const handleDeleteClass = (id) => {
    axios.delete(`http://localhost:5000/api/classes/${id}`)
      .then(() => {
        setClasses(classes.filter((classItem) => classItem._id !== id));
      })
      .catch((error) => {
        console.error('Error deleting class:', error);
      });
  };

  // Open add student modal
  const openAddStudentModal = (classId) => {
    setSelectedClassId(classId);
    setSelectedStudentIds([]);
    setShowAddStudentModal(true);
  };

  // Add students to class
  const handleAddStudentsToClass = () => {
    axios.put(`http://localhost:5000/api/classes/${selectedClassId}/add-students`, {
      studentIds: selectedStudentIds,
    })
      .then((response) => {
        // Update the class in the list
        setClasses(classes.map(cls =>
          cls._id === selectedClassId ? response.data.class : cls
        ));
        setShowAddStudentModal(false);
      })
      .catch((error) => {
        console.error('Error adding students:', error);
      });
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Class Management</h1>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={() => setShowAddClassModal(true)}
      >
        Add Class
      </button>

      {/* View Classes Section */}
      <h2 className="text-xl font-medium text-gray-700 mt-6">Classes</h2>
      <ul className="mt-4 space-y-3">
        {classes.map((classItem) => (
          <li key={classItem._id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-100 p-4 rounded-md shadow-sm">
            <span className="text-gray-700 flex-1">
              <b>{classItem.className}</b> <br />
              Teacher: {classItem.teacherName} <br />
              Room: {classItem.roomNumber} <br />
              Time: {classItem.time ? new Date(classItem.time).toLocaleString() : ''}
              <br />
              Students: {classItem.students && classItem.students.length > 0
                ? classItem.students.map(s => s.name || s).join(', ')
                : 'None'}
            </span>
            <div className="flex flex-col gap-2 mt-2 md:mt-0 md:flex-row">
              <button
                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                onClick={() => openAddStudentModal(classItem._id)}
              >
                Add Students
              </button>
              <button
                className="text-red-500 hover:text-red-700 px-3 py-1 border border-red-500 rounded"
                onClick={() => handleDeleteClass(classItem._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-medium mb-4">Add New Class</h3>
            <label className="block mb-2">
              Class Name:
              <input
                type="text"
                value={newClass.className}
                onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            </label>
            <label className="block mb-2">
              Teacher:
              <select
                value={newClass.teacherId}
                onChange={(e) => setNewClass({ ...newClass, teacherId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block mb-2">
              Time:
              <input
                type="datetime-local"
                value={newClass.time}
                onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            </label>
            <label className="block mb-2">
              Room Number:
              <input
                type="text"
                value={newClass.roomNumber}
                onChange={(e) => setNewClass({ ...newClass, roomNumber: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            </label>
            <label className="block mb-4">
              Profile Picture URL:
              <input
                type="text"
                value={newClass.profilePic}
                onChange={(e) => setNewClass({ ...newClass, profilePic: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
            </label>
            <div className="flex justify-between">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                onClick={handleAddClass}
              >
                Add Class
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                onClick={() => setShowAddClassModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
            <h3 className="text-xl font-medium mb-4">Add Students to Class</h3>
            <div className="max-h-64 overflow-y-auto mb-4">
              {students.map((student) => (
                <div key={student._id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student._id)}
                    onChange={() => toggleStudentSelection(student._id)}
                    className="mr-2"
                  />
                  <span>{student.name} ({student.email})</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                onClick={handleAddStudentsToClass}
              >
                Add Selected Students
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                onClick={() => setShowAddStudentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
