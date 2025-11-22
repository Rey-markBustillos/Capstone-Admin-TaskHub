import React, { useEffect, useState } from "react";

const sidebarItems = [
  "User Management",
];











const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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
  

  
  // Fetch users on menu change
  useEffect(() => {
    if (selectedMenu === "User Management") {
      fetchUsers();
    }
  }, [selectedMenu]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers("");
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
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
      const res = await fetch(`${API_BASE_URL}/users`, {
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
  <div className="flex min-h-screen bg-white">
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
  <main className="flex-grow p-8 bg-white">
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
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 rounded-lg bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-md">
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