import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api/submissions";

const SubmissionMonitoring = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filters, setFilters] = useState({
    class: "",
    student: "",
    status: "", // "on-time", "late", or ""
    date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch submissions with optional filters
  const fetchSubmissions = React.useCallback(async () => {
    setLoading(true);
    try {
      // Build query params from filters
      const params = {};
      if (filters.class) params.class = filters.class;
      if (filters.student) params.student = filters.student;
      if (filters.status) params.status = filters.status;
      if (filters.date) params.date = filters.date;

      const res = await axios.get(API_BASE, { params });
      setSubmissions(res.data);
      setError(null);
    } catch {
      setError("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Check if submission was on-time or late (assuming each submission has 'deadline' and 'submittedAt')
  const getStatus = (submission) => {
    if (!submission.deadline || !submission.submittedAt) return "Unknown";
    return new Date(submission.submittedAt) <= new Date(submission.deadline) ? "On-time" : "Late";
  };

  // Handle file download
  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "submission_file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center">Submission Monitoring</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by Class"
          value={filters.class}
          onChange={(e) => setFilters({ ...filters, class: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filter by Student"
          value={filters.student}
          onChange={(e) => setFilters({ ...filters, student: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="on-time">On-time</option>
          <option value="late">Late</option>
        </select>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchSubmissions}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Apply Filters
        </button>
      </div>

      {loading && <p>Loading submissions...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Submissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 border-collapse">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Student",
                "Class",
                "Subject",
                "Assignment/Activity",
                "Submitted At",
                "Status",
                "File",
                "Download",
              ].map((header) => (
                <th
                  key={header}
                  className="border border-gray-300 px-4 py-2 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-4">
                  No submissions found.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub._id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{sub.studentName}</td>
                  <td className="border border-gray-300 px-4 py-2">{sub.class}</td>
                  <td className="border border-gray-300 px-4 py-2">{sub.subject}</td>
                  <td className="border border-gray-300 px-4 py-2">{sub.assignmentTitle}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{getStatus(sub)}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {sub.fileName || "No file"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {sub.fileUrl ? (
                      <button
                        onClick={() => handleDownload(sub.fileUrl, sub.fileName)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Download
                      </button>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionMonitoring;
