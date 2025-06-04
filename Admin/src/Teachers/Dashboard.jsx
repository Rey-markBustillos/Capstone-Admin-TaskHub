import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";

const API_BASE = "http://localhost:5000";

export default function TeacherDashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    submissionRate: 0,
  });
  const [submissions, setSubmissions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState(null);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?._id;
  const role = user?.role || "teacher";

  // Fetch classes to calculate totalClasses and totalStudents

  // Fetch submissions for this teacher

  // On mount: fetch all dashboard data
  useEffect(() => {
    async function fetchClasses() {
      if (!teacherId) return;
      try {
        setLoadingStats(true);
        const res = await axios.get(`${API_BASE}/api/classes`, {
          params: { teacherId },
        });
        if (res.status !== 200) throw new Error("Failed to fetch classes");
        const classes = res.data;

        // Calculate total students (unique student IDs across all classes)
        const studentIdsSet = new Set();
        classes.forEach((c) => {
          c.students.forEach((s) => studentIdsSet.add(s._id || s));
        });

        return { totalClasses: classes.length, totalStudents: studentIdsSet.size };
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return null;
      } finally {
        setLoadingStats(false);
      }
    }

    async function fetchSubmissions() {
      if (!teacherId) return;
      try {
        setLoadingSubs(true);
        const res = await axios.get(
          `${API_BASE}/api/activities/submissions/${teacherId}`
        ); // Update endpoint as per your backend routing
        if (res.status !== 200) throw new Error("Failed to fetch submissions");
        return res.data.submissions || [];
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        return [];
      } finally {
        setLoadingSubs(false);
      }
    }

    async function loadDashboard() {
      setError(null);
      const classesData = await fetchClasses();
      const submissionsData = await fetchSubmissions();

      if (classesData) {
        // Calculate submissionRate = (submissions / totalStudents) * 100
        // Guard division by zero
        const submissionRate =
          classesData.totalStudents > 0
            ? Math.round((submissionsData.length / classesData.totalStudents) * 100)
            : 0;

        setStats({
          totalClasses: classesData.totalClasses,
          totalStudents: classesData.totalStudents,
          submissionRate,
        });
      }

      setSubmissions(submissionsData);
    }
    loadDashboard();
  }, [teacherId]);

  if (error)
    return (
      <p className="text-red-600 p-6 text-center text-lg font-semibold">
        Error: {error}
      </p>
    );

  if (loadingStats || loadingSubs)
    return (
      <p className="p-6 text-center text-lg font-medium">Loading dashboard...</p>
    );

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        role={role}
        onLogout={() => {
          localStorage.removeItem("user");
          window.location.reload();
        }}
      />

      <main
        className="container mx-auto py-6 px-4 md:px-6 lg:px-8"
        style={{
          display: "flex",
          flexDirection: "column",
          marginLeft: 0,
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "900px",
        }}
      >
        <div className="bg-[#FFDAB9] rounded p-6 font-sans shadow">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Teacher Dashboard Overview
          </h1>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-600 text-white p-6 rounded shadow text-center">
              <h2 className="text-xl mb-2">Total Classes</h2>
              <p className="text-4xl font-bold">{stats.totalClasses}</p>
            </div>
            <div className="bg-green-600 text-white p-6 rounded shadow text-center">
              <h2 className="text-xl mb-2">Total Students</h2>
              <p className="text-4xl font-bold">{stats.totalStudents}</p>
            </div>
            <div className="bg-purple-600 text-white p-6 rounded shadow text-center">
              <h2 className="text-xl mb-2">Submission Rate</h2>
              <p className="text-4xl font-bold">{stats.submissionRate}%</p>
            </div>
          </div>

          {/* Activity Submissions */}
          <section>
            <h2 className="text-2xl text-gray-800 font-semibold mb-4">
              Recent Activity Submissions
            </h2>

            {submissions.length === 0 ? (
              <p className="text-gray-800">No submissions yet.</p>
            ) : (
              <ul className="space-y-4 text-gray-800">
                {submissions.map((sub) => (
                  <li
                    key={sub._id}
                    className="p-4 bg-white rounded shadow border border-gray-200"
                  >
                    <p>
                      <span className="font-medium">{sub.createdBy?.name || "N/A"}</span>{" "}
                      submitted <span className="font-semibold">{sub.title}</span> for{" "}
                      <span className="italic">{sub.classId?.className || "N/A"}</span>
                    </p>
                    <p className="text-gray-500 text-sm">
                      {new Date(sub.date).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
