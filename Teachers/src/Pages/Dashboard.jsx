import React from "react";

const mockStats = {
  totalClasses: 4,
  totalAssignments: 12,
  totalSubmissions: 98,
  pendingGrading: 15,
};

const mockNotifications = [
  {
    id: 1,
    message: "Assignment 3 deadline in 2 days",
    date: "2025-05-18",
  },
  {
    id: 2,
    message: "New announcement posted in Class 2",
    date: "2025-05-16",
  },
  {
    id: 3,
    message: "Reminder: Grade submission deadline is next week",
    date: "2025-05-15",
  },
];

const Dashboard = () => {
  return (
    <div className="bg-[#FFDAB9] w-420 h-190">
    <div className="w-400 ml-20 mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-6">Teacher Dashboard Overview</h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-600 text-white p-6 rounded shadow">
          <h2 className="text-xl">Total Classes</h2>
          <p className="text-4xl font-bold">{mockStats.totalClasses}</p>
        </div>
        <div className="bg-green-600 text-white p-6 rounded shadow">
          <h2 className="text-xl">Assignments</h2>
          <p className="text-4xl font-bold">{mockStats.totalAssignments}</p>
        </div>
        <div className="bg-purple-600 text-white p-6 rounded shadow">
          <h2 className="text-xl">Submissions</h2>
          <p className="text-4xl font-bold">{mockStats.totalSubmissions}</p>
        </div>
        <div className="bg-red-600 text-white p-6 rounded shadow">
          <h2 className="text-xl">Pending Grading</h2>
          <p className="text-4xl font-bold">{mockStats.pendingGrading}</p>
        </div>
      </div>

      {/* Notifications */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
        {mockNotifications.length === 0 ? (
          <p className="text-gray-600" style={{ color: "#000" }}>No new notifications</p>
        ) : (
          <ul className="space-y-4">
            {mockNotifications.map((note) => (
              <li
                key={note.id}
                className="p-4 bg-white rounded shadow border border-gray-200"
                style={{ color: "#000" }}
              >
                <p className="font-medium">{note.message}</p>
                <p className="text-gray-500 text-sm" style={{ color: "#222" }}>
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
};

export default Dashboard;