import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileArchive, FaDownload } from "react-icons/fa";
import '../Css/ActivityMonitoring.css';

const API_BASE = "http://localhost:5000";

const FallingBooksAnimation = () => {
  const bookEmojis = ["\uD83D\uDCDA", "\uD83D\uDCD3", "\uD83D\uDCD5", "\uD83D\uDCD7", "\uD83D\uDCD8"]; // Book emojis
  const numberOfBooks = 7;

  return (
    <div className="falling-books-container">
      {Array.from({ length: numberOfBooks }, (_, index) => {
        const randomLeft = Math.random() * 100;
        const randomDuration = Math.random() * 5 + 5; // Duration between 5 and 10 seconds
        const randomDelay = Math.random() * 2; // Delay up to 2 seconds
        const randomEmoji = bookEmojis[Math.floor(Math.random() * bookEmojis.length)];

        return (
          <div
            className="falling-book"
            key={`book-${index}`}
            style={{
              left: `${randomLeft}vw`,
              animationDuration: `${randomDuration}s`,
              animationDelay: `${randomDelay}s`,
            }}
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
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get teacherId from localStorage
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user && user.role === "teacher" ? user._id : null;

  // Fetch classes for the teacher
  useEffect(() => {
    if (!teacherId) {
      setError("Teacher not logged in");
      return;
    }

    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/classes?teacherId=${teacherId}`);
        setClasses(res.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [teacherId]);

  // Fetch submissions when a class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/api/activities/submissions/${teacherId}?classId=${selectedClass._id}`
        );
        // Filter for student submissions
        const studentSubmissions = res.data.submissions.filter(
          (sub) => sub.studentId?.role === "student"
        );
        setSubmissions(studentSubmissions || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedClass, teacherId]);

  const handleScoreChange = (e, submissionId) => {
    const updatedSubmissions = submissions.map((sub) => {
      if (sub._id === submissionId) {
        return { ...sub, score: e.target.value };
      }
      return sub;
    });
    setSubmissions(updatedSubmissions);
  };

  const handleSubmitScore = async (submissionId, score) => {
    try {
      const scoreNumber = Number(score);

      if (isNaN(scoreNumber)) {
        alert("Score must be a number");
        return;
      }

      const response = await axios.put(
        `${API_BASE}/api/activities/submissions/score/${submissionId}`,
        { score: scoreNumber }
      );

      if (response.status === 200) {
        setSubmissions((prevSubmissions) =>
          prevSubmissions.map((sub) =>
            sub._id === submissionId ? { ...sub, score: scoreNumber } : sub
          )
        );
        alert("Score updated successfully!");
      } else {
        alert(
          `Failed to update score. Status: ${response.status}. See console for details.`
        );
      }
    } catch (err) {
      alert(
        `Failed to update score. ${
          err.response
            ? `Status: ${err.response.status}.`
            : "No response received from server."
        }`
      );
    }
  };

  return (
    <div className="app-container bg-gray-100 dark:bg-gray-900 min-h-screen">
      <FallingBooksAnimation />
      <div className="content p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
        {loading ? (
          <p className="text-center mt-6 text-lg font-semibold">Loading...</p>
        ) : error ? (
          <p className="text-center mt-6 text-red-500 dark:text-red-400 text-lg">Error: {error}</p>
        ) : (
          <>
            {/* Show list of classes when no class is selected */}
            {!selectedClass ? (
              classes.length === 0 ? (
                <p className="text-center mt-6 text-lg">No classes found.</p>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-300">
                    Select a Class
                  </h1>

                  <input
                    type="text"
                    placeholder="Search class..."
                    className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes
                      .filter((cls) =>
                        cls.className
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((cls) => (
                        <div
                          key={cls._id}
                          className="cursor-pointer p-0 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:scale-105 bg-white dark:bg-gray-800 flex flex-col"
                          onClick={() => setSelectedClass(cls)}
                        >
                          {/* Header with gradient background */}
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                            <h3 className="text-xl font-bold text-white mb-1 truncate">
                              {cls.className}
                            </h3>
                            {cls.section && (
                              <p className="text-indigo-100 text-sm">
                                <span className="opacity-75">Section:</span> {cls.section}
                              </p>
                            )}
                          </div>

                          {/* Content section */}
                          <div className="px-6 py-4 flex-grow">
                            <div className="flex items-center mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <p className="text-gray-700 dark:text-gray-300">
                                {cls.roomNumber ? `Room ${cls.roomNumber}` : "No room assigned"}
                              </p>
                            </div>

                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-700 dark:text-gray-300">
                                {cls.time
                                  ? new Date(cls.time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                  : "No time set"
                                }
                              </p>
                            </div>
                          </div>

                          {/* Footer with action hint */}
                          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                            <p className="text-xs text-center text-indigo-500 dark:text-indigo-400 font-medium flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Click to view submissions
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )
            ) : (
              <>
                <button
                  className="mb-8 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition duration-300 ease-in-out flex items-center shadow-md hover:shadow-lg"
                  onClick={() => {
                    setSelectedClass(null);
                    setSubmissions([]);
                    setError(null);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Classes
                </button>

                <h1 className="text-4xl font-bold mb-8 text-indigo-700 dark:text-indigo-300 text-center">
                  Submissions for: <span className="text-purple-600 dark:text-purple-400">{selectedClass.className}</span>
                </h1>

                {submissions.length === 0 ? (
                  <div className="text-center py-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400 dark:text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xl text-gray-600 dark:text-gray-400">No activity submissions found for this class yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg">
                    <table className="min-w-full table-auto border-collapse text-left">
                      <thead className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-t-lg">
                        <tr>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Activity Title</th>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Submitted By</th>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Date</th>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider">Attachment</th>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-center">Score</th>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-center">Status</th>
                          <th className="px-6 py-4 text-sm font-semibold uppercase tracking-wider text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 dark:text-gray-300">
                        {submissions.map((sub, index) => {
                          let fileTypeIcon = <FaFile className="text-gray-500" />;
                          let action = "View";

                          const dueDate = sub.activityId?.date ? new Date(sub.activityId.date) : null;
                          const submissionDate = sub.submissionDate ? new Date(sub.submissionDate) : null;

                          let statusText = "-";

                          if (submissionDate && dueDate) {
                            if (submissionDate > dueDate) {
                              statusText = "Late";
                            } else {
                              statusText = "Submitted";
                            }
                          } else if (submissionDate) {
                            statusText = "Submitted"; // If no due date, consider it submitted
                          }


                          if (sub.attachment) {
                            const attachmentLower = sub.attachment.toLowerCase();
                            if (attachmentLower.endsWith(".pdf")) {
                              fileTypeIcon = <FaFilePdf className="text-red-500" />;
                            } else if (
                              attachmentLower.endsWith(".jpg") ||
                              attachmentLower.endsWith(".jpeg") ||
                              attachmentLower.endsWith(".png")
                            ) {
                              fileTypeIcon = <FaFileImage className="text-blue-500" />;
                            } else if (attachmentLower.endsWith(".docx")) {
                              fileTypeIcon = <FaFileWord className="text-blue-600" />;
                              action = "Download";
                            } else if (attachmentLower.endsWith(".zip")) {
                              fileTypeIcon = <FaFileArchive className="text-yellow-500" />;
                              action = "Download";
                            }
                          }

                          const baseUrl = "http://localhost:5000";
                          const absoluteUrl = sub.attachment
                            ? `${baseUrl}${sub.attachment}`
                            : "";

                          return (
                            <tr
                              key={sub._id}
                              className={`border-b border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-all duration-200 ease-in-out ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/60'}`} // Adjusted dark mode striping
                            >
                              <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sub.activityId?.title || "N/A"}</td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900 dark:text-white">{sub.studentId?.name || "-"}</div>
                              </td>
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-400 italic">{sub.studentId?.email || "-"}</td>
                              <td className="px-6 py-4">
                                {sub.submissionDate ? (
                                  <div className="whitespace-nowrap">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {new Date(sub.submissionDate).toLocaleDateString()}
                                    </span>
                                    <br />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(sub.submissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {sub.attachment ? (
                                  <a
                                    href={absoluteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-500/50 transition-all duration-200 w-fit shadow-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-lg mr-2">{fileTypeIcon}</span>
                                    <span className="text-sm font-medium">{action}</span>
                                    {action === "Download" && <FaDownload className="ml-2 text-indigo-600 dark:text-indigo-300" />}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500 italic">No file</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <input
                                  type="number"
                                  value={sub.score || ""}
                                  onChange={(e) => handleScoreChange(e, sub._id)}
                                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-20 text-center font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  min="0"
                                  max="100"
                                  placeholder="Score"
                                />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    statusText === "Late"
                                      ? "bg-red-100 dark:bg-red-500/30 text-red-800 dark:text-red-200"
                                      : statusText === "Submitted"
                                        ? "bg-green-100 dark:bg-green-500/30 text-green-800 dark:text-green-200"
                                        : "bg-gray-100 dark:bg-gray-600/30 text-gray-800 dark:text-gray-200"
                                  }`}
                                >
                                  {statusText}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleSubmitScore(sub._id, sub.score)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg w-full sm:w-auto"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Save
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}