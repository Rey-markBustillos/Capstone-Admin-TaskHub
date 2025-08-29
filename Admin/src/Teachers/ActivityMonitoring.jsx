import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileArchive,
  FaDownload,
  FaChevronLeft,
  FaBookOpen,
  FaFileExport,
  FaMapMarkerAlt,
  FaClock,
  FaCalendarAlt,
  FaClipboardList,
  FaUsers,
  FaTasks,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import '../Css/ActivityMonitoring.css';

const API_BASE_URL = "https://capstone-admin-taskhub-1.onrender.com/api";

const FallingBooksAnimation = () => {
  const bookEmojis = ["📚", "📖", "📘", "📙", "📗"];
  const numberOfBooks = 7;

  return (
    <div className="falling-books-container">
      {Array.from({ length: numberOfBooks }, (_, index) => {
        const randomLeft = Math.random() * 100;
        const randomDuration = Math.random() * 5 + 5;
        const randomDelay = Math.random() * 2;
        const randomEmoji = bookEmojis[Math.floor(Math.random() * bookEmojis.length)];

        return (
          <div
            className="falling-book"
            key={`book-${index}`}
            style={{ left: `${randomLeft}vw`, animationDuration: `${randomDuration}s`, animationDelay: `${randomDelay}s` }}
          >
            {randomEmoji}
          </div>
        );
      })}
    </div>
  );
};

export default function ActivityMonitoring() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState("");

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?.role === "teacher" ? user._id : null;

  useEffect(() => {
    if (!teacherId) {
      setError("Teacher not logged in");
      return;
    }
    const fetchClasses = async () => {
      setLoading(true);
      try {
  const res = await axios.get(`${API_BASE_URL}/class?teacherId=${teacherId}`);
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch classes.");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [teacherId]);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchActivitiesAndSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
  const activitiesRes = await axios.get(`${API_BASE_URL}/activities?classId=${selectedClass._id}`);
        const classActivities = activitiesRes.data || [];

  const submissionsRes = await axios.get(`${API_BASE_URL}/activities/submissions/teacher/${teacherId}?classId=${selectedClass._id}`);
        const allSubmissions = submissionsRes.data.submissions.filter(sub => sub.studentId) || [];

        const activitiesWithSubmissions = classActivities.map(activity => {
          const relatedSubmissions = allSubmissions.filter(sub => {
            const submissionActivityId = sub.activityId?._id || sub.activityId;
            return submissionActivityId === activity._id;
          });
          return { ...activity, submissions: relatedSubmissions };
        });

        setActivities(activitiesWithSubmissions);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivitiesAndSubmissions();
  }, [selectedClass, teacherId]);

  const handleScoreChange = (activityId, submissionId, newScore) => {
    setActivities(prevActivities =>
      prevActivities.map(activity => {
        if (activity._id === activityId) {
          const updatedSubmissions = activity.submissions.map(sub =>
            sub._id === submissionId ? { ...sub, score: newScore } : sub
          );
          return { ...activity, submissions: updatedSubmissions };
        }
        return activity;
      })
    );
    if (selectedActivity?._id === activityId) {
        setSelectedActivity(prev => ({
            ...prev,
            submissions: prev.submissions.map(sub => sub._id === submissionId ? { ...sub, score: newScore } : sub)
        }));
    }
  };

  const handleSubmitScore = async (submissionId, score) => {
    try {
      const scoreNumber = Number(score);
      if (isNaN(scoreNumber)) {
        alert("Score must be a number");
        return;
      }
  await axios.put(`${API_BASE_URL}/activities/submissions/score/${submissionId}`, { score: scoreNumber });
      alert("Score updated successfully!");
    } catch (err) {
      alert(`Failed to update score: ${err.response?.data?.message || err.message}`);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile className="text-gray-500" />;
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return <FaFilePdf className="text-red-500" />;
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return <FaFileImage className="text-blue-500" />;
    if (lower.endsWith(".docx")) return <FaFileWord className="text-blue-600" />;
    if (lower.endsWith(".zip")) return <FaFileArchive className="text-yellow-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const filteredClasses = classes.filter(cls =>
    cls.className.toLowerCase().includes(classSearchTerm.toLowerCase())
  );

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setActivities([]);
    setSelectedActivity(null);
  };

  const handleBackToActivities = () => {
    setSelectedActivity(null);
    setSubmissionSearchTerm("");
  };

  // Export to Excel handler
  const handleExportExcel = async () => {
    if (!selectedClass) return;
    try {
  const res = await axios.get(`${API_BASE_URL}/activities/export-scores?classId=${selectedClass._id}`);
      const { exportData, activityTitles } = res.data;

      // Set column order: Name, Email, then all activity titles
      const columns = ["Name", "Email", ...activityTitles];
      const worksheet = XLSX.utils.json_to_sheet(exportData, { header: columns });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Scores");

      XLSX.writeFile(workbook, `Scores_${selectedClass.className}.xlsx`);
    } catch (err) {
      alert("Failed to export scores: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="app-container bg-white dark:bg-gray-800 min-h-screen">
      <FallingBooksAnimation />
      <div className="content p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
        {loading && <p className="text-center mt-6 text-lg font-semibold">Loading...</p>}
        {error && <p className="text-center mt-6 text-red-500 dark:text-red-400 text-lg">Error: {error}</p>}

        {!selectedClass && (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
              <FaClipboardList className="mr-2" /> Select a Class
            </h1>
            <input
              type="text"
              placeholder="Search class..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              value={classSearchTerm}
              onChange={(e) => setClassSearchTerm(e.target.value)}
            />
            {filteredClasses.length === 0 && !loading ? (
              <p className="text-center mt-6 text-lg">No classes found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                  <div key={cls._id} className="cursor-pointer p-0 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105 bg-white dark:bg-gray-800 flex flex-col" onClick={() => setSelectedClass(cls)}>
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center gap-2">
                      <FaBookOpen className="mr-2" />
                      <h3 className="text-xl font-bold text-white mb-1 truncate">{cls.className}</h3>
                      {cls.section && <p className="text-indigo-100 text-sm"><span className="opacity-75">Section:</span> {cls.section}</p>}
                    </div>
                    <div className="px-6 py-4 flex-grow space-y-1">
                      <p className="text-gray-700 dark:text-gray-300 flex items-center mb-1">
                        <FaMapMarkerAlt className="mr-2" /> Room: {cls.roomNumber || "N/A"}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 flex items-center mb-1">
                        <FaCalendarAlt className="mr-2" /> Day: {cls.day || "N/A"}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 flex items-center">
                        <FaClock className="mr-2" /> Time: {cls.time ? new Date(cls.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-center text-indigo-500 dark:text-indigo-400 font-medium flex items-center justify-center gap-1">
                        <FaTasks className="mr-1" /> Click to view activities
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {selectedClass && !selectedActivity && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
              <button className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition duration-300 ease-in-out flex items-center shadow-md hover:shadow-lg mb-2 sm:mb-0" onClick={handleBackToClasses}>
                <FaChevronLeft className="mr-2" /> Back to Classes
              </button>
              <button
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition duration-300 ease-in-out flex items-center shadow-md hover:shadow-lg"
                onClick={handleExportExcel}
              >
                <FaFileExport className="mr-2" /> Export Excel
              </button>
            </div>
            <h1 className="text-4xl font-bold mb-8 text-indigo-700 dark:text-indigo-300 text-center flex items-center justify-center gap-2">
              <FaTasks className="mr-2" />
              Activities for: <span className="text-purple-600 dark:text-purple-400">{selectedClass.className}</span>
            </h1>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <FaMapMarkerAlt className="mr-2" /> <span className="font-semibold">Room:</span>&nbsp;{selectedClass.roomNumber || "N/A"}
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <FaCalendarAlt className="mr-2" /> <span className="font-semibold">Day:</span>&nbsp;{selectedClass.day || "N/A"}
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <FaClock className="mr-2" /> <span className="font-semibold">Time:</span>&nbsp;{selectedClass.time ? new Date(selectedClass.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
              </div>
            </div>
            {activities.length === 0 && !loading ? (
              <div className="text-center py-10"><p className="text-xl text-gray-600 dark:text-gray-400">No activities found for this class.</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map(activity => (
                  <div key={activity._id} onClick={() => setSelectedActivity(activity)} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:scale-105 transform transition-all duration-300 flex flex-col">
                    <div className="p-5 flex-grow flex items-center gap-2">
                      <FaBookOpen className="text-indigo-500 mr-2" />
                      <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 truncate mb-2">{activity.title}</h2>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <FaUsers className="mr-1" /> Submissions
                        </div>
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 rounded-full h-8 w-8 flex items-center justify-center">
                            {activity.submissions.length}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

{selectedClass && selectedActivity && (
  <>
    <button className="mb-8 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition duration-300 ease-in-out flex items-center shadow-md hover:shadow-lg" onClick={handleBackToActivities}>
      <FaChevronLeft className="mr-2" /> Back to Activities
    </button>
    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 flex items-center gap-2">
        <FaBookOpen className="mr-2" />
        <h2 className="text-2xl font-bold">{selectedActivity.title}</h2>
        <p className="text-sm opacity-80 ml-4 flex items-center gap-1">
          <FaCalendarAlt className="mr-1" />
          Due: {selectedActivity.date ? new Date(selectedActivity.date).toLocaleDateString() : 'N/A'}
        </p>
      </div>
      <div className="p-4">
        <input
          type="text"
          placeholder="Search by student name..."
          className="w-full md:w-1/2 lg:w-1/3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
          value={submissionSearchTerm}
          onChange={(e) => setSubmissionSearchTerm(e.target.value)}
        />
        {selectedActivity.submissions.filter(sub => sub.studentId?.name.toLowerCase().includes(submissionSearchTerm.toLowerCase())).length === 0 ? (
          <p className="p-6 text-center text-gray-500 dark:text-gray-400">No submissions found for this activity.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-left">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Submitted By</th>
                  <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Date</th>
                  <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Attachment</th>
                  <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Score</th>
                  <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-300">
                {selectedActivity.submissions
                  .filter(sub => sub.studentId?.name.toLowerCase().includes(submissionSearchTerm.toLowerCase()))
                  .map((sub, index) => {
                    const fileTypeIcon = getFileIcon(sub.fileName);
                    // Use fileUrl from backend if available, else fallback to filePath
                    const fileUrl = sub.fileUrl || (sub.filePath ? `${API_BASE_URL}/${sub.filePath.replace(/\\/g, "/")}` : null);
                    const dueDate = selectedActivity.date ? new Date(selectedActivity.date) : null;
                    const submissionDate = sub.submissionDate ? new Date(sub.submissionDate) : null;
                    const statusText = submissionDate && dueDate ? (submissionDate > dueDate ? "Late" : "Submitted") : "Submitted";
                    const statusIcon = submissionDate && dueDate
                      ? (submissionDate > dueDate
                        ? <FaTimesCircle className="text-red-500 inline-block mr-1" />
                        : <FaCheckCircle className="text-green-500 inline-block mr-1" />)
                      : null;

                    return (
                      <tr key={sub._id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-all duration-200 ease-in-out ${index % 2 !== 0 ? 'bg-gray-50 dark:bg-gray-800/60' : ''}`}>
                        {/* Submitted By */}
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex flex-col items-center">
                            <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2 justify-center">
                              <FaUsers className="text-indigo-400" />
                              {sub.studentId?.name || "-"}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                              <FaClipboardList />
                              {sub.studentId?.email || "-"}
                            </span>
                          </div>
                        </td>
                        {/* Date */}
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex flex-col items-center">
                            <span className="flex items-center gap-2 justify-center">
                              <FaCalendarAlt className="text-indigo-400" />
                              {submissionDate ? new Date(submissionDate).toLocaleString() : "-"}
                            </span>
                          </div>
                        </td>
                        {/* Attachment */}
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex flex-col items-center">
                            {sub.fileName && fileUrl ? (
                              <>
                                <span className="mb-1 text-xs text-gray-500 dark:text-gray-400 break-all">{sub.fileName}</span>
                                {/* Preview for images */}
                                {/\.(jpg|jpeg|png|gif)$/i.test(sub.fileName) ? (
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mb-2"
                                  >
                                    <img
                                      src={fileUrl}
                                      alt={sub.fileName}
                                      style={{ maxWidth: 120, maxHeight: 80, borderRadius: 6, border: "1px solid #ddd" }}
                                    />
                                  </a>
                                ) : null}
                                {/* View Submission link */}
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-500/50 w-fit shadow-sm gap-2"
                                >
                                  <span className="text-lg">{fileTypeIcon}</span>
                                  <span className="text-sm font-medium">View Submission</span>
                                  <FaDownload />
                                </a>
                              </>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 italic flex items-center gap-1 justify-center">
                                <FaFile className="mr-1" /> No file
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Score */}
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex flex-col items-center">
                            <span className="flex items-center gap-2 justify-center">
                              <FaTasks className="text-indigo-400" />
                              <input
                                type="number"
                                value={sub.score || ""}
                                onChange={(e) => handleScoreChange(selectedActivity._id, sub._id, e.target.value)}
                                className="p-2 border rounded-md w-20 text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                placeholder="Score"
                              />
                            </span>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex flex-col items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 ${statusText === "Late" ? "bg-red-100 dark:bg-red-500/30 text-red-800 dark:text-red-200" : "bg-green-100 dark:bg-green-500/30 text-green-800 dark:text-green-200"}`}>
                              {statusIcon}
                              {statusText}
                            </span>
                          </div>
                        </td>
                        {/* Action */}
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => handleSubmitScore(sub._id, sub.score)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-md flex items-center gap-1"
                            >
                              <FaCheckCircle className="mr-1" />Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </>
)}  
      </div>
    </div>
  );
}