import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClass, setNewClass] = useState({
    teacherName: '',
    className: '',
    time: '',
    roomNumber: '',
    profilePic: '',
  });

  // Fetch classes from API when component mounts
  useEffect(() => {
    axios
      .get('http://localhost:5000/api/classes') // Update with your API URL
      .then((response) => {
        setClasses(response.data);
      })
      .catch((error) => {
        console.error('Error fetching classes:', error);
      });
  }, []);

  // Function to handle adding a new class
  const handleAddClass = () => {
    axios
      .post('http://localhost:5000/api/classes', newClass) // API URL to add class
      .then((response) => {
        setClasses([...classes, response.data]); // Update state with the new class
        setShowAddClassModal(false);
        setNewClass({
          teacherName: '',
          className: '',
          time: '',
          roomNumber: '',
          profilePic: '',
        }); // Reset form
      })
      .catch((error) => {
        console.error('Error adding class:', error);
      });
  };

  // Function to handle deleting a class
  const handleDeleteClass = (id) => {
    axios
      .delete(`http://localhost:5000/api/classes/${id}`) // API URL to delete class
      .then(() => {
        setClasses(classes.filter((classItem) => classItem._id !== id)); // Use _id to filter classItem
      })
      .catch((error) => {
        console.error('Error deleting class:', error);
      });
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
          <li key={classItem._id} className="flex justify-between items-center bg-gray-100 p-4 rounded-md shadow-sm">
            <span className="text-gray-700">
              {classItem.className} - {classItem.teacherName} - {classItem.roomNumber} - {classItem.time}
            </span>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteClass(classItem._id)} // Use _id for deleting
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
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
              Teacher Name:
              <input
                type="text"
                value={newClass.teacherName}
                onChange={(e) => setNewClass({ ...newClass, teacherName: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md mt-1"
              />
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
    </div>
  );
};

export default ClassManagement;
