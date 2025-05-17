import React, { useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";

// Register chart.js components (required for react-chartjs-2 v4+)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const sidebarItems = [
  "User Management",
  "Assignments",
  "Submissions",
  "Reports",
  "Settings",
];

const sampleSummary = {
  totalUsers: 120,
  activeAssignments: 15,
  lateSubmissions: 7,
};

const sampleTableData = [
  { id: 1, name: "Juan Dela Cruz", role: "Student", status: "Active" },
  { id: 2, name: "Maria Santos", role: "Teacher", status: "Inactive" },
  { id: 3, name: "Pedro Reyes", role: "Student", status: "Active" },
  // add more...
];

const barData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May"],
  datasets: [
    {
      label: "Submissions",
      backgroundColor: "rgba(37, 99, 235, 0.6)",
      borderColor: "rgba(37, 99, 235, 1)",
      borderWidth: 1,
      hoverBackgroundColor: "rgba(37, 99, 235, 0.8)",
      hoverBorderColor: "rgba(37, 99, 235, 1)",
      data: [12, 19, 3, 5, 2],
    },
  ],
};

const pieData = {
  labels: ["On-time", "Late", "Missing"],
  datasets: [
    {
      data: [60, 25, 15],
      backgroundColor: [
        "rgba(34,197,94,0.7)",
        "rgba(245,158,11,0.7)",
        "rgba(239,68,68,0.7)",
      ],
      hoverBackgroundColor: [
        "rgba(34,197,94,0.9)",
        "rgba(245,158,11,0.9)",
        "rgba(239,68,68,0.9)",
      ],
    },
  ],
};

const lineData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  datasets: [
    {
      label: "New Users",
      fill: false,
      lineTension: 0.1,
      backgroundColor: "rgba(59,130,246,0.4)",
      borderColor: "rgba(59,130,246,1)",
      borderCapStyle: "round",
      borderWidth: 3,
      data: [5, 15, 8, 20],
    },
  ],
};

const barOptions = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
    title: { display: true, text: "Submissions Over Time" },
  },
};

const pieOptions = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
    title: { display: true, text: "Submission Status" },
  },
};

const lineOptions = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
    title: { display: true, text: "New Users Over Weeks" },
  },
};

const Dashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState("User Management");
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // Filtered table data
  const filteredData = sampleTableData.filter((item) =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <h2 className="text-2xl font-bold p-6 border-b border-gray-300">
          Admin Dashboard
        </h2>
        <nav className="p-4">
          {sidebarItems.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedMenu(item)}
              className={`block w-full text-left px-4 py-2 rounded mb-2 ${
                selectedMenu === item
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500">Total Users</h3>
            <p className="text-3xl font-bold">{sampleSummary.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500">Active Assignments</h3>
            <p className="text-3xl font-bold">{sampleSummary.activeAssignments}</p>
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-gray-500">Late Submissions</h3>
            <p className="text-3xl font-bold">{sampleSummary.lateSubmissions}</p>
          </div>
        </div>

        {/* Table with filter */}
        <div className="mb-8 bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{selectedMenu}</h2>
            <input
              type="text"
              placeholder="Filter by name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1"
            />
            <button
              onClick={() => setModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add New
            </button>
          </div>
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2">ID</th>
                <th className="border border-gray-300 px-4 py-2">Name</th>
                <th className="border border-gray-300 px-4 py-2">Role</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-4">
                    No data found
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50">
                    <td className="border border-gray-300 px-4 py-2">{row.id}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.role}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded shadow">
            <h3 className="mb-4 font-semibold">Submissions Over Time (Bar Chart)</h3>
            <Bar data={barData} options={barOptions} />
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="mb-4 font-semibold">Submission Status (Pie Chart)</h3>
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="bg-white p-6 rounded shadow">
            <h3 className="mb-4 font-semibold">New Users (Line Chart)</h3>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Modal Example */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Add New Entry</h3>
              {/* Add form fields here */}
              <button
                onClick={() => setModalOpen(false)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
