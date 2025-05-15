import React, { useState, useEffect } from "react";
import AddClass from "./Addclass";

const ClassManager = () => {
  const [classes, setClasses] = useState([]); // Store classes
  const [students, setStudents] = useState([]); // Store students
  const [showClassModal, setShowClassModal] = useState(false); // For AddClass modal
  const [showStudentModal, setShowStudentModal] = useState(false); // For Add Student modal
  const [showTaskModal, setShowTaskModal] = useState(false); // For Add Task modal
  const [selectedClassId, setSelectedClassId] = useState(null); // Store selected class ID
  const [selectedStudentId, setSelectedStudentId] = useState(null); // Store selected student ID
  const [taskDescription, setTaskDescription] = useState(""); // Task description input
  const [taskFile, setTaskFile] = useState(null); // File to be uploaded
  const [taskDeadline, setTaskDeadline] = useState(""); // Deadline input
  const [taskPoints, setTaskPoints] = useState(""); // Points input
  const [startDateTime, setStartDateTime] = useState(""); // Start date and time input

  // Fetch classes and students
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/classes");
        const data = await response.json();
        setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/students");
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchClasses();
    fetchStudents();
  }, []);

  // Handle adding a new class
  const handleAddClass = async (newClass) => {
    try {
      const response = await fetch("http://localhost:5000/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClass),
      });

      if (!response.ok) {
        throw new Error("Failed to add class");
      }

      const savedClass = await response.json();
      setClasses((prev) => [...prev, savedClass]);
      setShowClassModal(false); // Close the modal
    } catch (error) {
      console.error("Error adding class:", error);
      alert("Failed to add class. Please try again.");
    }
  };

  // Handle deleting a class
  const handleDeleteClass = async (classId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this class?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete class");
      }

      setClasses((prev) => prev.filter((cls) => cls._id !== classId));
    } catch (error) {
      console.error("Error deleting class:", error.message);
      alert("Failed to delete class. Please try again.");
    }
  };

  // Handle adding a student to a class
  const handleAddStudentToClass = async () => {
    if (!selectedClassId || !selectedStudentId) return;

    try {
      const response = await fetch(`http://localhost:5000/api/classes/${selectedClassId}/add-student`, {
        method: "PUT",
        body: JSON.stringify({ studentId: selectedStudentId }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to add student to class");
      }

      alert("Student added successfully to the class!");
      setShowStudentModal(false); // Close the student modal after success
    } catch (error) {
      console.error("Error adding student to class:", error);
      alert("Failed to add student. Please try again.");
    }
  };

  // Handle adding a task to a class
  const handleAddTask = async () => {
    if (!taskDescription || !taskFile || !taskDeadline || !taskPoints || !selectedClassId) {
      alert("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("description", taskDescription);
    formData.append("file", taskFile);
    formData.append("deadline", taskDeadline);
    formData.append("points", taskPoints);

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${selectedClassId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to add task");
      }

      alert("Task added successfully!");
      setShowTaskModal(false); // Close task modal
      setTaskDescription(""); // Reset task description
      setTaskFile(null); // Reset file
      setTaskDeadline(""); // Reset deadline
      setTaskPoints(""); // Reset points
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-450 bg-[#FFDAB9] py-8">
      <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Class List</h1>
          <button
            onClick={() => setShowClassModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-md"
          >
            Add Class
          </button>
        </div>

        <div className="grid grid-cols-5 text-sm font-semibold bg-yellow-400 text-white px-6 py-3 rounded-lg mb-4 shadow-md">
          <span>Start Date</span>
          <span>Subject</span>
          <span>Room</span>
          <span>Teacher</span>
          <span>Action</span>
        </div>

        <div className="space-y-4">
          {classes.map((cls, index) => (
            <div
              key={cls._id || index}
              className="grid grid-cols-5 items-center bg-white rounded-lg shadow-md px-6 py-4 hover:bg-gray-50 transition-all duration-200"
            >
              <div>{new Date(cls.time).toLocaleString()}</div>
              <div className="font-medium text-gray-700">{cls.className}</div>
              <div className="font-medium text-gray-600">{cls.roomNumber}</div>
              <div className="flex items-center space-x-3">
                <img
                  src={cls.profilePic || "/default-avatar.png"}
                  alt="profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                />
                <span className="text-gray-600">{cls.teacherName}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedClassId(cls._id);
                    setShowStudentModal(true);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-5 py-2 rounded-md transition-all duration-300"
                >
                  Enter
                </button>
                <button
                  onClick={() => handleDeleteClass(cls._id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-md transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-[#FFDAB9] bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative shadow-lg">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl"
              onClick={() => setShowClassModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Add New Class</h2>
            <div className="mb-4">
              <label className="block text-gray-600 mb-2">Start Date and Time</label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <AddClass onAdd={handleAddClass} />
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-[#FFDAB9] bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative shadow-lg">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl"
              onClick={() => setShowStudentModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-black">Add Student to Class</h2>
            <select
              className="border border-gray-300 rounded-md p-2 w-full mb-4 text-black"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddStudentToClass}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              Add Student
            </button>

            <button
              onClick={() => setShowTaskModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg mt-4 transition-all duration-300"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#FFDAB9] bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative shadow-lg">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl"
              onClick={() => setShowTaskModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Assign Task to Class</h2>
            <div className="mb-4">
              <label className="block text-black mb-2">Task Description</label>
              <textarea
                className="border border-gray-300 rounded-md p-3 w-full mb-4 text-black"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Enter task description"
              />
            </div>
            <div className="mb-4">
              <label className="block text-black mb-2">Attach File</label>
              <input
                type="file"
                className="border border-gray-300 rounded-md p-2 w-full mb-4 text-black"
                onChange={(e) => setTaskFile(e.target.files[0])}
              />
            </div>
            <div className="mb-4">
              <label className="block text-black mb-2">Deadline</label>
              <input
                type="date"
                className="border border-gray-300 rounded-md p-2 w-full mb-4 text-black"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-black mb-2">Task Points</label>
              <input
                type="number"
                className="border border-gray-300 rounded-md p-2 w-full mb-4 text-black"
                placeholder="Enter task points"
                value={taskPoints}
                onChange={(e) => setTaskPoints(e.target.value)}
              />
            </div>
            <button
              onClick={handleAddTask}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
            >
              Add Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
