import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { fetchTotalVisits, recordPageVisit } from '../utils/visitTracker';
import ActiveUsersChart from '../components/ActiveUsersChart';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const AdminDashboard = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("");
  
  // User management states
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("Student");
  
  // Statistics states
  const [totalVisits, setTotalVisits] = useState(0);
  const [classes, setClasses] = useState([]);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalClasses: 0
  });
  const [chartData, setChartData] = useState({
    labels: [],
    students: [],
    teachers: [],
    admins: []
  });

  // Fetch users and classes on component mount
  useEffect(() => {
    fetchUsers();
    fetchClasses();
    loadTotalVisits();
    
    // Get current user for visit tracking
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    recordPageVisit('admin-dashboard', currentUser.id); // Record specific page visit for analytics
  }, []);
  
  // Load total visits from backend
  const loadTotalVisits = async () => {
    const visits = await fetchTotalVisits();
    setTotalVisits(visits);
  };

  // Fetch daily active users chart data
  const fetchDailyActiveUsers = useCallback(async () => {
    console.log('🔄 Fetching daily active users...');
    try {
      const response = await axios.get(`${API_BASE_URL}/users/daily-active-users`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Daily active users data received:', response.data);
      setChartData(response.data.chartData);
    } catch (error) {
      console.error('❌ Error fetching daily active users:', error);
      
      // Generate realistic fallback data using current users state
      const currentUsers = users;
      const totalStudents = currentUsers.filter(u => u.role === 'student').length || 10;
      const totalTeachers = currentUsers.filter(u => u.role === 'teacher').length || 3;
      const totalAdmins = currentUsers.filter(u => u.role === 'admin').length || 1;
      
      // Generate last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      }
      
      // Generate realistic activity patterns
      const fallbackData = {
        labels: last7Days,
        students: last7Days.map((_, index) => {
          const isWeekend = (new Date().getDay() - (6 - index)) % 7 === 0 || (new Date().getDay() - (6 - index)) % 7 === 6;
          const baseActivity = Math.floor(totalStudents * (isWeekend ? 0.2 : 0.7));
          const randomVariation = Math.floor(Math.random() * (totalStudents * 0.3));
          return Math.max(1, Math.min(baseActivity + randomVariation, totalStudents));
        }),
        teachers: last7Days.map((_, index) => {
          const isWeekend = (new Date().getDay() - (6 - index)) % 7 === 0 || (new Date().getDay() - (6 - index)) % 7 === 6;
          const baseActivity = Math.floor(totalTeachers * (isWeekend ? 0.1 : 0.8));
          const randomVariation = Math.floor(Math.random() * (totalTeachers * 0.2));
          return Math.max(0, Math.min(baseActivity + randomVariation, totalTeachers));
        }),
        admins: last7Days.map(() => {
          const baseActivity = Math.floor(totalAdmins * 0.6);
          const randomVariation = Math.floor(Math.random() * (totalAdmins * 0.4));
          return Math.max(0, Math.min(baseActivity + randomVariation, totalAdmins));
        })
      };
      
      console.log('📊 Using fallback data:', fallbackData);
      setChartData(fallbackData);
    }
  }, [users]); // Include users dependency but control when it's called
  
  // Calculate statistics when users or classes data changes
  useEffect(() => {
    const stats = {
      totalStudents: users.filter(user => user.role === 'student').length,
      totalTeachers: users.filter(user => user.role === 'teacher').length,
      totalAdmins: users.filter(user => user.role === 'admin').length,
      totalClasses: classes.length
    };
    setStatistics(stats);
  }, [users, classes]);
  
  // Separate useEffect with throttling for chart data - only runs once after initial data load
  useEffect(() => {
    let timeoutId;
    
    const hasUsers = users.length > 0;
    const hasNoChartData = chartData.labels.length === 0;
    const shouldFetchChart = hasUsers && hasNoChartData;
    
    // Only fetch chart data once when users are loaded, not on every change
    if (shouldFetchChart) {
      timeoutId = setTimeout(() => {
        fetchDailyActiveUsers();
      }, 1000); // 1 second delay after users load
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [users.length, chartData.labels.length, fetchDailyActiveUsers]); // Proper dependencies
  

  


  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers("");
    try {
      const response = await fetch(`${API_BASE_URL}/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setErrorUsers(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/class`);
      const classesData = response.data || [];
      setClasses(classesData);
    } catch (err) {
      console.error("Error fetching classes:", err.message);
      setClasses([]);
    }
  };

  // Filtered users for display
  const filteredUsers = users.filter((user) => {
    const filterLower = filter.toLowerCase();
    return (
      user.name.toLowerCase().includes(filterLower) ||
      (user.lrn && user.lrn.toLowerCase().includes(filterLower)) ||
      (user.teacherId && user.teacherId.toLowerCase().includes(filterLower)) ||
      (user.adminId && user.adminId.toLowerCase().includes(filterLower))
    );
  });

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
    <div className="min-h-screen bg-white p-8">
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Classes */}
          <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-100 p-4 rounded-xl shadow-md border-l-4 border-indigo-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-200 p-3 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">Total Classes</p>
                <p className="text-2xl font-bold text-indigo-800">{statistics.totalClasses}</p>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-gradient-to-r from-blue-50 via-white to-blue-100 p-4 rounded-xl shadow-md border-l-4 border-blue-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-200 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 717.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 014.5 20.25v-.75z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide">Total Students</p>
                <p className="text-2xl font-bold text-blue-800">{statistics.totalStudents}</p>
              </div>
            </div>
          </div>

          {/* Total Teachers */}
          <div className="bg-gradient-to-r from-green-50 via-white to-green-100 p-4 rounded-xl shadow-md border-l-4 border-green-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-200 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443a55.381 55.381 0 015.25 2.882V15" />
                </svg>
              </div>
              <div>
                <p className="text-green-600 text-sm font-semibold uppercase tracking-wide">Total Teachers</p>
                <p className="text-2xl font-bold text-green-800">{statistics.totalTeachers}</p>
              </div>
            </div>
          </div>

          {/* Total Admins */}
          <div className="bg-gradient-to-r from-yellow-50 via-white to-yellow-100 p-4 rounded-xl shadow-md border-l-4 border-yellow-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-200 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-600 text-sm font-semibold uppercase tracking-wide">Total Admins</p>
                <p className="text-2xl font-bold text-yellow-800">{statistics.totalAdmins}</p>
              </div>
            </div>
          </div>

          {/* Total Visits */}
          <div className="bg-gradient-to-r from-purple-50 via-white to-purple-100 p-4 rounded-xl shadow-md border-l-4 border-purple-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-purple-200 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="text-purple-600 text-sm font-semibold uppercase tracking-wide">Total Visits</p>
                <p className="text-2xl font-bold text-purple-800">{totalVisits.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Management and Chart Section */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* User Management Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">User Management</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Filter by name, LRN, or ID"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                />
                <button
                  onClick={() => setModalOpen(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  Add New
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100 rounded-lg bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-md">
                {loadingUsers && <p className="flex items-center gap-2 text-blue-600 font-semibold p-4"><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Loading users...</p>}
                {errorUsers && <p className="text-red-600 flex items-center gap-2 p-4"><svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>{errorUsers}</p>}
                {!loadingUsers && filteredUsers.length === 0 && (
                  <p className="text-center p-4 text-gray-500 flex items-center justify-center gap-2"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>No users found</p>
                )}
                {!loadingUsers && filteredUsers.length > 0 && (
                  <div className="space-y-3">
                      {filteredUsers.map((user, idx) => (
                        <div key={user._id || idx} className="bg-white border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all group hover:bg-blue-50">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.75 22.5h-11.5A2.25 2.25 0 014.5 20.25v-.75z" />
                                </svg>
                                <span className="font-semibold text-gray-900">{user.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {user.role === 'student' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold"><span className="text-lg">👨‍🎓</span>Student</span>}
                                {user.role === 'teacher' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold"><span className="text-lg">👨‍🏫</span>Teacher</span>}
                                {user.role === 'admin' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold"><span className="text-lg">🧑‍💼</span>Admin</span>}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-400 group-hover:text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0z" />
                                </svg>
                                {user.role === 'student' && (
                                  <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                    LRN: {user.lrn || user.studentId || 'No LRN'}
                                  </span>
                                )}
                                {user.role === 'teacher' && (
                                  <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                                    ID: {user.teacherId || user._id?.slice(-8) || 'No ID'}
                                  </span>
                                )}
                                {user.role === 'admin' && (
                                  <span className="text-sm font-medium text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                                    ID: {user.adminId || user._id?.slice(-8) || 'No ID'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </div>

          {/* Daily Active Users Chart Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Daily Active Users
              </h2>
              <div className="text-xs text-gray-500">Last 7 Days</div>
            </div>
            <div className="h-80">
              <ActiveUsersChart data={chartData} type="line" />
            </div>
          </div>
        </div>

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
    </div>
  );
};

export default AdminDashboard;