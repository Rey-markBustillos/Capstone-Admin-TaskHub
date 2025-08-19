import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Css/usermanagement.css";

const API_BASE = "http://localhost:5000/api/users";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    studentId: "",
    teacherId: "",
    adminId: "",
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
      await axios.post(API_BASE, {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        studentId: newUser.studentId || null,
        teacherId: newUser.teacherId || null,
        adminId: newUser.adminId || null,
      });
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "student",
        studentId: "",
        teacherId: "",
        adminId: "",
      });
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
      fetchUsers();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
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
    <div className="w-450 h-190">
    <div className="max-w-5xl ml-20 mx-auto p-6 font-sans">
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
            className="flex-grow min-w-[200px] px-3 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="flex-grow min-w-[200px] px-3 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="flex-grow min-w-[200px] px-3 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="px-3 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          {newUser.role === "student" && (
            <input
              type="text"
              placeholder="Student ID"
              value={newUser.studentId}
              onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
              className="flex-grow min-w-[200px] px-3 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {newUser.role === "teacher" && (
            <input
              type="text"
              placeholder="Teacher ID"
              value={newUser.teacherId}
              onChange={(e) => setNewUser({ ...newUser, teacherId: e.target.value })}
              className="flex-grow min-w-[200px] px-3 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          {newUser.role === "admin" && (
            <input
              type="text"
              placeholder="Admin ID"
              value={newUser.adminId}
              onChange={(e) => setNewUser({ ...newUser, adminId: e.target.value })}
              className="flex-grow min-w-[200px] px-3 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
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
        <table className="w-full border-collapse border border-gray-600">
          <thead className="bg-gray-100">
            <tr>
              {["Name", "Email", "Role", "Active", "Actions"].map((title) => (
                <th
                  key={title}
                  className="border border-gray-600 px-4 py-2 text-left text-gray-700"
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
                  <td className="border border-gray-600 px-4 py-2">
                    <input
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-600 rounded"
                    />
                  </td>
                  <td className="border border-gray-600 px-4 py-2">
                    <input
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-600 rounded"
                    />
                  </td>
                  <td className="border border-gray-600 px-4 py-2">
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-600 rounded"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="border border-gray-600 px-4 py-2">
                    {user.active ? "Yes" : "No"}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 space-x-2">
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
                </tr>
              ) : (
                <tr key={user._id || user.id}>
                  <td className="border border-gray-600 px-4 py-2">{user.name}</td>
                  <td className="border border-gray-600 px-4 py-2">{user.email}</td>
                  <td className="border border-gray-600 px-4 py-2">{user.role}</td>
                  <td className="border border-gray-600 px-4 py-2">
                    {user.active ? "Yes" : "No"}
                  </td>
                  <td className="border border-gray-600 px-4 py-2 space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id || user.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
     </div>
    </div>
  );
};

export default UserManagement;
