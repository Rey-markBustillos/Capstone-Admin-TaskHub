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
  FaSpinner,
  FaSearch,
} from "react-icons/fa";

// Ensure API_BASE_URL ends with a slash
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, '') + '/';

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
        const res = await axios.get(`${API_BASE_URL}class`, { params: { teacherId } });
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load classes");
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
        const activitiesRes = await axios.get(`${API_BASE_URL}activities`, {
          params: { classId: selectedClass._id },
        });
        const activitiesData = activitiesRes.data || [];

        const activitiesWithSubmissions = await Promise.all(
          activitiesData.map(async (activity) => {
            try {
              const submissionsRes = await axios.get(
                `${API_BASE_URL}activities/submissions/teacher/${teacherId}`,
                { params: { activityId: activity._id } }
              );
              return { ...activity, submissions: submissionsRes.data.submissions || [] };
            } catch {
              return { ...activity, submissions: [] };
            }
          })
        );

        setActivities(activitiesWithSubmissions);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load activities");
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
          return {
            ...activity,
            submissions: activity.submissions.map(sub =>
              sub._id === submissionId ? { ...sub, score: newScore } : sub
            ),
          };
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
        alert("Please enter a valid number");
        return;
      }
      await axios.put(`${API_BASE_URL}activities/submissions/score/${submissionId}`, { score: scoreNumber });
      alert("Score updated successfully!");
    } catch (err) {
      alert(`Failed to update score: ${err.response?.data?.message || err.message}`);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile className="text-gray-400" />;
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return <FaFilePdf className="text-red-500" />;
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return <FaFileImage className="text-blue-500" />;
    if (lower.endsWith(".docx")) return <FaFileWord className="text-blue-600" />;
    if (lower.endsWith(".zip")) return <FaFileArchive className="text-yellow-500" />;
    return <FaFile className="text-gray-400" />;
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

  const handleExportExcel = async () => {
    if (!selectedClass) return;
    try {
      const res = await axios.get(`${API_BASE_URL}activities/export-scores`, {
        params: { classId: selectedClass._id }
      });
      const { exportData, activityTitles } = res.data;

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
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mr-3" />
            <p className="text-lg font-semibold text-gray-600">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 text-xl mr-3" />
              <p className="text-red-700 font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Class Selection View */}
        {!selectedClass && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <FaClipboardList className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Activity Monitoring</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Select a class to view activities and submissions</p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-24"></div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search classes..."
                  className="w-full p-4 pl-12 border-2 border-blue-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                  value={classSearchTerm}
                  onChange={(e) => setClassSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Classes Grid */}
            {filteredClasses.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
                  <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Classes Found</h3>
                  <p className="text-gray-600">No classes match your search criteria.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-300"
                    onClick={() => setSelectedClass(cls)}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <FaBookOpen className="text-white text-xl" />
                        <h3 className="text-xl font-bold text-white truncate">{cls.className}</h3>
                      </div>
                      {cls.section && (
                        <p className="text-blue-100 text-sm">Section: {cls.section}</p>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaMapMarkerAlt className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm"><strong>Room:</strong> {cls.roomNumber || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaCalendarAlt className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm"><strong>Day:</strong> {cls.day || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaClock className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm"><strong>Time:</strong> {cls.time ? new Date(cls.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-blue-50 px-6 py-3 border-t-2 border-blue-100">
                      <p className="text-sm text-blue-700 font-semibold text-center flex items-center justify-center gap-2">
                        <FaTasks /> View Activities
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Activities View */}
        {selectedClass && !selectedActivity && (
          <>
            {/* Header with Back Button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <button
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-sm"
                onClick={handleBackToClasses}
              >
                <FaChevronLeft /> Back to Classes
              </button>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md"
                onClick={handleExportExcel}
              >
                <FaFileExport /> Export to Excel
              </button>
            </div>

            {/* Class Info Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <FaTasks className="text-4xl" />
                <h1 className="text-2xl sm:text-3xl font-bold">Activities for {selectedClass.className}</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-sm sm:text-base">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <FaMapMarkerAlt />
                  <span><strong>Room:</strong> {selectedClass.roomNumber || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <FaCalendarAlt />
                  <span><strong>Day:</strong> {selectedClass.day || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <FaClock />
                  <span><strong>Time:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Activities Grid */}
            {activities.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
                  <FaBookOpen className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Activities</h3>
                  <p className="text-gray-600">No activities found for this class.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map(activity => (
                  <div
                    key={activity._id}
                    onClick={() => setSelectedActivity(activity)}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-300"
                  >
                    {/* Activity Title */}
                    <div className="p-6 border-b-2 border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FaBookOpen className="text-blue-600 text-xl" />
                        <h2 className="text-lg font-bold text-gray-800 truncate">{activity.title}</h2>
                      </div>
                      {activity.date && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <FaCalendarAlt className="text-blue-600" />
                          Due: {new Date(activity.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Submissions Count */}
                    <div className="bg-blue-50 px-6 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaUsers className="text-blue-600" />
                        <span className="text-sm font-semibold">Submissions</span>
                      </div>
                      <div className="bg-blue-600 text-white font-bold text-lg rounded-full h-10 w-10 flex items-center justify-center shadow-md">
                        {activity.submissions.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Submissions View */}
        {selectedClass && selectedActivity && (
          <>
            {/* Back Button */}
            <button
              className="flex items-center gap-2 mb-8 px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-sm"
              onClick={handleBackToActivities}
            >
              <FaChevronLeft /> Back to Activities
            </button>

            {/* Activity Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 mb-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FaBookOpen className="text-3xl" />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedActivity.title}</h2>
                    {selectedActivity.date && (
                      <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                        <FaCalendarAlt />
                        Due: {new Date(selectedActivity.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">Total Submissions: {selectedActivity.submissions.length}</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search by student name..."
                  className="w-full p-3 pl-10 border-2 border-blue-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={submissionSearchTerm}
                  onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Submissions Table */}
            {selectedActivity.submissions.filter(sub => sub.studentId?.name.toLowerCase().includes(submissionSearchTerm.toLowerCase())).length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
                  <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Submissions</h3>
                  <p className="text-gray-600">No submissions found for this activity.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Attachment</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedActivity.submissions
                        .filter(sub => sub.studentId?.name.toLowerCase().includes(submissionSearchTerm.toLowerCase()))
                        .map((sub, index) => {
                          const fileTypeIcon = getFileIcon(sub.fileName);
                          
                          let fileUrl = null;
                          if (sub.cloudinaryUrl) {
                            fileUrl = sub.cloudinaryUrl;
                          } else if (sub._id) {
                            fileUrl = `${API_BASE_URL}activities/submissions/download/${sub._id}`;
                          }

                          const dueDate = selectedActivity.date ? new Date(selectedActivity.date) : null;
                          const submissionDate = sub.submissionDate ? new Date(sub.submissionDate) : null;
                          const isLate = submissionDate && dueDate && submissionDate > dueDate;

                          return (
                            <tr key={sub._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'} hover:bg-blue-50 transition-colors`}>
                              {/* Student Info */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-blue-100 p-2 rounded-full">
                                    <FaUsers className="text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{sub.studentId?.name || "-"}</p>
                                    <p className="text-sm text-gray-600">{sub.studentId?.email || "-"}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Submission Date */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <FaCalendarAlt className="text-blue-600" />
                                  <span className="text-sm">
                                    {submissionDate ? submissionDate.toLocaleDateString() : "-"}
                                  </span>
                                </div>
                              </td>

                              {/* Attachment */}
                              <td className="px-6 py-4">
                                {sub.fileName && fileUrl ? (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-xs text-gray-600 truncate max-w-xs">{sub.fileName}</span>
                                    {/\.(jpg|jpeg|png|gif)$/i.test(sub.fileName) && (
                                      <img
                                        src={fileUrl}
                                        alt={sub.fileName}
                                        className="w-24 h-16 object-cover rounded border border-gray-200"
                                      />
                                    )}
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium w-fit"
                                    >
                                      {fileTypeIcon}
                                      <span>View</span>
                                      <FaDownload size={12} />
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic flex items-center gap-2">
                                    <FaFile /> No file
                                  </span>
                                )}
                              </td>

                              {/* Score Input */}
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <FaTasks className="text-blue-600" />
                                  <input
                                    type="number"
                                    value={sub.score || ""}
                                    onChange={(e) => handleScoreChange(selectedActivity._id, sub._id, e.target.value)}
                                    className="w-20 p-2 border-2 border-blue-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  {isLate ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                      <FaTimesCircle /> Late
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                      <FaCheckCircle /> On Time
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Save Button */}
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleSubmitScore(sub._id, sub.score)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                                  >
                                    <FaCheckCircle /> Save
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}