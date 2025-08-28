import React, { useEffect, useState } from "react";
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

const API_BASE = import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

const AdminDashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState("User Management");
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("");
  
  // User management states
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("Student");

  // Fetch users on component mount or when User Management menu is selected
  useEffect(() => {
    if (selectedMenu === "User Management") {
      fetchUsers();
    }
  }, [selectedMenu]);
  
  // Assignments states
  const [classes, setClasses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [errorAssignments, setErrorAssignments] = useState("");
  
  // Fetch users or assignments on menu change
  useEffect(() => {
    if (selectedMenu === "User Management") {
      fetchUsers();
    }
    if (selectedMenu === "Assignments") {
      fetchAssignmentsData();
    }
  }, [selectedMenu]);
  
  const fetchAssignmentsData = async () => {
    setLoadingAssignments(true);
    setErrorAssignments("");
    try {
      const [classRes, activityRes] = await Promise.all([
        fetch(`${API_BASE}/class`),
        fetch(`${API_BASE}/activities`),
      ]);
      if (!classRes.ok) throw new Error("Failed to fetch classes");
      if (!activityRes.ok) throw new Error("Failed to fetch activities");
      const classData = await classRes.json();
      const activityData = await activityRes.json();
      setClasses(classData);
      setActivities(activityData);
    } catch (err) {
      setErrorAssignments(err.message);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers("");
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setErrorUsers(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filtered users for display
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Add new user
  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      alert("Please enter a name.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName, role: newUserRole }),
      });
      if (!res.ok) throw new Error("Failed to add user");
      await fetchUsers();
      setNewUserName("");
      setNewUserRole("Student");
      setModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex min-h-screen">
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
                selectedMenu === item ? "bg-blue-600 text-white" : "hover:bg-blue-100"
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8">
        {/* Admin Dashboard Header */}
        <div className="flex items-center gap-4 mb-8">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-600 text-white shadow-lg border-4 border-white">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </span>
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight drop-shadow">Admin Dashboard</h1>
            <p className="text-gray-500 font-medium">Welcome, Admin! Manage users, classes, and monitor activities here.</p>
          </div>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-100 via-white to-blue-200 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center border-t-4 border-blue-400">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-200 text-blue-700 mb-2 shadow border-2 border-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 014.5 20.25v-.75z" /></svg>
            </span>
            <h3 className="text-blue-700 font-semibold">Total Users</h3>
            <p className="text-3xl font-extrabold text-blue-900 drop-shadow">{users.length}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-100 via-white to-indigo-200 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center border-t-4 border-indigo-400">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-200 text-indigo-700 mb-2 shadow border-2 border-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></svg>
            </span>
            <h3 className="text-indigo-700 font-semibold">Active Assignments</h3>
            <p className="text-3xl font-extrabold text-indigo-900 drop-shadow">{sampleSummary.activeAssignments}</p>
          </div>
          <div className="bg-gradient-to-br from-red-100 via-white to-yellow-100 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center border-t-4 border-red-300">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-200 text-red-700 mb-2 shadow border-2 border-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </span>
            <h3 className="text-red-700 font-semibold">Late Submissions</h3>
            <p className="text-3xl font-extrabold text-red-900 drop-shadow">{sampleSummary.lateSubmissions}</p>
          </div>
        </div>

        {/* Table with filter */}
        {selectedMenu === "User Management" && (
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
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 rounded-lg bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-md">
                {loadingUsers && <p className="flex items-center gap-2 text-blue-600 font-semibold p-4"><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Loading users...</p>}
                {errorUsers && <p className="text-red-600 flex items-center gap-2 p-4"><svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>{errorUsers}</p>}
                {!loadingUsers && filteredUsers.length === 0 && (
                  <p className="text-center p-4 text-gray-500 flex items-center justify-center gap-2"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>No users found</p>
                )}
                {!loadingUsers && filteredUsers.length > 0 && (
                  <table className="w-full border-collapse rounded-xl overflow-hidden shadow border border-blue-200">
                    <thead className="bg-gradient-to-r from-blue-200 via-blue-100 to-white">
                      <tr>
                        <th className="px-4 py-2 text-left text-blue-800 font-bold text-base flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-500 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 014.5 20.25v-.75z" /></svg>
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-blue-800 font-bold text-base flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v2.25m0 0a2.25 2.25 0 01-2.25-2.25h4.5A2.25 2.25 0 0112 18.75z" /></svg>
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, idx) => (
                        <tr key={user._id || idx} className="hover:bg-blue-100 transition-all group">
                          <td className="px-4 py-2 border-b border-blue-100 text-gray-900 font-medium flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400 group-hover:text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 014.5 20.25v-.75z" /></svg>
                            {user.name}
                          </td>
                          <td className="px-4 py-2 border-b border-blue-100 text-gray-700 flex items-center gap-2">
                            {user.role === 'student' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold"><span className="text-lg">👨‍🎓</span>Student</span>}
                            {user.role === 'teacher' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold"><span className="text-lg">👨‍🏫</span>Teacher</span>}
                            {user.role === 'admin' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold"><span className="text-lg">🧑‍💼</span>Admin</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="md:w-1/2 bg-white p-4 rounded shadow flex items-center justify-center">
                <Bar
                  data={{
                    labels: classes.map((cls) => cls.className),
                    datasets: [
                      {
                        label: "# of Activities",
                        backgroundColor: "rgba(37, 99, 235, 0.6)",
                        borderColor: "rgba(37, 99, 235, 1)",
                        borderWidth: 1,
                        hoverBackgroundColor: "rgba(37, 99, 235, 0.8)",
                        hoverBorderColor: "rgba(37, 99, 235, 1)",
                        data: classes.map((cls) =>
                          activities.filter((act) => act.classId === cls._id || act.classId === cls._id?.toString()).length
                        ),
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "top" },
                      title: { display: true, text: "Number of Activities per Class" },
                    },
                  }}
                />
              </div>
            </div>
            {/* Submissions chart below */}
            <div className="mt-8 bg-white p-4 rounded shadow overflow-x-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
              <h3 className="mb-4 font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /></svg>
                Submissions Over Time (Bar Chart)
              </h3>
              <div className="min-w-[400px]">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Assignments Section */}
         {selectedMenu === "Assignments" && (
           <div className="mb-8 bg-gradient-to-br from-indigo-50 via-white to-blue-100 p-6 rounded-2xl shadow-lg border-t-4 border-indigo-300">
             <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-800">
               <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></svg>
               Assignments per Class
             </h2>
             {loadingAssignments && <p className="flex items-center gap-2 text-indigo-600 font-semibold p-4"><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Loading assignments...</p>}
             {errorAssignments && <p className="text-red-600 flex items-center gap-2 p-4"><svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>{errorAssignments}</p>}
             {!loadingAssignments && classes.length > 0 && (
               <div className="bg-white rounded-xl shadow p-4">
                 <Bar
                   data={{
                     labels: classes.map((cls) => cls.className),
                     datasets: [
                       {
                         label: "# of Activities",
                         backgroundColor: "rgba(37, 99, 235, 0.6)",
                         borderColor: "rgba(37, 99, 235, 1)",
                         borderWidth: 1,
                         hoverBackgroundColor: "rgba(37, 99, 235, 0.8)",
                         hoverBorderColor: "rgba(37, 99, 235, 1)",
                         data: classes.map((cls) =>
                           activities.filter((act) => act.classId === cls._id || act.classId === cls._id?.toString()).length
                         ),
                       },
                     ],
                   }}
                   options={{
                     responsive: true,
                     plugins: {
                       legend: { position: "top" },
                       title: { display: true, text: "Number of Activities per Class" },
                     },
                   }}
                 />
               </div>
             )}
             {!loadingAssignments && classes.length === 0 && (
               <p className="text-center p-4 text-gray-500 flex items-center justify-center gap-2"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>No classes found</p>
             )}
           </div>
         )}

        {/* Default Charts (show for other menus except User Management & Assignments) */}
        {selectedMenu !== "User Management" && selectedMenu !== "Assignments" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 rounded-2xl shadow-lg border-t-4 border-blue-200">
              <h3 className="mb-4 font-semibold flex items-center gap-2 text-blue-800"><svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /></svg>Submissions Over Time (Bar Chart)</h3>
              <Bar data={barData} options={barOptions} />
            </div>
            <div className="bg-gradient-to-br from-green-50 via-white to-green-100 p-6 rounded-2xl shadow-lg border-t-4 border-green-200">
              <h3 className="mb-4 font-semibold flex items-center gap-2 text-green-800"><svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>Submission Status (Pie Chart)</h3>
              <Pie data={pieData} options={pieOptions} />
            </div>
            <div className="bg-gradient-to-br from-yellow-50 via-white to-yellow-100 p-6 rounded-2xl shadow-lg border-t-4 border-yellow-200">
              <h3 className="mb-4 font-semibold flex items-center gap-2 text-yellow-800"><svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>New Users (Line Chart)</h3>
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white rounded p-6 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Add New User</h3>

              <label className="block mb-2 font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              />

              <label className="block mb-2 font-medium text-gray-700">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              >
                <option>Student</option>
                <option>Teacher</option>
                <option>Admin</option>
              </select>

              <button
                onClick={handleAddUser}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
              >
                Add User
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;