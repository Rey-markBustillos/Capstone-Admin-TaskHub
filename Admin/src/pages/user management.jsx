import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Css/usermanagement.css"

const API_BASE = "http://localhost:5000/api/users";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showLogsFor, setShowLogsFor] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE);
      setUsers(res.data);
      setError(null);
    } catch {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please enter name, email, and password");
      return;
    }
    setLoading(true);
    try {
      await axios.post(API_BASE, newUser);
      setNewUser({ name: "", email: "", password: "", role: "student" });
      fetchUsers();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/${id}`);
      if (showLogsFor === id) setShowLogsFor(null);
      fetchUsers();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    setLoading(true);
    try {
      await axios.patch(`${API_BASE}/${id}/toggle`);
      fetchUsers();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle user status");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser.name || !editingUser.email) {
      alert("Please enter both name and email");
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/${editingUser._id || editingUser.id}`, editingUser);
      setEditingUser(null);
      fetchUsers();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center text-lg mt-10">Loading...</p>;
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold mb-8 text-center">User Management</h1>

      {/* Add New User Form */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Add New User</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="flex-grow min-w-[200px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="flex-grow min-w-[200px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="flex-grow min-w-[200px] px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleAddUser}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Add User
          </button>
        </div>
      </section>

      {/* User List Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {["Name", "Email", "Role", "Active", "Actions", "Activity Logs"].map((title) => (
                <th
                  key={title}
                  className="border border-gray-300 px-4 py-2 text-left text-gray-700"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) =>
              editingUser && (editingUser._id || editingUser.id) === (user._id || user.id) ? (
                <tr key={user._id || user.id} className="bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{user.active ? "Yes" : "No"}</td>
                  <td className="border border-gray-300 px-4 py-2 space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      onClick={() => setShowLogsFor(user._id || user.id)}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={user._id || user.id}
                  className={user.active ? "" : "bg-red-100 text-gray-500"}
                >
                  <td className="border border-gray-300 px-4 py-2">{user.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.role}</td>
                  <td className="border border-gray-300 px-4 py-2">{user.active ? "Yes" : "No"}</td>
                  <td className="border border-gray-300 px-4 py-2 space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(user._id || user.id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                    >
                      {user.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id || user.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      onClick={() => setShowLogsFor(user._id || user.id)}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Activity Logs Modal */}
      {showLogsFor && (
        <div
          onClick={() => setShowLogsFor(null)}
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded shadow-lg max-w-md max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-xl font-semibold mb-4">Activity Logs</h3>
            <button
              onClick={() => setShowLogsFor(null)}
              className="float-right mb-4 text-gray-600 hover:text-gray-900"
            >
              Close
            </button>
            <ul className="list-disc list-inside space-y-1">
              {(users.find((u) => (u._id || u.id) === showLogsFor)?.activityLogs || []).map(
                (log, i) => (
                  <li key={i}>{log}</li>
                )
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
