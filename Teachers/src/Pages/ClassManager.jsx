import React, { useState, useEffect } from "react";
import CreateActivityModal from "./CreateActivityModal"; // Your separate modal component
import AddClass from "./AddClass"; // Your separate add class component

const ClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showManageStudentsModal, setShowManageStudentsModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [activityForm, setActivityForm] = useState({
    title: "",
    instructions: "",
    deadline: "",
    classId: "",
    className: "",
    submissionGuidelines: {
      allowedFileTypes: "",
      maxFileSizeMB: "",
    },
  });

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/classes");
        if (!res.ok) throw new Error("Failed to fetch classes");
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        console.error("Failed to fetch classes", err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch students when Manage Students modal opens
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchStudents = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/students");
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error("Failed to fetch students", err);
      }
    };

    fetchStudents();
  }, [selectedClassId]);

  // Open activity modal
  const openNewActivityModal = (cls) => {
    setActivityForm({
      title: "",
      instructions: "",
      deadline: "",
      classId: cls._id,
      className: cls.className,
      submissionGuidelines: {
        allowedFileTypes: "",
        maxFileSizeMB: "",
      },
    });
    setShowActivityModal(true);
  };

  // Open manage students modal
  const openManageStudentsModal = (clsId) => {
    setSelectedClassId(clsId);
    setSelectedClass(classes.find((cls) => cls._id === clsId));
    setShowManageStudentsModal(true);
  };

  // Close activity modal
  const closeActivityModal = () => {
    setShowActivityModal(false);
  };

  // Handle create activity form submission
  const handleActivitySubmit = async (e) => {
    e.preventDefault();

    if (!activityForm.title || !activityForm.deadline || !activityForm.classId) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityForm),
      });
      if (!res.ok) throw new Error("Failed to create activity");

      alert("Activity created successfully!");
      closeActivityModal();
    } catch (err) {
      alert(err.message || "Error saving activity");
      console.error(err);
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
      alert("Please select at least one student to add.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/classes/${selectedClassId}/add-students`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: selectedStudentIds }),
        }
      );
      if (!res.ok) throw new Error("Failed to add students");

      alert("Students added successfully!");
      setSelectedStudentIds([]);

      // Refresh all classes
      const allClassesRes = await fetch("http://localhost:5000/api/classes");
      if (!allClassesRes.ok) throw new Error("Failed to refresh classes");
      const allClasses = await allClassesRes.json();
      setClasses(allClasses);

      // Update selectedClass with refreshed data
      const refreshedClass = allClasses.find((cls) => cls._id === selectedClassId);
      setSelectedClass(refreshedClass);
    } catch (err) {
      alert(err.message || "Error adding students");
      console.error(err);
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
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="grid grid-cols-5 items-center bg-white rounded-lg shadow-md px-6 py-4 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="text-black">{new Date(cls.time).toLocaleString()}</div> {/* Ensuring Start Date is black */}
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
  onClick={() => openManageStudentsModal(cls._id)}
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
      {showManageStudentsModal && selectedClassId && (
        <div className="fixed inset-0 bg-[#FFDAB9] bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl relative shadow-lg text-black">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl"
              onClick={() => setShowManageStudentsModal(false)}
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-6">
              Manage Students in {selectedClass?.className || ""}
            </h2>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search students"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="mb-4 px-3 py-2 border border-gray-300 rounded w-full"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto border border-gray-300 rounded p-4">
              {students
                .filter((student) =>
                  student.name.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map((student) => (
                  <div
                    key={student._id}
                    className="p-2 cursor-pointer bg-gray-100 rounded hover:bg-gray-200"
                    onClick={() => toggleStudentSelection(student._id)}
                  >
                    {student.name}
                    {selectedStudentIds.includes(student._id) && (
                      <span className="text-green-500 ml-2">✓</span>
                    )}
                  </div>
                ))}
            </div>

            <button
              onClick={handleAddStudentsToClass}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-6 py-2 rounded transition-all duration-300"
            >
              Add Selected Students
            </button>

            <h3 className="font-semibold mt-6">Current Students</h3>
            {selectedClass?.students?.length === 0 ? (
              <p>No students in this class.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {selectedClass.students.map((stu) => (
                  <li key={stu._id || stu.id}>{stu.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      <CreateActivityModal
        showModal={showActivityModal}
        closeModal={closeActivityModal}
        activityForm={activityForm}
        handleActivityFormChange={(field, value) =>
          setActivityForm((prev) => ({ ...prev, [field]: value }))
        }
        handleActivitySubmit={handleActivitySubmit}
      />
    </div>
  );
};

export default ClassManager;
