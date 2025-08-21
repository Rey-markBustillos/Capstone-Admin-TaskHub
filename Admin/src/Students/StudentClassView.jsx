import { FaArrowLeft } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import axios from 'axios';
import { NavLink, useLocation } from 'react-router-dom';
import { FaBullhorn, FaTasks, FaUsers } from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5000/api';

const StudentClassView = () => {
  const { classId } = useParams();
  const location = useLocation();
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/class/${classId}`);
        setSelectedClass(res.data);
      } catch {
        setError('Failed to fetch class details.');
      } finally {
        setLoading(false);
      }
    };
    fetchClassDetails();
  }, [classId]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading class details...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  // removed duplicate useLocation
  // Show card navigation if on index or on an unknown/empty nested route
  const validRoutes = [
    `/student/class/${classId}`,
    `/student/class/${classId}/`,
    `/student/class/${classId}/announcements`,
    `/student/class/${classId}/activities`,
    `/student/class/${classId}/classlist`,
  ];
  const isIndex =
    location.pathname === `/student/class/${classId}` ||
    location.pathname === `/student/class/${classId}/` ||
    !validRoutes.includes(location.pathname);

  return (
    <div className="h-screen overflow-y-auto">
      {/* Class Details */}
      {selectedClass && (
  <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-900 text-white px-2 py-0.5 text-base flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-0.5 sm:gap-1 rounded-b-sm shadow-xl border-b-4 border-indigo-900 overflow-hidden
  transition-all duration-[3000ms] animate-fade-in-down" style={{animationDelay:'0.05s', animationDuration:'3s'}}>
          {/* Decorative blob or icon on the right */}
          <div className="hidden sm:block absolute right-0 top-0 h-full w-60 pointer-events-none select-none z-0">
            {/* Main dark blob */}
            <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <ellipse cx="120" cy="50" rx="60" ry="40" fill="url(#darkgrad1)" />
              <defs>
                <linearGradient id="darkgrad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
            </svg>
            {/* Soft blurred glow */}
            <div className="absolute top-8 right-10 w-24 h-24 rounded-full bg-pink-400 opacity-30 blur-2xl"></div>
            {/* Extra accent ring */}
            <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-2 right-16 w-10 h-10 opacity-30">
              <circle cx="25" cy="25" r="20" stroke="#f472b6" strokeWidth="4" fill="none" />
            </svg>
            {/* Small blue dot */}
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-4 right-4 w-4 h-4">
              <circle cx="10" cy="10" r="8" fill="#38bdf8" opacity="0.5" />
            </svg>
            {/* Accent circle */}
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-2 right-8 w-12 h-12 rotate-12 opacity-40">
              <circle cx="30" cy="30" r="28" fill="url(#accentgrad)" />
              <defs>
                <linearGradient id="accentgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </svg>
            {/* Subtle grid pattern */}
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-4 right-10 w-16 h-16 opacity-10">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#fff" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="80" height="80" fill="url(#grid)" />
            </svg>
            {/* Extra accent ellipse */}
            <svg viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-8 right-0 w-10 h-5 opacity-30">
              <ellipse cx="20" cy="10" rx="18" ry="8" fill="#f472b6" />
            </svg>
          </div>
          {/* Welcome message */}
          <div className="w-full mb-2 flex items-center gap-3">
            <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-3 rounded-full shadow-lg ring-2 ring-yellow-200/40 flex items-center justify-center">
              <FaBullhorn className="text-white text-2xl" />
            </span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-wide drop-shadow">Welcome <span className="text-yellow-200">{getStudentName()}</span> to <span className="text-yellow-200">{selectedClass.className}</span>!</span>
          </div>
          <div className="flex flex-col gap-2 mt-2 ml-2">
            <div><strong className="text-lg">Teacher:</strong> <span className="font-bold">{selectedClass.teacherName || (selectedClass.teacher && selectedClass.teacher.name) || 'N/A'}</span></div>
            <div><strong className="text-lg">Schedule:</strong> <span className="font-bold">{selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</span></div>
            <div><strong className="text-lg">Room:</strong> <span className="font-bold">{selectedClass.roomNumber || 'N/A'}</span></div>
          </div>
        </div>
)}

<main className="p-4 md:p-8">
  {isIndex ? (
    <>
  <div className="mb-8 transition-all duration-[3000ms] animate-fade-in-up" style={{animationDelay:'0.15s', animationDuration:'3s'}}>
        <NavLink
          to="/studentportal"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-4"
        >
          <FaArrowLeft /> Back to My Classes
        </NavLink>
      </div>
      <div className="flex flex-col md:flex-row gap-8 justify-center items-center mt-4">
        <NavLink
          to={`announcements`}
          className="group flex flex-col items-center justify-center w-[220px] h-[200px] rounded-3xl shadow-2xl transition-all duration-[3000ms] animate-fade-in-up border-2 cursor-pointer bg-gradient-to-br from-yellow-100 via-pink-100 to-white border-yellow-300 text-yellow-900 hover:bg-yellow-50 hover:scale-105"
          style={{ textDecoration: 'none', animationDelay: '0.2s', animationDuration: '3s' }}
        >
          <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-5 rounded-full shadow-lg ring-2 ring-yellow-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaBullhorn className="text-white text-4xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Announcements</span>
        </NavLink>
        <NavLink
          to={`activities`}
          className="group flex flex-col items-center justify-center w-[220px] h-[200px] rounded-3xl shadow-2xl transition-all duration-[3000ms] animate-fade-in-up border-2 cursor-pointer bg-gradient-to-br from-blue-100 via-cyan-100 to-white border-blue-300 text-blue-900 hover:bg-blue-50 hover:scale-105"
          style={{ textDecoration: 'none', animationDelay: '0.3s', animationDuration: '3s' }}
        >
          <span className="bg-gradient-to-tr from-blue-400 via-cyan-400 to-indigo-400 p-5 rounded-full shadow-lg ring-2 ring-blue-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaTasks className="text-white text-4xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Activities</span>
        </NavLink>
        <NavLink
          to={`classlist`}
          className="group flex flex-col items-center justify-center w-[220px] h-[200px] rounded-3xl shadow-2xl transition-all duration-[3000ms] animate-fade-in-up border-2 cursor-pointer bg-gradient-to-br from-green-100 via-teal-100 to-white border-green-300 text-green-900 hover:bg-green-50 hover:scale-105"
          style={{ textDecoration: 'none', animationDelay: '0.4s', animationDuration: '3s' }}
        >
          <span className="bg-gradient-to-tr from-green-400 via-teal-400 to-blue-400 p-5 rounded-full shadow-lg ring-2 ring-green-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaUsers className="text-white text-4xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Class List</span>
        </NavLink>
      </div>
    </>
  ) : (
    <Outlet />
  )}
</main>
    </div>
  );
};

export default StudentClassView;

// Helper to get student name from localStorage
function getStudentName() {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return 'Student';
  try {
    const user = JSON.parse(storedUser);
    return user && user.name ? user.name : 'Student';
  } catch {
    return 'Student';
  }
}