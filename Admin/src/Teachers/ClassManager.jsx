import React, { useState, useEffect } from "react";
import CreateActivityModal from "./CreateActivityModal";
import AddClass from "./Addclass";

const API_BASE = "http://localhost:5000/api";

const ClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
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
    fetch(`${API_BASE}/classes`)
      .then((res) => res.json())
      .then(setClasses)
      .catch(console.error);
  }, []);

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

  const closeActivityModal = () => {
    setShowActivityModal(false);
  };

  const openManageStudentsModal = (cls) => {
    setSelectedClass(cls);
    setShowManageStudentsModal(true);
    setSelectedStudentIds([]);

    fetch(`${API_BASE}/users?role=student`)
      .then((res) => res.json())
      .then(setStudents)
      .catch(() => alert("Failed to load students"));
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Add students to class by including studentId
  const handleAddStudentsToClass = () => {
    if (selectedStudentIds.length === 0) {
      alert("Select at least one student");
      return;
    }

    // Here, we make sure to send the selected studentIds when adding them to the class
    fetch(`${API_BASE}/classes/${selectedClass._id}/add-students`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: selectedStudentIds }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add students");
        return res.json();
      })
      .then((data) => {
        setSelectedClass(data.class);
        setClasses((prev) =>
          prev.map((c) => (c._id === data.class._id ? data.class : c))
        );
        setSelectedStudentIds([]);
        alert("Students added successfully!");
      })
      .catch((err) => alert(err.message));
  };

  // Handle creating an activity for the class
  const handleActivitySubmit = (e) => {
    e.preventDefault();
    if (!activityForm.title || !activityForm.deadline || !activityForm.classId) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    for (const key in activityForm) {
      if (activityForm[key]) formData.append(key, activityForm[key]);
    }

    fetch(`${API_BASE}/activities`, {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create activity");
        alert("Activity created!");
        closeActivityModal();
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Class List</h1>
        <button
          onClick={() => setShowClassModal(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-3 rounded-lg"
        >
          Add Class
        </button>
      </div>

      <div className="grid grid-cols-5 bg-yellow-400 text-white px-6 py-3 rounded-lg mb-4 font-semibold text-sm">
        <span>Start Date</span>
        <span>Subject</span>
        <span>Room</span>
        <span>Teacher</span>
        <span>Actions</span>
      </div>

      <div className="space-y-4">
        {classes.map((cls) => (
          <div
            key={cls._id}
            className="grid grid-cols-5 items-center bg-white rounded-lg shadow-md px-6 py-4 hover:bg-gray-50 cursor-pointer"
          >
            <div>{new Date(cls.time).toLocaleString()}</div>
            <div>{cls.className}</div>
            <div>{cls.roomNumber}</div>
            <div>{cls.teacherName}</div>
            <div className="flex space-x-2">
              <button
                className="bg-green-600 text-white px-2 py-1 rounded"
                onClick={() => openManageStudentsModal(cls)}
              >
                Manage Students
              </button>
              <button
                className="bg-blue-600 text-white px-2 py-1 rounded"
                onClick={() => openNewActivityModal(cls)}
              >
                Create Activity
              </button>
            </div>
          </div>
        ))}
      </div>

      {showManageStudentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full overflow-auto max-h-[80vh]">
            <button
              className="text-red-600 float-right text-xl font-bold"
              onClick={() => setShowManageStudentsModal(false)}
            >
              &times;
            </button>
            <h2 className="mb-4 font-semibold text-lg">
              Manage Students in {selectedClass.className}
            </h2>

            <input
              type="text"
              placeholder="Search students..."
              className="border p-2 mb-4 w-full"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto mb-4 border p-2 rounded">
              {students
                .filter((s) =>
                  s.name.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map((student) => (
                  <div
                    key={student._id}
                    onClick={() => toggleStudentSelection(student._id)}
                    className={`p-2 cursor-pointer rounded ${
                      selectedStudentIds.includes(student._id)
                        ? "bg-green-200"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {student.name}
                    {selectedStudentIds.includes(student._id) && (
                      <span className="ml-2 text-green-600 font-bold">✓</span>
                    )}
                  </div>
                ))}
            </div>

            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
              onClick={handleAddStudentsToClass}
            >
              Add Selected Students
            </button>

            <h3 className="mt-6 font-semibold">Current Students</h3>
            <ul className="list-disc pl-5 max-h-40 overflow-auto">
              {selectedClass.students.map((stu) => (
                <li key={stu._id}>{stu.name}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showActivityModal && (
        <CreateActivityModal
          isOpen={showActivityModal}
          onClose={closeActivityModal}
          activityToEdit={null}
          onSubmit={handleActivitySubmit}
          activityForm={activityForm}
          setActivityForm={setActivityForm}
        />
      )}

      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <button
              className="text-red-600 float-right text-xl font-bold"
              onClick={() => setShowClassModal(false)}
            >
              &times;
            </button>
            <h2 className="mb-4 font-semibold text-lg">Add New Class</h2>
            <AddClass
              onAdd={(newClass) => {
                setClasses((prev) => [...prev, newClass]);
                setShowClassModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
