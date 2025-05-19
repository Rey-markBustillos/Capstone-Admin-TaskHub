import React, { useEffect, useState } from "react";

const API_BASE = 'http://localhost:5000'; // Change if your backend URL differs

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingGrading: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoadingStats(true);
        const res = await fetch(`${API_BASE}/api/teacher/stats`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, []);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoadingNotifications(true);
        const res = await fetch(`${API_BASE}/api/teacher/notifications`);
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingNotifications(false);
      }
    }
    fetchNotifications();
  }, []);

  if (error)
    return <p className="text-red-600 p-6 text-center text-lg font-semibold">{error}</p>;

  if (loadingStats || loadingNotifications)
    return <p className="p-6 text-center text-lg font-medium">Loading dashboard...</p>;

  return (
    <div className="bg-[#FFDAB9] w-430 h-190">
    <div className="bg-white max-w-5xl h-190 mx-auto p-6 font-sans rounded shadow">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Teacher Dashboard Overview</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-600 text-white p-6 rounded shadow">
          <h2 className="text-xl mb-2">Total Classes</h2>
          <p className="text-4xl font-bold">{stats.totalClasses}</p>
        </div>
        <div className="bg-green-600 text-white p-6 rounded shadow">
          <h2 className="text-xl mb-2">Assignments</h2>
          <p className="text-4xl font-bold">{stats.totalAssignments}</p>
        </div>
        <div className="bg-purple-600 text-white p-6 rounded shadow">
          <h2 className="text-xl mb-2">Submissions</h2>
          <p className="text-4xl font-bold">{stats.totalSubmissions}</p>
        </div>
        <div className="bg-red-600 text-white p-6 rounded shadow">
          <h2 className="text-xl mb-2">Pending Grading</h2>
          <p className="text-4xl font-bold">{stats.pendingGrading}</p>
        </div>
      </div>

      {/* Notifications */}
      <section>
        <h2 className="text-2xl text-gray-800 font-semibold mb-4">Notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-gray-800">No new notifications</p>
        ) : (
          <ul className="space-y-4 text-gray-800">
            {notifications.map((note) => (
              <li
                key={note.id}
                className="p-4 bg-white rounded shadow border border-gray-200"
              >
                <p className="font-medium">{note.message}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(note.date).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
    </div>
  );
}
