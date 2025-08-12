import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileArchive, FaDownload, FaChevronLeft, FaBookOpen } from "react-icons/fa";
import '../Css/ActivityMonitoring.css';

const API_BASE = "http://localhost:5000";

const FallingBooksAnimation = () => {
  const bookEmojis = ["\uD83D\uDCDA", "\uD83D\uDCD3", "\uD83D\uDCD5", "\uD83D\uDCD7", "\uD83D\uDCD8"];
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
  const [selectedActivity, setSelectedActivity] = useState(null); // Bagong state
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
        const res = await axios.get(`${API_BASE}/api/class?teacherId=${teacherId}`);
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
        const activitiesRes = await axios.get(`${API_BASE}/api/activities?classId=${selectedClass._id}`);
        const classActivities = activitiesRes.data || [];

        const submissionsRes = await axios.get(`${API_BASE}/api/activities/submissions/${teacherId}?classId=${selectedClass._id}`);
        const allSubmissions = submissionsRes.data.submissions.filter(sub => sub.studentId?.role === 'student') || [];

        const activitiesWithSubmissions = classActivities.map(activity => {
          const relatedSubmissions = allSubmissions.filter(sub => sub.activityId?._id === activity._id);
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
    // Update selectedActivity as well if it's the one being changed
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
      await axios.put(`${API_BASE}/api/activities/submissions/score/${submissionId}`, { score: scoreNumber });
      alert("Score updated successfully!");
    } catch (err) {
      alert(`Failed to update score: ${err.response?.data?.message || err.message}`);
    }
  };

  const getFileIconAndAction = (attachment) => {
    if (!attachment) return { icon: <FaFile className="text-gray-500" />, action: "View" };
    const lower = attachment.toLowerCase();
    if (lower.endsWith(".pdf")) return { icon: <FaFilePdf className="text-red-500" />, action: "View" };
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return { icon: <FaFileImage className="text-blue-500" />, action: "View" };
    if (lower.endsWith(".docx")) return { icon: <FaFileWord className="text-blue-600" />, action: "Download" };
    if (lower.endsWith(".zip")) return { icon: <FaFileArchive className="text-yellow-500" />, action: "Download" };
    return { icon: <FaFile className="text-gray-500" />, action: "View" };
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

  // Main Render
  return (
    <div className="app-container bg-gray-100 dark:bg-gray-900 min-h-screen">
      <FallingBooksAnimation />
      <div className="content p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
        {loading && <p className="text-center mt-6 text-lg font-semibold">Loading...</p>}
        {error && <p className="text-center mt-6 text-red-500 dark:text-red-400 text-lg">Error: {error}</p>}

        {/* View 1: Class Selection */}
        {!loading && !error && !selectedClass && (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-300">Select a Class</h1>
            <input
              type="text"
              placeholder="Search class..."
              className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700"
              value={classSearchTerm}
              onChange={(e) => setClassSearchTerm(e.target.value)}
            />
            {filteredClasses.length === 0 ? (
              <p className="text-center mt-6 text-lg">No classes found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                  <div key={cls._id} className="cursor-pointer p-0 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105 bg-white dark:bg-gray-800 flex flex-col" onClick={() => setSelectedClass(cls)}>
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                      <h3 className="text-xl font-bold text-white mb-1 truncate">{cls.className}</h3>
                      {cls.section && <p className="text-indigo-100 text-sm"><span className="opacity-75">Section:</span> {cls.section}</p>}
                    </div>
                    <div className="px-6 py-4 flex-grow">
                      <p className="text-gray-700 dark:text-gray-300 mb-2">Room: {cls.roomNumber || "N/A"}</p>
                      <p className="text-gray-700 dark:text-gray-300">Time: {cls.time ? new Date(cls.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}</p>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-center text-indigo-500 dark:text-indigo-400 font-medium">Click to view activities</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* View 2: Activity Selection */}
        {!loading && selectedClass && !selectedActivity && (
          <>
            <button className="mb-8 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition duration-300 ease-in-out flex items-center shadow-md hover:shadow-lg" onClick={handleBackToClasses}>
              <FaChevronLeft className="mr-2" /> Back to Classes
            </button>
            <h1 className="text-4xl font-bold mb-8 text-indigo-700 dark:text-indigo-300 text-center">Activities for: <span className="text-purple-600 dark:text-purple-400">{selectedClass.className}</span></h1>
            {activities.length === 0 ? (
              <div className="text-center py-10"><p className="text-xl text-gray-600 dark:text-gray-400">No activities found for this class.</p></div>
            ) : (
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity._id} onClick={() => setSelectedActivity(activity)} className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-all duration-200 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{activity.title}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Due: {activity.date ? new Date(activity.date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{activity.submissions.length}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Submissions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* View 3: Submissions List */}
        {!loading && selectedClass && selectedActivity && (
          <>
            <button className="mb-8 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition duration-300 ease-in-out flex items-center shadow-md hover:shadow-lg" onClick={handleBackToActivities}>
              <FaChevronLeft className="mr-2" /> Back to Activities
            </button>
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4">
                <h2 className="text-2xl font-bold">{selectedActivity.title}</h2>
                <p className="text-sm opacity-80">Due: {selectedActivity.date ? new Date(selectedActivity.date).toLocaleDateString() : 'N/A'}</p>
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
                          <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider">Submitted By</th>
                          <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider">Attachment</th>
                          <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Score</th>
                          <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Status</th>
                          <th className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 dark:text-gray-300">
                        {selectedActivity.submissions
                          .filter(sub => sub.studentId?.name.toLowerCase().includes(submissionSearchTerm.toLowerCase()))
                          .map((sub, index) => {
                            const { icon: fileTypeIcon, action } = getFileIconAndAction(sub.attachment);
                            const dueDate = selectedActivity.date ? new Date(selectedActivity.date) : null;
                            const submissionDate = sub.submissionDate ? new Date(sub.submissionDate) : null;
                            const statusText = submissionDate && dueDate ? (submissionDate > dueDate ? "Late" : "Submitted") : "Submitted";
                            const absoluteUrl = sub.attachment ? `${API_BASE}${sub.attachment}` : "";

                            return (
                              <tr key={sub._id} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-all duration-200 ease-in-out ${index % 2 !== 0 ? 'bg-gray-50 dark:bg-gray-800/60' : ''}`}>
                                <td className="px-6 py-4"><div className="font-medium text-gray-900 dark:text-white">{sub.studentId?.name || "-"}</div><div className="text-sm text-gray-500">{sub.studentId?.email || "-"}</div></td>
                                <td className="px-6 py-4">{submissionDate ? new Date(submissionDate).toLocaleString() : "-"}</td>
                                <td className="px-6 py-4">{sub.attachment ? <a href={absoluteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-500/50 w-fit shadow-sm"><span className="text-lg mr-2">{fileTypeIcon}</span><span className="text-sm font-medium">{action}</span>{action === "Download" && <FaDownload className="ml-2" />}</a> : <span className="text-gray-400 dark:text-gray-500 italic">No file</span>}</td>
                                <td className="px-6 py-4 text-center"><input type="number" value={sub.score || ""} onChange={(e) => handleScoreChange(selectedActivity._id, sub._id, e.target.value)} className="p-2 border rounded-md w-20 text-center bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600" placeholder="Score" /></td>
                                <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${statusText === "Late" ? "bg-red-100 dark:bg-red-500/30 text-red-800 dark:text-red-200" : "bg-green-100 dark:bg-green-500/30 text-green-800 dark:text-green-200"}`}>{statusText}</span></td>
                                <td className="px-6 py-4 text-center"><button onClick={() => handleSubmitScore(sub._id, sub.score)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-md">Save</button></td>
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