import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { showAlert, showConfirm, showPrompt } from '../utils/swal';
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
  const [roleSort, setRoleSort] = useState('admin-teacher-student');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    lrn: '',
    teacherId: '',
    adminId: '',
  });
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/users`);
      setUsers(res.data);
      setSelectedUserIds((prev) => prev.filter((id) => res.data.some((user) => (user._id || user.id) === id)));
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

  const openEditModal = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      lrn: user.lrn || '',
      teacherId: user.teacherId || '',
      adminId: user.adminId || '',
    });
  };

  const closeEditModal = () => {
    setEditUser(null);
    setEditForm({
      name: '',
      email: '',
      lrn: '',
      teacherId: '',
      adminId: '',
    });
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      await showAlert('warning', 'Missing Fields', 'Please enter name, email, and password');
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
      await showAlert('error', 'Add User Failed', err.response?.data?.message || 'Failed to add user');
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
    const confirmed = await showConfirm('Delete User?', 'Are you sure you want to delete this user?');
    if (!confirmed) return;
    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      setSelectedUserIds((prev) => prev.filter((selectedId) => selectedId !== id));
      fetchUsers();
      setError(null);
    } catch (err) {
      await showAlert('error', 'Delete Failed', err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      await showAlert('warning', 'Missing Fields', 'Please enter name and email.');
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      lrn: editUser.role === 'student' ? (editForm.lrn.trim() || null) : null,
      teacherId: editUser.role === 'teacher' ? (editForm.teacherId.trim() || null) : null,
      adminId: editUser.role === 'admin' ? (editForm.adminId.trim() || null) : null,
    };

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/users/${editUser._id || editUser.id}`, payload);
      await fetchUsers();
      closeEditModal();
      await showAlert('success', 'User Updated', `${payload.name} was updated successfully.`);
    } catch (err) {
      await showAlert('error', 'Update Failed', err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedPassword = (user) => {
    const namePart = String(user.name || '')
      .replace(/\s+/g, '')
      .substring(0, 3)
      .toLowerCase();

    if (user.role === 'student') return `${namePart}${user.lrn || ''}`;
    if (user.role === 'teacher') return `${namePart}${user.teacherId || ''}`;
    if (user.role === 'admin') return `${namePart}${user.adminId || ''}`;

    return namePart;
  };

  const handleForgotPassword = async (user) => {
    const suggestedPassword = getSuggestedPassword(user);
    const newPassword = await showPrompt(
      'Reset Password',
      `Enter a new password for ${user.name}.`,
      {
        inputLabel: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} password`,
        inputPlaceholder: 'Enter new password',
        inputValue: suggestedPassword,
        confirmButtonText: 'Reset Password',
        required: true,
      }
    );

    if (newPassword === null) return;

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/users/${user._id || user.id}`, {
        password: newPassword,
      });
      await showAlert('success', 'Password Reset', `Password updated for ${user.name}.`);
    } catch (err) {
      await showAlert('error', 'Reset Failed', err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const visibleUsers = users.filter(user => roleFilter === 'all' ? true : user.role === roleFilter);
  const roleSortOrders = {
    'admin-teacher-student': { admin: 0, teacher: 1, student: 2 },
    'student-teacher-admin': { student: 0, teacher: 1, admin: 2 },
  };
  const sortedUsers = [...visibleUsers].sort((a, b) => {
    const activeOrder = roleSortOrders[roleSort] || roleSortOrders['admin-teacher-student'];
    const roleDiff = (activeOrder[a.role] ?? 99) - (activeOrder[b.role] ?? 99);
    if (roleDiff !== 0) return roleDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
  const selectableVisibleUsers = visibleUsers.filter(user => ['student', 'teacher'].includes(user.role));
  const selectableVisibleUserIds = selectableVisibleUsers.map(user => user._id || user.id);
  const areAllSelectableVisibleUsersSelected =
    selectableVisibleUserIds.length > 0 &&
    selectableVisibleUserIds.every((id) => selectedUserIds.includes(id));

  const toggleUserSelection = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleToggleSelectAllUsers = () => {
    if (!isSelectionMode) return;
    if (selectableVisibleUserIds.length === 0) return;

    setSelectedUserIds((prev) => {
      if (areAllSelectableVisibleUsersSelected) {
        return prev.filter((id) => !selectableVisibleUserIds.includes(id));
      }

      return Array.from(new Set([...prev, ...selectableVisibleUserIds]));
    });
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) {
      await showAlert('warning', 'No Users Selected', 'Select student or teacher accounts first.');
      return;
    }

    const selectedSelectableUsers = users.filter((user) =>
      selectedUserIds.includes(user._id || user.id) && ['student', 'teacher'].includes(user.role)
    );

    if (selectedSelectableUsers.length === 0) {
      await showAlert('warning', 'Invalid Selection', 'Only student and teacher accounts can be bulk deleted.');
      return;
    }

    const confirmed = await showConfirm(
      'Delete Selected Users?',
      `Delete ${selectedSelectableUsers.length} selected user(s)?`,
      { confirmButtonText: 'Delete Selected' }
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      await Promise.all(
        selectedSelectableUsers.map((user) => axios.delete(`${API_BASE_URL}/users/${user._id || user.id}`))
      );
      setSelectedUserIds([]);
      await fetchUsers();
      await showAlert('success', 'Users Deleted', `${selectedSelectableUsers.length} user(s) deleted successfully.`);
    } catch (err) {
      await showAlert('error', 'Bulk Delete Failed', err.response?.data?.message || 'Failed to delete selected users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      if (prev) {
        setSelectedUserIds([]);
      }
      return !prev;
    });
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
    <div className="min-h-full bg-white p-4 sm:p-8 pt-16 md:pt-8 font-sans w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center flex items-center justify-center gap-2">
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 0 1 4.5 20.25v-.75z" />
          </svg>
          User Management
        </h1>

        {/* Add User Card Boxes - Compact version at top */}
        <section className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3">Add User</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            {/* Compact Student Card */}
            <div className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-white shadow-md rounded-lg p-3 sm:p-4 flex-1 text-center border-2 border-blue-300 hover:scale-105 hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer"
                 onClick={() => openModal('student')}>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 group-hover:bg-blue-400 transition-all text-2xl shadow-md border-2 border-white">
                  👨‍🎓
                </span>
              </div>
              <div className="font-bold text-sm text-blue-800 mb-1">Add Student</div>
              <div className="text-gray-500 text-xs">Register student</div>
            </div>
            
            {/* Compact Teacher Card */}
            <div className="relative bg-gradient-to-br from-green-100 via-green-50 to-white shadow-md rounded-lg p-3 sm:p-4 flex-1 text-center border-2 border-green-300 hover:scale-105 hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer"
                 onClick={() => openModal('teacher')}>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-200 group-hover:bg-green-400 transition-all text-2xl shadow-md border-2 border-white">
                  👨‍🏫
                </span>
              </div>
              <div className="font-bold text-sm text-green-800 mb-1">Add Teacher</div>
              <div className="text-gray-500 text-xs">Register teacher</div>
            </div>
            
            {/* Compact Admin Card */}
            <div className="relative bg-gradient-to-br from-yellow-100 via-yellow-50 to-white shadow-md rounded-lg p-3 sm:p-4 flex-1 text-center border-2 border-yellow-300 hover:scale-105 hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer"
                 onClick={() => openModal('admin')}>
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-200 group-hover:bg-yellow-400 transition-all text-2xl shadow-md border-2 border-white">
                  🧑‍💼
                </span>
              </div>
              <div className="font-bold text-sm text-yellow-800 mb-1">Add Admin</div>
              <div className="text-gray-500 text-xs">Register admin</div>
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
            <label className="font-medium text-gray-700">Sort:</label>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={roleSort}
              onChange={e => setRoleSort(e.target.value)}
            >
              <option value="admin-teacher-student">Admin, Teacher, Student</option>
              <option value="student-teacher-admin">Student, Teacher, Admin</option>
            </select>
            <button
              type="button"
              className={`${isSelectionMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors`}
              onClick={handleToggleSelectionMode}
            >
              {isSelectionMode ? 'Cancel Select' : 'Select'}
            </button>
            {isSelectionMode && (
              <>
                <button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors disabled:opacity-60"
                  onClick={handleBulkDeleteUsers}
                  disabled={selectedUserIds.length === 0}
                >
                  Delete Selected
                </button>
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-sm font-semibold transition-colors disabled:opacity-60"
                  onClick={() => setSelectedUserIds([])}
                  disabled={selectedUserIds.length === 0}
                >
                  Clear Selected
                </button>
                <span className="text-sm text-gray-600">
                  {selectedUserIds.length} selected
                </span>
              </>
            )}
          </div>
          <div className="overflow-x-auto w-full max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
            <table className="min-w-[600px] w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="bg-gradient-to-r from-blue-200 via-green-100 to-yellow-100">
                  {isSelectionMode && (
                    <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">
                      <input
                        type="checkbox"
                        checked={areAllSelectableVisibleUsersSelected}
                        onChange={handleToggleSelectAllUsers}
                        disabled={selectableVisibleUserIds.length === 0}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        aria-label="Select all students and teachers"
                      />
                    </th>
                  )}
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Name</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Email</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Role</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">LRN/ID</th>
                  <th className="px-2 sm:px-5 py-2 sm:py-3 text-left text-gray-700 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers
                  .map((user, idx) => (
                    <tr key={user._id || user.id} className={"transition-all " + (idx % 2 === 1 ? "bg-gray-50" : "bg-white") + " hover:bg-blue-50"}>
                      {isSelectionMode && (
                        <td className="px-2 sm:px-5 py-2 sm:py-3 align-middle">
                          {['student', 'teacher'].includes(user.role) ? (
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(user._id || user.id)}
                              onChange={() => toggleUserSelection(user._id || user.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              aria-label={`Select ${user.name}`}
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )}
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
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="inline-block bg-amber-500 hover:bg-amber-600 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-300 text-xs sm:text-sm"
                            onClick={() => openEditModal(user)}
                          >
                            <span className="inline-flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" /></svg>
                              Edit
                            </span>
                          </button>
                          <button
                            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs sm:text-sm"
                            onClick={() => handleForgotPassword(user)}
                          >
                            <span className="inline-flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V9a5 5 0 00-10 0v2H6a2 2 0 00-2 2v6a2 2 0 002 2zm3-10V9a3 3 0 116 0v2H9z" /></svg>
                              Forgot Password
                            </span>
                          </button>
                          <button
                            className="inline-block bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-300 text-xs sm:text-sm"
                            onClick={() => handleDeleteUser(user._id || user.id)}
                          >
                            <span className="inline-flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              Delete
                            </span>
                          </button>
                        </div>
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
                {/* Import Excel button for Student */}
                {showModal.role === 'student' && (
                  <div className="mb-4 text-center">
                    <label className="inline-block cursor-pointer">
                      <span className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded transition-all inline-block">📊 Import Excel</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => handleImportExcel(e, 'student')}
                        className="hidden"
                      />
                    </label>
                    <div className="text-xs text-gray-500 mt-1">Or fill form below for single add</div>
                  </div>
                )}
                {/* Import Excel button for Teacher */}
                {showModal.role === 'teacher' && (
                  <div className="mb-4 text-center">
                    <label className="inline-block cursor-pointer">
                      <span className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded transition-all inline-block">📊 Import Excel</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => handleImportExcel(e, 'teacher')}
                        className="hidden"
                      />
                    </label>
                    <div className="text-xs text-gray-500 mt-1">Or fill form below for single add</div>
                  </div>
                )}
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 text-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 0 1 4.5 20.25v-.75z" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75A2.25 2.25 0 0014.25 4.5h-4.5A2.25 2.25 0 007.5 6.75v3.75m9 0v6.75A2.25 2.25 0 0114.25 19.5h-4.5A2.25 2.25 0 0 1 7.5 17.25V10.5m9 0H7.5" />
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5v-2.25A2.25 2.25 0 0014.25 3h-4.5A2.25 2.25 0 007.5 5.25V7.5m9 0v9.75A2.25 2.25 0 0114.25 19.5h-4.5A2.25 2.25 0 0 1 7.5 17.25V7.5m9 0H7.5m9 0a2.25 2.25 0 012.25 2.25v7.5A2.25 2.25 0 0116.5 19.5h-9A2.25 2.25 0 015.25 17.25v-7.5A2.25 2.25 0 0 1 7.5 7.5" />
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

        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10 px-2 sm:px-0">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-sm relative">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl" onClick={closeEditModal}>&times;</button>
              <h3 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">
                  {editUser.role === 'student' ? '👨‍🎓' : editUser.role === 'teacher' ? '👨‍🏫' : '🧑‍💼'}
                </span>
                Edit {editUser.role.charAt(0).toUpperCase() + editUser.role.slice(1)}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="block w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded focus:border-blue-500 focus:bg-white transition"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="block w-full px-3 py-2 border border-green-300 bg-green-50 rounded focus:border-green-500 focus:bg-white transition"
                  required
                />
                {editUser.role === 'student' && (
                  <input
                    type="text"
                    placeholder="LRN"
                    value={editForm.lrn}
                    onChange={e => setEditForm({ ...editForm, lrn: e.target.value })}
                    className="block w-full px-3 py-2 border border-blue-300 bg-blue-50 rounded focus:border-blue-500 focus:bg-white transition"
                  />
                )}
                {editUser.role === 'teacher' && (
                  <input
                    type="text"
                    placeholder="Teacher ID"
                    value={editForm.teacherId}
                    onChange={e => setEditForm({ ...editForm, teacherId: e.target.value })}
                    className="block w-full px-3 py-2 border border-purple-300 bg-purple-50 rounded focus:border-purple-500 focus:bg-white transition"
                  />
                )}
                {editUser.role === 'admin' && (
                  <input
                    type="text"
                    placeholder="Admin ID"
                    value={editForm.adminId}
                    onChange={e => setEditForm({ ...editForm, adminId: e.target.value })}
                    className="block w-full px-3 py-2 border border-orange-300 bg-orange-50 rounded focus:border-orange-500 focus:bg-white transition"
                  />
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="w-full bg-amber-500 text-white py-2 rounded hover:bg-amber-600 transition"
                    onClick={handleEditUser}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default UserManagement;
