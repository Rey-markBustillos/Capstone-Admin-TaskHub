// src/Pages/ClassManager.jsx
import React, { useState, useEffect } from "react";
import CreateActivityModal from "./CreateActivityModal"; // Your Create Activity Modal component
import AddClass from "./AddClass"; // Your Add Class component

const API_BASE = "http://localhost:5000"; // Your backend URL

const ClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false); // Added missing state
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showManageStudentsModal, setShowManageStudentsModal] = useState(false);

  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const [activityForm, setActivityForm] = useState({
    title: "",
    instructions: "",
    deadline: "",
    classId: "",
    className: "",
    points: 0,
    attachedFile: null,
  });

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/classes`);
        if (!res.ok) throw new Error("Failed to fetch classes");
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    };
    fetchClasses();
  }, []);

  // Open activity modal with prefilled class data
  const openNewActivityModal = (cls) => {
    setActivityForm({
      title: "",
      instructions: "",
      deadline: "",
      classId: cls._id,
      className: cls.className,
      points: 0,
      attachedFile: null,
    });
    setShowActivityModal(true);
  };

  // Close activity modal
  const closeActivityModal = () => {
    setShowActivityModal(false);
  };

  // Open manage students modal and fetch students list
  const openManageStudentsModal = async (cls) => {
    setSelectedClass(cls);
    setShowManageStudentsModal(true);
    setSelectedStudentIds([]);

    try {
      const res = await fetch(`${API_BASE}/api/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
      alert("Error loading students");
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Add selected students to class
  const handleAddStudentsToClass = async () => {
    if (selectedStudentIds.length === 0) {
      alert("Select at least one student to add.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/classes/${selectedClass._id}/add-students`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: selectedStudentIds }),
        }
      );
      if (!res.ok) throw new Error("Failed to add students to class");
      const updatedClass = await res.json();
      setSelectedClass(updatedClass.class);
      setClasses((prev) =>
        prev.map((c) => (c._id === updatedClass.class._id ? updatedClass.class : c))
      );
      setSelectedStudentIds([]);
      alert("Students added successfully!");
    } catch (err) {
      alert(err.message || "Error adding students");
      console.error(err);
    }
  };

  // Handle create activity form submission
  const handleActivitySubmit = async (e) => {
    e.preventDefault();

    if (!activityForm.title || !activityForm.deadline || !activityForm.classId) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("title", activityForm.title);
    formData.append("instructions", activityForm.instructions);
    formData.append("deadline", activityForm.deadline);
    formData.append("classId", activityForm.classId);
    formData.append("className", activityForm.className);
    formData.append("points", activityForm.points);
    if (activityForm.attachedFile) formData.append("attachedFile", activityForm.attachedFile);

    try {
      const res = await fetch(`${API_BASE}/api/activities`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create activity");

      alert("Activity created successfully!");
      closeActivityModal();
    } catch (err) {
      alert(err.message || "Error saving activity");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-430 ml-10 bg-[#FFDAB9] py-8">
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

        {/* Classes Table */}
        <div className="grid grid-cols-5 text-sm font-semibold bg-yellow-400 text-white px-6 py-3 rounded-lg mb-4 shadow-md">
          <span>Start Date</span>
          <span>Subject</span>
          <span>Room</span>
          <span>Teacher</span>
          <span>Action</span>
        </div>

        <div className="space-y-4">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="grid grid-cols-5 items-center bg-white rounded-lg shadow-md px-6 py-4 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="text-black">{new Date(cls.time).toLocaleString()}</div>
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
                  onClick={() => openManageStudentsModal(cls)}
                  className="!bg-green-600 hover:!bg-green-700 text-white font-semibold !px-2 !py-2 !text-sm rounded-md transition-all duration-300"
                >
                  Manage Students
                </button>

                <button
                  onClick={() => openNewActivityModal(cls)}
                  className="!bg-blue-600 hover:!bg-blue-700 text-white font-semibold !px-2 !py-2 !text-sm rounded-md transition-all duration-300"
                >
                  Create Activity
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
            <AddClass
              onAdd={(newClass) => {
                setClasses((prev) => [...prev, newClass]);
                setShowClassModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {showManageStudentsModal && selectedClass && (
        <div className="fixed inset-0 bg-[#FFDAB9] bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative shadow-lg text-black">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl"
              onClick={() => setShowManageStudentsModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-6">
              Manage Students in {selectedClass.className}
            </h2>

            <input
              type="text"
              placeholder="Search students"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="mb-4 px-3 py-2 border border-gray-300 rounded w-full"
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto border border-gray-300 rounded p-4 mb-4">
              {students
                .filter((s) =>
                  s.name.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map((student) => (
                  <div
                    key={student._id}
                    className={`p-2 cursor-pointer rounded ${
                      selectedStudentIds.includes(student._id)
                        ? "bg-green-200"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    onClick={() => toggleStudentSelection(student._id)}
                  >
                    {student.name}
                    {selectedStudentIds.includes(student._id) && (
                      <span className="text-green-600 ml-2 font-bold">✓</span>
                    )}
                  </div>
                ))}
            </div>

            <button
              onClick={handleAddStudentsToClass}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded transition-all duration-300"
            >
              Add Selected Students
            </button>

            <h3 className="font-semibold mt-6">Current Students</h3>
            {selectedClass.students.length === 0 ? (
              <p>No students in this class.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-auto">
                {selectedClass.students.map((stu) => (
                  <li key={stu._id}>{stu.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={showActivityModal}
        onClose={closeActivityModal}
        activityToEdit={null} // No activity is being edited, so it's null
        onSubmit={handleActivitySubmit} // Pass the handler to the modal
        activityForm={activityForm} // Pass the form state if needed
        setActivityForm={setActivityForm} // Pass the setter if needed
      />
    </div>
  );
};

export default ClassManager;
