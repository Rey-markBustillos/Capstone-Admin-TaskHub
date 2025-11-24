import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import '../Css/usermanagement.css'

const UserManagement = () => {
  const [showModal, setShowModal] = useState({ open: false, role: null });
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    lrn: "",
    teacherId: "",
    adminId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/users`);
      setUsers(res.data);
      setError(null);
    } catch {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openModal = (role) => {
    setShowModal({ open: true, role });
    setNewUser({ name: '', email: '', password: '', role, lrn: '', teacherId: '', adminId: '' });
  };

  const closeModal = () => {
    setShowModal({ open: false, role: null });
    setNewUser({ name: '', email: '', password: '', role: 'student', lrn: '', teacherId: '', adminId: '' });
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please enter name, email, and password");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        lrn: newUser.lrn || null,
        teacherId: newUser.teacherId || null,
        adminId: newUser.adminId || null,
      });
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "student",
        lrn: "",
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

  const handleImportExcel = async (e, role = 'student') => {
    const file = e.target.files[0];
    if (!file) {
      setImportError('No file selected.');
      setTimeout(() => setImportError(''), 3000);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (!data.length) {
          setImportError('Excel file is empty.');
          setTimeout(() => setImportError(''), 3000);
          return;
        }
        
        const header = data[0].map(h => h && h.toLowerCase && h.toLowerCase());
        const nameIdx = header.indexOf('name');
        const emailIdx = header.indexOf('email');
        
        if (role === 'student') {
          const lrnIdx = header.indexOf('lrn');
          if (lrnIdx === -1 || nameIdx === -1 || emailIdx === -1) {
            setImportError('Excel must have columns: Name, Email, LRN.');
            setTimeout(() => setImportError(''), 4000);
            return;
          }
          
          // Helper to remove leading zeros
          const stripLeadingZeros = s => String(s).replace(/^0+/, '').trim();
          const existingLRNs = users.filter(u => u.role === 'student' && u.lrn).map(u => stripLeadingZeros(u.lrn));
          const newRows = data.slice(1).filter(row => row[nameIdx] && row[emailIdx] && row[lrnIdx]);
          
          let added = 0, skipped = 0;
          for (const row of newRows) {
            const lrn = stripLeadingZeros(row[lrnIdx]);
            const name = String(row[nameIdx]).trim();
            // Auto-generate password: first 3 letters of name (no spaces, lowercase) + full LRN
            const namePart = name.replace(/\s+/g, '').substring(0, 3).toLowerCase();
            const password = namePart + lrn;
            
            if (!existingLRNs.includes(lrn)) {
              try {
                await axios.post(`${API_BASE_URL}/users`, {
                  name: name,
                  email: row[emailIdx],
                  password: password,
                  role: 'student',
                  lrn: lrn
                });
                added++;
              } catch {
                skipped++;
              }
            } else {
              skipped++;
            }
          }
          
          fetchUsers();
          if (added === 0) {
            setImportError('No new students imported. All LRNs already exist or failed.');
            setTimeout(() => setImportError(''), 4000);
          } else {
            setImportSuccess(`${added} student(s) imported. ${skipped > 0 ? skipped + ' duplicate(s) skipped.' : ''}`);
            setTimeout(() => setImportSuccess(''), 4000);
          }
          
        } else if (role === 'teacher') {
          const teacherIdIdx = header.indexOf('teacherid') || header.indexOf('teacher_id') || header.indexOf('id');
          if (teacherIdIdx === -1 || nameIdx === -1 || emailIdx === -1) {
            setImportError('Excel must have columns: Name, Email, TeacherID (or ID).');
            setTimeout(() => setImportError(''), 4000);
            return;
          }
          
          const existingTeacherIDs = users.filter(u => u.role === 'teacher' && u.teacherId).map(u => u.teacherId);
          const newRows = data.slice(1).filter(row => row[nameIdx] && row[emailIdx] && row[teacherIdIdx]);
          
          let added = 0, skipped = 0;
          for (const row of newRows) {
            const teacherId = String(row[teacherIdIdx]).trim();
            const name = String(row[nameIdx]).trim();
            // Auto-generate password: first 3 letters of name (no spaces, lowercase) + teacher ID
            const namePart = name.replace(/\s+/g, '').substring(0, 3).toLowerCase();
            const password = namePart + teacherId;
            
            if (!existingTeacherIDs.includes(teacherId)) {
              try {
                await axios.post(`${API_BASE_URL}/users`, {
                  name: name,
                  email: row[emailIdx],
                  password: password,
                  role: 'teacher',
                  teacherId: teacherId
                });
                added++;
              } catch {
                skipped++;
              }
            } else {
              skipped++;
            }
          }
          
          fetchUsers();
          if (added === 0) {
            setImportError('No new teachers imported. All Teacher IDs already exist or failed.');
            setTimeout(() => setImportError(''), 4000);
          } else {
            setImportSuccess(`${added} teacher(s) imported. ${skipped > 0 ? skipped + ' duplicate(s) skipped.' : ''}`);
            setTimeout(() => setImportSuccess(''), 4000);
          }
        }
        
      } catch (err) {
        setImportError('Failed to process Excel file.');
        setTimeout(() => setImportError(''), 3000);
        console.error('Excel import error:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      fetchUsers();
      setError(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span className="text-blue-700 text-lg font-semibold">Loading User Management...</span>
    </div>
  );
  
  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-2 sm:p-4 md:p-6 font-sans w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center flex items-center justify-center gap-2">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 717.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 714.5 20.25v-.75z" />
          </svg>
          User Management
        </h1>

        {/* Add User Card Boxes - Compact version at top */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">Add User</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            {/* Compact Student Card */}
            <div className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-white shadow-md rounded-lg p-3 sm:p-4 flex-1 text-center border-2 border-blue-300 hover:shadow-lg transition-all duration-200 group overflow-hidden">
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 group-hover:bg-blue-400 transition-all text-2xl shadow-md border-2 border-white">
                  👨‍🎓
                </span>
              </div>
              <div className="font-bold text-sm text-blue-800 mb-2">Add Student</div>
              <div className="space-y-2">
                <button
                  onClick={() => openModal('student')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-all"
                >
                  Single Add
                </button>
                <label className="block cursor-pointer">
                  <span className="w-full bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-all inline-block">Import Excel</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleImportExcel(e, 'student')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            {/* Compact Teacher Card */}
            <div className="relative bg-gradient-to-br from-green-100 via-green-50 to-white shadow-md rounded-lg p-3 sm:p-4 flex-1 text-center border-2 border-green-300 hover:shadow-lg transition-all duration-200 group overflow-hidden">
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-200 group-hover:bg-green-400 transition-all text-2xl shadow-md border-2 border-white">
                  👨‍🏫
                </span>
              </div>
              <div className="font-bold text-sm text-green-800 mb-2">Add Teacher</div>
              <div className="space-y-2">
                <button
                  onClick={() => openModal('teacher')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-all"
                >
                  Single Add
                </button>
                <label className="block cursor-pointer">
                  <span className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-all inline-block">Import Excel</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleImportExcel(e, 'teacher')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            
            {/* Compact Admin Card */}
            <div className="relative bg-gradient-to-br from-yellow-100 via-yellow-50 to-white shadow-md rounded-lg p-3 sm:p-4 flex-1 text-center border-2 border-yellow-300 hover:shadow-lg transition-all duration-200 group overflow-hidden">
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-200 group-hover:bg-yellow-400 transition-all text-2xl shadow-md border-2 border-white">
                  🧑‍💼
                </span>
              </div>
              <div className="font-bold text-sm text-yellow-800 mb-2">Add Admin</div>
              <div className="space-y-2">
                <button
                  onClick={() => openModal('admin')}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1 rounded transition-all"
                >
                  Single Add
                </button>
              </div>
            </div>
          </div>
          
          {/* Import Messages */}
          {(importError || importSuccess) && (
            <div className="mb-4">
              {importError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm animate-pulse mb-2">
                  {importError}
                </div>
              )}
              {importSuccess && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded text-sm animate-pulse">
                  {importSuccess}
                </div>
              )}
            </div>
          )}
        </section>

        {/* User List Table */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">User List</h2>
          <div className="mb-3 flex flex-wrap gap-2 items-center">
            <label className="font-medium text-gray-700">Filter by Role:</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="overflow-x-auto w-full max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
            <table className="min-w-[600px] w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-gradient-to-r from-blue-200 via-green-100 to-yellow-100">
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Name</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Email</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Role</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">LRN/ID</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(user => roleFilter === 'all' ? true : user.role === roleFilter)
                  .map((user, idx) => (
                    <tr key={user._id || user.id} className={"transition-all " + (idx % 2 === 1 ? "bg-gray-50" : "bg-white") + " hover:bg-blue-50"}>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 align-middle font-medium text-gray-900 break-words max-w-[120px] sm:max-w-none">{user.name}</td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 align-middle text-gray-700 break-words max-w-[140px] sm:max-w-none">{user.email}</td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 align-middle">
                        <span className={
                          user.role === 'student' ? "inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold" :
                          user.role === 'teacher' ? "inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold" :
                          "inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold"
                        }>
                          {user.role === 'student' && <span className="text-lg">👨‍🎓</span>}
                          {user.role === 'teacher' && <span className="text-lg">👨‍🏫</span>}
                          {user.role === 'admin' && <span className="text-lg">🧑‍💼</span>}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 align-middle text-gray-700">
                        {user.role === 'student' ? (user.lrn || 'N/A') : 
                         user.role === 'teacher' ? (user.teacherId || 'N/A') : 
                         (user.adminId || 'N/A')}
                      </td>
                      <td className="px-2 sm:px-5 py-2 sm:py-3 align-middle">
                        <button
                          className="inline-block bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-300 text-xs sm:text-sm"
                          onClick={() => handleDeleteUser(user._id || user.id)}
                        >
                          <span className="inline-flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal for Add User */}
        {showModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10 px-2 sm:px-0">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-sm relative">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl" onClick={closeModal}>&times;</button>
              <h3 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
                {showModal.role === 'student' && <span className="text-2xl">👨‍🎓</span>}
                {showModal.role === 'teacher' && <span className="text-2xl">👨‍🏫</span>}
                {showModal.role === 'admin' && <span className="text-2xl">🧑‍💼</span>}
                Register {showModal.role.charAt(0).toUpperCase() + showModal.role.slice(1)}
              </h3>
              <form onSubmit={e => { e.preventDefault(); handleAddUser(); closeModal(); }}>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 717.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 714.5 20.25v-.75z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Name"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    className="block w-full pl-10 px-3 py-2 border border-blue-300 bg-blue-50 rounded focus:border-blue-500 focus:bg-white transition"
                    required
                  />
                </div>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v2.25m0 0a2.25 2.25 0 01-2.25-2.25h4.5A2.25 2.25 0 0112 18.75z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    className="block w-full pl-10 px-3 py-2 border border-green-300 bg-green-50 rounded focus:border-green-500 focus:bg-white transition"
                    required
                  />
                </div>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0v6.75A2.25 2.25 0 0114.25 19.5h-4.5A2.25 2.25 0 717.5 17.25V10.5m9 0H7.5" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="block w-full pl-10 px-3 py-2 border border-yellow-300 bg-yellow-50 rounded focus:border-yellow-500 focus:bg-white transition"
                    required
                  />
                </div>
                {showModal.role === 'student' && (
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5v-2.25A2.25 2.25 0 0014.25 3h-4.5A2.25 2.25 0 007.5 5.25V7.5m9 0v9.75A2.25 2.25 0 0114.25 19.5h-4.5A2.25 2.25 0 717.5 17.25V7.5m9 0H7.5m9 0a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0116.5 19.5h-9A2.25 2.25 0 015.25 17.25v-7.5A2.25 2.25 0 017.5 7.5" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="LRN"
                      value={newUser.lrn}
                      onChange={e => setNewUser({ ...newUser, lrn: e.target.value })}
                      className="block w-full pl-10 px-3 py-2 border border-blue-300 bg-blue-50 rounded focus:border-blue-500 focus:bg-white transition"
                    />
                  </div>
                )}
                {showModal.role === 'teacher' && (
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 text-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Teacher ID"
                      value={newUser.teacherId}
                      onChange={e => setNewUser({ ...newUser, teacherId: e.target.value })}
                      className="block w-full pl-10 px-3 py-2 border border-purple-300 bg-purple-50 rounded focus:border-purple-500 focus:bg-white transition"
                      required
                    />
                  </div>
                )}
                {showModal.role === 'admin' && (
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 text-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Admin ID"
                      value={newUser.adminId}
                      onChange={e => setNewUser({ ...newUser, adminId: e.target.value })}
                      className="block w-full pl-10 px-3 py-2 border border-orange-300 bg-orange-50 rounded focus:border-orange-500 focus:bg-white transition"
                      required
                    />
                  </div>
                )}
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Register</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
