import { FaArrowLeft } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
// Falling books animation component (copied from StudentPortal)
const FallingBooksAnimation = () => (
  <>
    <div className="falling-book" style={{ left: '5vw', animationDuration: '7s', animationDelay: '0s' }}>📚</div>
    <div className="falling-book" style={{ left: '20vw', animationDuration: '9s', animationDelay: '2s' }}>📚</div>
    <div className="falling-book" style={{ left: '35vw', animationDuration: '6s', animationDelay: '4s' }}>📚</div>
    <div className="falling-book" style={{ left: '50vw', animationDuration: '8s', animationDelay: '1s' }}>📚</div>
    <div className="falling-book" style={{ left: '65vw', animationDuration: '10s', animationDelay: '3s' }}>📚</div>
    <div className="falling-book" style={{ left: '80vw', animationDuration: '7.5s', animationDelay: '5s' }}>📚</div>
    <div className="falling-book" style={{ left: '90vw', animationDuration: '8.5s', animationDelay: '6s' }}>📚</div>
  </>
);
import { useParams, Outlet } from 'react-router-dom';
import axios from 'axios';
import { NavLink, useLocation } from 'react-router-dom';
import { FaBullhorn, FaTasks, FaUsers, FaChalkboardTeacher, FaClock, FaDoorOpen, FaCalendarCheck } from 'react-icons/fa';
import { FaQuestionCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

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
    `/student/class/${classId}/attendance`,
    `/student/class/${classId}/announcements`,
    `/student/class/${classId}/activities`,
    `/student/class/${classId}/quiz`,
    `/student/class/${classId}/classlist`,
  ];
  const isIndex =
    location.pathname === `/student/class/${classId}` ||
    location.pathname === `/student/class/${classId}/` ||
    !validRoutes.includes(location.pathname);

  return (
    <div className="h-screen overflow-y-auto hide-scrollbar relative bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900">
      {/* Decorative scroll background (matches StudentPortal) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="w-full h-full absolute inset-0 blur-3xl opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="scrollbg1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#18181b" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <ellipse cx="600" cy="250" rx="320" ry="60" fill="url(#scrollbg1)" />
          </svg>
        </div>
      </div>
      {/* Falling books animation (matches StudentPortal, only on index view) */}
      {isIndex && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <FallingBooksAnimation />
        </div>
      )}
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
          <div className="w-full mb-2 flex items-center gap-3 pl-4 sm:pl-8">
            <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-3 rounded-full shadow-lg ring-2 ring-yellow-200/40 flex items-center justify-center">
              <FaBullhorn className="text-white text-2xl" />
            </span>
            <span className="text-xl sm:text-2xl font-extrabold tracking-wide drop-shadow">Welcome <span className="text-yellow-200">{getStudentName()}</span> to <span className="text-yellow-200">{selectedClass.className}</span>!</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-2 ml-4 sm:ml-12 relative">
            {/* Decorative dark glassy background */}
            <div className="absolute inset-0 -z-1 rounded-2xl bg-gradient-to-br from-gray-900/80 via-indigo-900/70 to-blue-900/80 backdrop-blur-md shadow-2xl border border-indigo-900/40" style={{filter:'blur(0.5px)'}} />
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 shadow-inner relative z-10">
              <FaChalkboardTeacher className="text-yellow-300 text-lg" />
              <span className="font-semibold text-base text-yellow-100 drop-shadow">Teacher:</span>
              <span className="font-bold text-white text-base">{selectedClass.teacherName || (selectedClass.teacher && selectedClass.teacher.name) || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 shadow-inner relative z-10">
              <FaClock className="text-blue-300 text-lg" />
              <span className="font-semibold text-base text-blue-100 drop-shadow">Schedule:</span>
              <span className="font-bold text-white text-base">{selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 shadow-inner relative z-10">
              <FaDoorOpen className="text-pink-300 text-lg" />
              <span className="font-semibold text-base text-pink-100 drop-shadow">Room:</span>
              <span className="font-bold text-white text-base">{selectedClass.roomNumber || 'N/A'}</span>
            </div>
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
  <div className="relative w-full mt-4">
    {/* Cardbox background */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gray-900/80 via-indigo-900/70 to-blue-900/80 backdrop-blur-xl shadow-2xl border border-indigo-900/40 z-0" />
    <div className="flex flex-col gap-8 justify-center items-center relative z-10 p-6">
  <NavLink
          to={`attendance`}
          className="group flex flex-col items-center justify-center w-full h-[120px] rounded-3xl shadow-2xl transition-all duration-300 animate-fade-in-up border-4 border-indigo-700/70 border-dashed cursor-pointer bg-gradient-to-br from-gray-900 via-indigo-900 to-slate-900 text-white hover:bg-gray-900/80 hover:scale-102 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.15s', animationDuration: '3s' }}
        >
          {/* Glassy gradient overlay */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{background: 'linear-gradient(120deg,rgba(30,30,60,0.22) 0%,rgba(30,30,60,0.12) 100%)'}}></div>
          {/* Inner shadow */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{boxShadow:'inset 0 4px 24px 0 rgba(0,0,0,0.08)'}}></div>
          {/* Animated floating SVG */}
          <svg className="absolute left-10 top-0 w-16 h-16 opacity-20 animate-pulse-slow" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#a78bfa" /></svg>
          {/* Accent bar */}
          <div className="absolute left-0 top-0 h-full w-2 bg-purple-400 rounded-l-3xl shadow-md"></div>
          <svg className="absolute left-0 top-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots0" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#a78bfa" />
              </pattern>
            </defs>
            <rect width="400" height="120" fill="url(#dots0)" />
          </svg>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 bg-purple-200 rounded-full blur-2xl opacity-30"></div>
          <span className="bg-gradient-to-tr from-purple-400 via-indigo-400 to-pink-400 p-3 rounded-full shadow-lg ring-2 ring-purple-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaCalendarCheck className="text-white text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Attendance</span>
        </NavLink>
  <NavLink
          to={`announcements`}
          className="group flex flex-col items-center justify-center w-full h-[120px] rounded-3xl shadow-2xl transition-all duration-300 animate-fade-in-up border-4 border-indigo-700/70 border-dashed cursor-pointer bg-gradient-to-br from-gray-900 via-indigo-900 to-slate-900 text-white hover:bg-gray-900/80 hover:scale-102 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.2s', animationDuration: '3s' }}
        >
          {/* Glassy gradient overlay */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{background: 'linear-gradient(120deg,rgba(30,30,30,0.22) 0%,rgba(30,30,30,0.12) 100%)'}}></div>
          {/* Inner shadow */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{boxShadow:'inset 0 4px 24px 0 rgba(0,0,0,0.08)'}}></div>
          {/* Animated floating SVG */}
          <svg className="absolute left-10 top-0 w-16 h-16 opacity-20 animate-pulse-slow" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#fbbf24" /></svg>
          {/* Accent bar */}
          <div className="absolute left-0 top-0 h-full w-2 bg-yellow-400 rounded-l-3xl shadow-md"></div>
          <svg className="absolute left-0 top-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#fbbf24" />
              </pattern>
            </defs>
            <rect width="400" height="120" fill="url(#dots1)" />
          </svg>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 bg-pink-200 rounded-full blur-2xl opacity-30"></div>
          <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-3 rounded-full shadow-lg ring-2 ring-yellow-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaBullhorn className="text-white text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Announcements</span>
        </NavLink>
  <NavLink
          to={`activities`}
          className="group flex flex-col items-center justify-center w-full h-[120px] rounded-3xl shadow-2xl transition-all duration-300 animate-fade-in-up border-4 border-indigo-700/70 border-dashed cursor-pointer bg-gradient-to-br from-gray-900 via-indigo-900 to-slate-900 text-white hover:bg-gray-900/80 hover:scale-102 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.3s', animationDuration: '3s' }}
        >
          {/* Glassy gradient overlay */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{background: 'linear-gradient(120deg,rgba(30,30,30,0.22) 0%,rgba(30,30,30,0.12) 100%)'}}></div>
          {/* Inner shadow */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{boxShadow:'inset 0 4px 24px 0 rgba(0,0,0,0.08)'}}></div>
          {/* Animated floating SVG */}
          <svg className="absolute left-10 top-0 w-16 h-16 opacity-20 animate-pulse-slow" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#38bdf8" /></svg>
          {/* Accent bar */}
          <div className="absolute left-0 top-0 h-full w-2 bg-blue-400 rounded-l-3xl shadow-md"></div>
          <svg className="absolute left-0 top-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#38bdf8" />
              </pattern>
            </defs>
            <rect width="400" height="120" fill="url(#dots2)" />
          </svg>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 bg-cyan-200 rounded-full blur-2xl opacity-30"></div>
          <span className="bg-gradient-to-tr from-blue-400 via-cyan-400 to-indigo-400 p-3 rounded-full shadow-lg ring-2 ring-blue-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaTasks className="text-white text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Activities</span>
        </NavLink>
        <NavLink
          to={`quiz`}
          className="group flex flex-col items-center justify-center w-full h-[120px] rounded-3xl shadow-2xl transition-all duration-300 animate-fade-in-up border-4 border-indigo-700/70 border-dashed cursor-pointer bg-gradient-to-br from-gray-900 via-indigo-900 to-slate-900 text-white hover:bg-gray-900/80 hover:scale-102 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.35s', animationDuration: '3s' }}
        >
          {/* Glassy gradient overlay */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{background: 'linear-gradient(120deg,rgba(60,30,60,0.22) 0%,rgba(60,30,60,0.12) 100%)'}}></div>
          {/* Inner shadow */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{boxShadow:'inset 0 4px 24px 0 rgba(0,0,0,0.08)'}}></div>
          {/* Animated floating SVG */}
          <svg className="absolute left-10 top-0 w-16 h-16 opacity-20 animate-pulse-slow" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#f472b6" /></svg>
          {/* Accent bar */}
          <div className="absolute left-0 top-0 h-full w-2 bg-pink-400 rounded-l-3xl shadow-md"></div>
          <svg className="absolute left-0 top-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotsQuiz" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#f472b6" />
              </pattern>
            </defs>
            <rect width="400" height="120" fill="url(#dotsQuiz)" />
          </svg>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 bg-pink-200 rounded-full blur-2xl opacity-30"></div>
          <span className="bg-gradient-to-tr from-pink-400 via-fuchsia-400 to-yellow-400 p-3 rounded-full shadow-lg ring-2 ring-pink-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaQuestionCircle className="text-white text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Quiz Hub</span>
        </NavLink>
        <NavLink
          to={`classlist`}
          className="group flex flex-col items-center justify-center w-full h-[120px] rounded-3xl shadow-2xl transition-all duration-300 animate-fade-in-up border-4 border-indigo-700/70 border-dashed cursor-pointer bg-gradient-to-br from-gray-900 via-indigo-900 to-slate-900 text-white hover:bg-gray-900/80 hover:scale-102 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.4s', animationDuration: '3s' }}
        >
          {/* Glassy gradient overlay */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{background: 'linear-gradient(120deg,rgba(30,60,30,0.22) 0%,rgba(30,60,30,0.12) 100%)'}}></div>
          {/* Inner shadow */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{boxShadow:'inset 0 4px 24px 0 rgba(0,0,0,0.08)'}}></div>
          {/* Animated floating SVG */}
          <svg className="absolute left-10 top-0 w-16 h-16 opacity-20 animate-pulse-slow" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="28" fill="#34d399" /></svg>
          {/* Accent bar */}
          <div className="absolute left-0 top-0 h-full w-2 bg-green-400 rounded-l-3xl shadow-md"></div>
          <svg className="absolute left-0 top-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotsClassList" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" fill="#34d399" />
              </pattern>
            </defs>
            <rect width="400" height="120" fill="url(#dotsClassList)" />
          </svg>
          <div className="absolute -bottom-4 -right-4 w-32 h-16 bg-green-200 rounded-full blur-2xl opacity-30"></div>
          <span className="bg-gradient-to-tr from-green-400 via-emerald-400 to-yellow-400 p-3 rounded-full shadow-lg ring-2 ring-green-200/40 mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaUsers className="text-white text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-extrabold text-lg tracking-wide">Class List</span>
        </NavLink>
      </div>
    </div>
  
  </>
  ) : (
    <Outlet />
  )}
</main>
    </div>
  );
}

// Helper to get student name (replace with actual logic as needed)
function getStudentName() {
  // TODO: Replace with actual student name retrieval logic
  return 'Student';
}

export default StudentClassView;