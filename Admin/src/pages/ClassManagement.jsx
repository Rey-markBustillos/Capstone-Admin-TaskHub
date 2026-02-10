import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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
    endTime: '',
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [classToArchive, setClassToArchive] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedClasses, setArchivedClasses] = useState([]);
  // Handle Excel import for students with automatic enrollment
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if a class is selected first
    if (!selectedClassId) {
      setImportError('Please select a class first before importing students.');
      setTimeout(() => setImportError(''), 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      // Assume first row is header, look for required columns
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
      
      // Automatically enroll matched students
      const newIds = matched.map(s => s._id);
      handleAutoEnrollStudents(newIds, matched.length);
    };
    reader.readAsBinaryString(file);
  };

  // Auto-enroll imported students (preserving existing enrollments)
  const handleAutoEnrollStudents = (newStudentIds, count) => {
    if (!selectedClassId) {
      setImportError('Please select a class first.');
      setTimeout(() => setImportError(''), 3000);
      return;
    }
    
    // Get currently enrolled students in the selected class
    const selectedClass = classes.find(cls => cls._id === selectedClassId);
    const existingStudentIds = selectedClass?.students?.map(student => student._id) || [];
    
    // Filter out students who are already enrolled
    const studentsToAdd = newStudentIds.filter(id => !existingStudentIds.includes(id));
    
    if (studentsToAdd.length === 0) {
      setImportError('All students from the Excel file are already enrolled in this class.');
      setTimeout(() => setImportError(''), 3000);
      return;
    }
    
    // Combine existing and new student IDs
    const allStudentIds = [...existingStudentIds, ...studentsToAdd];
    
    axios.put(`${API_BASE_URL}/class/${selectedClassId}/students`, {
      studentIds: allStudentIds,
    })
      .then((response) => {
        setClasses(classes.map(cls =>
          cls._id === selectedClassId ? response.data : cls
        ));
        const alreadyEnrolled = count - studentsToAdd.length;
        let message = `${studentsToAdd.length} new student(s) enrolled successfully!`;
        if (alreadyEnrolled > 0) {
          message += ` (${alreadyEnrolled} were already enrolled)`;
        }
        setImportSuccess(message);
        setTimeout(() => setImportSuccess(''), 4000);
        // Reset the file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      })
      .catch((error) => {
        setImportError('Error enrolling students automatically.');
        setTimeout(() => setImportError(''), 3000);
        console.error('Error auto-enrolling students:', error);
      });
  };

  // Helper to format time as hh:mm AM/PM in PH time
  const formatTimePH = (startTimeStr, endTimeStr) => {
    if (!startTimeStr) return 'N/A';
    
    const formatSingleTime = (timeStr) => {
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
    
    const startTime = formatSingleTime(startTimeStr);
    if (!endTimeStr) return startTime;
    
    const endTime = formatSingleTime(endTimeStr);
    return `${startTime} - ${endTime}`;
  };

  const fetchAllData = useCallback(() => {
    setLoading(true);
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(parsedUser);

    // Prepare promises for all fetches
    let classPromise;
    if (parsedUser && parsedUser.role === 'student') {
      classPromise = axios.get(`${API_BASE_URL}/class/my-classes/${parsedUser._id}`);
    } else {
      classPromise = axios.get(`${API_BASE_URL}/class`);
    }

    Promise.all([
      classPromise,
      axios.get(`${API_BASE_URL}/users?role=teacher`),
      axios.get(`${API_BASE_URL}/users?role=student`)
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
      endTime: newClass.endTime,
      day: newClass.day,
      roomNumber: newClass.roomNumber,
    };

    axios.post(`${API_BASE_URL}/class`, payload)
      .then((response) => {
        setClasses(prevClasses => [response.data, ...prevClasses]);
        setShowAddClassModal(false);
        setNewClass({ teacher: '', className: '', time: '', endTime: '', day: '', roomNumber: '' });
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
      endTime: editClass.endTime,
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

  // Show delete confirmation modal
  const handleDeleteClass = (classItem) => {
    setClassToDelete(classItem);
    setShowDeleteModal(true);
  };

  // Actually delete the class after confirmation
  const confirmDeleteClass = () => {
    if (!classToDelete) return;
    
    axios.delete(`${API_BASE_URL}/class/${classToDelete._id}`)
      .then(() => {
        setClasses(classes.filter((classItem) => classItem._id !== classToDelete._id));
        setShowDeleteModal(false);
        setClassToDelete(null);
        setSuccess('Class deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch((error) => {
        console.error('Error deleting class:', error);
        setError('Failed to delete class. Please try again.');
        setTimeout(() => setError(''), 3000);
        setShowDeleteModal(false);
        setClassToDelete(null);
      });
  };

  // Show archive confirmation modal
  const handleArchiveClass = (classItem) => {
    setClassToArchive(classItem);
    setShowArchiveModal(true);
  };

  // Confirm archive class
  const confirmArchiveClass = () => {
    if (!classToArchive) return;
    
    axios.put(`${API_BASE_URL}/class/${classToArchive._id}/archive`)
      .then(() => {
        setClasses(classes.filter(cls => cls._id !== classToArchive._id));
        setSuccess('Class archived successfully! Students will no longer see this class.');
        setTimeout(() => setSuccess(''), 4000);
        setShowArchiveModal(false);
        setClassToArchive(null);
      })
      .catch((error) => {
        console.error('Error archiving class:', error);
        setError('Failed to archive class. Please try again.');
        setTimeout(() => setError(''), 3000);
        setShowArchiveModal(false);
        setClassToArchive(null);
      });
  };

  // Restore an archived class
  const handleRestoreClass = (classItem) => {
    axios.put(`${API_BASE_URL}/class/${classItem._id}/restore`)
      .then(() => {
        setArchivedClasses(archivedClasses.filter(cls => cls._id !== classItem._id));
        fetchAllData(); // Refresh active classes
        setSuccess('Class restored successfully!');
        setTimeout(() => setSuccess(''), 3000);
      })
      .catch((error) => {
        console.error('Error restoring class:', error);
        setError('Failed to restore class. Please try again.');
        setTimeout(() => setError(''), 3000);
      });
  };

  // Fetch archived classes
  const fetchArchivedClasses = () => {
    axios.get(`${API_BASE_URL}/class?archived=true`)
      .then((response) => {
        setArchivedClasses(response.data);
      })
      .catch((error) => {
        console.error('Error fetching archived classes:', error);
        setError('Failed to fetch archived classes.');
        setTimeout(() => setError(''), 3000);
      });
  };

  // Toggle between active and archived classes view
  const toggleArchivedView = () => {
    if (!showArchived) {
      fetchArchivedClasses();
    }
    setShowArchived(!showArchived);
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
      endTime: typeof classItem.endTime === "string"
        ? classItem.endTime
        : (classItem.endTime ? new Date(classItem.endTime).toISOString().slice(11, 16) : ''),
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
    <div className="max-w-6xl mx-auto p-6 pt-16 md:pt-6 min-h-screen overflow-y-auto">
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
        <div className="flex gap-3 flex-wrap">
          <button
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors"
            onClick={() => {
              setShowAddClassModal(true);
              setError('');
            }}
          >
            Add New Class
          </button>
          <button
            className={`px-5 py-2 rounded-lg shadow transition-colors ${
              showArchived 
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            onClick={toggleArchivedView}
          >
            {showArchived ? 'View Active Classes' : 'View Archived Classes'}
          </button>
        </div>
      )}

      <div className="mt-8 p-6 border-gray-300 bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg className={`w-7 h-7 ${showArchived ? 'text-orange-500' : 'text-indigo-500'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          {showArchived ? 'Archived Classes' : 'Active Classes'}
          <span className="text-lg font-normal text-gray-500">
            ({showArchived ? archivedClasses.length : classes.length})
          </span>
        </h2>
        <div className="max-h-[500px] overflow-y-scroll pr-2">
          {(showArchived ? archivedClasses : classes).length === 0 ? (
            <div className="text-center py-12">
              <svg className={`w-16 h-16 mx-auto mb-4 ${showArchived ? 'text-orange-300' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {showArchived ? 'No archived classes found' : 'No active classes found'}
              </h3>
              <p className="text-gray-400">
                {showArchived 
                  ? 'Classes that have been archived will appear here.' 
                  : 'Create your first class to get started.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-5">
              {(showArchived ? archivedClasses : classes).map((classItem) => (
              <li key={classItem._id} className={`border p-5 rounded-2xl shadow-md hover:shadow-xl transition-shadow flex flex-col md:flex-row justify-between items-start gap-4 ${
                showArchived 
                  ? 'border-orange-200 bg-orange-50/80' 
                  : 'border-gray-200 bg-white/80'
              }`}>
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
                      <b>Time:</b> {formatTimePH(classItem.time, classItem.endTime)}
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
                  {showArchived && classItem.archivedAt && (
                    <div className="text-orange-600 mt-2 text-sm font-medium">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l6 6M8 12l-3 3 3 3M15 12l3-3-3-3" />
                      </svg>
                      Archived on: {new Date(classItem.archivedAt).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
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
                    {!showArchived ? (
                      <>
                        <button
                          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm font-medium flex items-center gap-2"
                          onClick={() => handleArchiveClass(classItem)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8l6 6M8 12l-3 3 3 3M15 12l3-3-3-3" />
                          </svg>
                          Archive
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                          onClick={() => handleDeleteClass(classItem)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Delete Class
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2"
                          onClick={() => handleRestoreClass(classItem)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Restore
                        </button>
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2"
                          onClick={() => handleDeleteClass(classItem)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Delete Permanently
                        </button>
                      </>
                    )}
                  </div>
                )}
              </li>
              ))}
            </ul>
          )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block" htmlFor="time">
                  <span className="text-gray-700 font-medium">Start Time</span>
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
                <label className="block" htmlFor="endTime">
                  <span className="text-gray-700 font-medium">End Time</span>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={newClass.endTime}
                    onChange={(e) => setNewClass({ ...newClass, endTime: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                    autoComplete="off"
                  />
                </label>
              </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block" htmlFor="editTime">
                  <span className="text-gray-700 font-medium">Start Time</span>
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
                <label className="block" htmlFor="editEndTime">
                  <span className="text-gray-700 font-medium">End Time</span>
                  <input
                    id="editEndTime"
                    name="editEndTime"
                    type="time"
                    value={editClass.endTime}
                    onChange={(e) => setEditClass({ ...editClass, endTime: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1 focus:ring-2 focus:ring-indigo-500"
                    autoComplete="off"
                  />
                </label>
              </div>
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
                <span className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2 rounded transition-colors">Import & Auto-Enroll</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>
            <div className="bg-blue-50 text-blue-700 p-2 rounded mb-2 text-xs">
              💡 <strong>Tip:</strong> Import Excel with Name, Email, and LRN columns to automatically enroll students in the selected class.
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && classToDelete && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-red-500 relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 text-3xl shadow border-2 border-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <h3 className="text-2xl font-bold text-gray-800">Delete Class</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 text-lg mb-4">
                Are you sure you want to delete this class?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                <p className="font-semibold text-gray-800">{classToDelete.className}</p>
                <p className="text-sm text-gray-600">
                  Teacher: {classToDelete.teacher?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Students: {(classToDelete.students || []).length} enrolled
                </p>
              </div>
              <p className="text-red-600 text-sm mt-3 font-medium">
                ⚠️ This action cannot be undone. All associated data will be permanently deleted.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                onClick={() => {
                  setShowDeleteModal(false);
                  setClassToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                onClick={confirmDeleteClass}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && classToArchive && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border-t-8 border-yellow-500 relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 text-3xl shadow border-2 border-white">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 8.25l-3.75-3.75h2.25V12h3V15h2.25L12 18.75zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-2xl font-bold text-gray-800">Archive Class</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 text-lg mb-4">
                Are you sure you want to archive this class?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <p className="font-semibold text-gray-800">{classToArchive.className}</p>
                <p className="text-sm text-gray-600">
                  Teacher: {classToArchive.teacher?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Students: {(classToArchive.students || []).length} enrolled
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 mt-4">
                <p className="text-yellow-800 text-sm font-medium mb-2">
                  ⚠️ <strong>Important:</strong> When you archive this class:
                </p>
                <ul className="text-yellow-700 text-sm space-y-1 ml-4">
                  <li>• Students will no longer see this class</li>
                  <li>• All activities and content will be hidden</li>
                  <li>• The class can be restored later if needed</li>
                  <li>• No data will be permanently deleted</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                onClick={() => {
                  setShowArchiveModal(false);
                  setClassToArchive(null);
                }}
              >
                Cancel
              </button>
              <button
                className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition-colors font-medium flex items-center gap-2"
                onClick={confirmArchiveClass}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                Archive Class
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;