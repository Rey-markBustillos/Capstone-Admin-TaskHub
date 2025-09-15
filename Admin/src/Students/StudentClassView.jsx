import { FaArrowLeft } from 'react-icons/fa';
import React, { useState, useEffect, useMemo } from 'react';
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
import { FaBullhorn, FaTasks, FaUsers, FaChalkboardTeacher, FaClock, FaDoorOpen, FaCalendarCheck, FaRocket } from 'react-icons/fa';
import { FaQuestionCircle } from 'react-icons/fa';
import { useContext } from 'react';
import SidebarContext from '../contexts/SidebarContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

const StudentClassView = () => {
  const { classId } = useParams();
  const location = useLocation();
  const { isSidebarOpen } = useContext(SidebarContext);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastOpenedComponent, setLastOpenedComponent] = useState(null);
  const [secondLastComponent, setSecondLastComponent] = useState(null);

  // Component mapping for quick access
  const componentMap = useMemo(() => ({
    attendance: { 
      name: 'Attendance', 
      icon: FaCalendarCheck, 
      color: 'purple', 
      path: 'attendance',
      description: 'Check attendance'
    },
    announcements: { 
      name: 'Announcements', 
      icon: FaBullhorn, 
      color: 'yellow', 
      path: 'announcements',
      description: 'Latest updates'
    },
    activities: { 
      name: 'Activities', 
      icon: FaTasks, 
      color: 'blue', 
      path: 'activities',
      description: 'Submit work'
    },
    quiz: { 
      name: 'Quiz Hub', 
      icon: FaQuestionCircle, 
      color: 'pink', 
      path: 'quiz',
      description: 'Take quizzes'
    },
    classlist: { 
      name: 'Class List', 
      icon: FaUsers, 
      color: 'green', 
      path: 'classlist',
      description: 'View classmates'
    }
  }), []);

  // Track route changes to update last opened component
  useEffect(() => {
    const currentPath = location.pathname.split('/').pop();
    if (componentMap[currentPath] && currentPath !== classId) {
      const newComponent = componentMap[currentPath];
      
      // Update second last component before updating last component
      if (lastOpenedComponent && lastOpenedComponent.path !== newComponent.path) {
        setSecondLastComponent(lastOpenedComponent);
        localStorage.setItem(`secondLastComponent_${classId}`, lastOpenedComponent.path);
      }
      
      setLastOpenedComponent(newComponent);
      localStorage.setItem(`lastComponent_${classId}`, currentPath);
    }
  }, [location.pathname, classId, componentMap, lastOpenedComponent]);

  // Load last opened components from localStorage on mount
  useEffect(() => {
    const savedComponent = localStorage.getItem(`lastComponent_${classId}`);
    const savedSecondComponent = localStorage.getItem(`secondLastComponent_${classId}`);
    
    if (savedComponent && componentMap[savedComponent]) {
      setLastOpenedComponent(componentMap[savedComponent]);
    }
    
    if (savedSecondComponent && componentMap[savedSecondComponent]) {
      setSecondLastComponent(componentMap[savedSecondComponent]);
    }
  }, [classId, componentMap]);
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
    <div className={`h-screen overflow-y-auto overflow-x-hidden hide-scrollbar relative bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 transition-all duration-300`}>
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
  <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-700 to-purple-900 text-white px-2 py-0.5 text-base flex flex-col sm:flex-row sm:flex-wrap justify-start sm:justify-between items-start sm:items-center gap-0.5 sm:gap-1 shadow-xl border-b-4 border-indigo-900 overflow-hidden transition-all duration-[3000ms] animate-fade-in-down max-w-full" style={{animationDelay:'0.05s', animationDuration:'3s'}}>
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
          <div className={`w-full mb-2 flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 md:pl-4 lg:pl-8 overflow-hidden ${isSidebarOpen ? 'ml-36 sm:ml-44' : 'ml-10 sm:ml-12'}`}>
            <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg ring-2 ring-yellow-200/40 flex items-center justify-center flex-shrink-0">
              <FaBullhorn className="text-white text-sm sm:text-lg md:text-2xl" />
            </span>
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-extrabold tracking-wide drop-shadow truncate">Welcome <span className="text-yellow-200">{getStudentName()}</span> to <span className="text-yellow-200">{selectedClass.className}</span>!</span>
          </div>
          <div className={`flex flex-col gap-1 sm:gap-2 md:gap-4 mt-2 relative overflow-hidden max-w-full transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44 pl-1 sm:pl-2 md:pl-4 lg:pl-12' : 'ml-10 sm:ml-12 pl-1 sm:pl-2 md:pl-4 lg:pl-8'}`}>
            {/* Decorative dark glassy background */}
            <div className="absolute inset-0 -z-1 rounded-2xl bg-gradient-to-br from-gray-900/80 via-indigo-900/70 to-blue-900/80 backdrop-blur-md shadow-2xl border border-indigo-900/40" style={{filter:'blur(0.5px)'}} />
            <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg bg-white/10 shadow-inner relative z-10 text-xs sm:text-sm md:text-base">
              <FaChalkboardTeacher className="text-yellow-300 text-sm sm:text-base md:text-lg flex-shrink-0" />
              <span className="font-semibold text-yellow-100 drop-shadow whitespace-nowrap">Teacher:</span>
              <span className="font-bold text-white truncate">{selectedClass.teacherName || (selectedClass.teacher && selectedClass.teacher.name) || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg bg-white/10 shadow-inner relative z-10 text-xs sm:text-sm md:text-base">
              <FaClock className="text-blue-300 text-sm sm:text-base md:text-lg flex-shrink-0" />
              <span className="font-semibold text-blue-100 drop-shadow whitespace-nowrap">Schedule:</span>
              <span className="font-bold text-white truncate">{selectedClass.time ? new Date(selectedClass.time).toLocaleString() : 'TBA'}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-lg bg-white/10 shadow-inner relative z-10 text-xs sm:text-sm md:text-base">
              <FaDoorOpen className="text-pink-300 text-sm sm:text-base md:text-lg flex-shrink-0" />
              <span className="font-semibold text-pink-100 drop-shadow whitespace-nowrap">Room:</span>
              <span className="font-bold text-white truncate">{selectedClass.roomNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
)}

<main className="w-full transition-all duration-300 overflow-hidden">
  {isIndex ? (
    <>
  <div className={`mb-4 sm:mb-8 transition-all duration-[3000ms] animate-fade-in-up px-2 sm:px-4 md:px-8 ${isSidebarOpen ? 'ml-36 sm:ml-44' : 'ml-10 sm:ml-12'}`} style={{animationDelay:'0.15s', animationDuration:'3s'}}>
        <NavLink
          to="/studentportal"
          className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg bg-indigo-700 text-white font-semibold shadow hover:bg-indigo-800 transition mb-4 text-sm sm:text-base"
        >
          <FaArrowLeft className="text-sm sm:text-base" /> Back to My Classes
        </NavLink>
      </div>
  <div className="relative w-full mt-4">
    {/* Cardbox background */}
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-indigo-900/70 to-blue-900/80 backdrop-blur-xl shadow-2xl border border-indigo-900/40 rounded-2xl z-0" />
    
    {/* Grid Layout - Better visual hierarchy */}
    <div className={`relative z-10 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isSidebarOpen ? 'ml-36 sm:ml-44' : 'ml-10 sm:ml-12'}`}>
      {/* Recent Open Heading */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
          <span className="bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 p-1.5 sm:p-2 rounded-full shadow-lg">
            <FaClock className="text-white text-sm sm:text-base md:text-lg" />
          </span>
          Recent Open
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm">Quick access to your recently visited components</p>
      </div>

      {/* Recent Components Row */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6">
        {/* Recent Activity - Dynamic */}
        {lastOpenedComponent ? (
          <NavLink
            to={lastOpenedComponent.path}
            className="group flex flex-col items-center justify-center h-[100px] sm:h-[120px] md:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-emerald-600/60 cursor-pointer bg-gradient-to-br from-emerald-700 via-teal-800 to-cyan-800 text-white hover:bg-emerald-700/80 hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-emerald-400 rounded-l-xl sm:rounded-l-2xl"></div>
            <span className="bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-emerald-200/40 mb-1 sm:mb-1 md:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <lastOpenedComponent.icon className="text-white text-sm sm:text-lg md:text-2xl group-hover:animate-bounce" />
            </span>
            <span className="font-bold text-xs sm:text-sm md:text-lg tracking-wide text-center px-1">{lastOpenedComponent.name}</span>
            <span className="text-[10px] sm:text-xs text-gray-200">Recent open</span>
          </NavLink>
        ) : (
          <div className="group flex flex-col items-center justify-center h-[100px] sm:h-[120px] md:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-gray-600/60 cursor-not-allowed bg-gradient-to-br from-gray-700 via-gray-800 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-gray-400 rounded-l-xl sm:rounded-l-2xl"></div>
            <span className="bg-gradient-to-tr from-gray-400 via-slate-400 to-gray-500 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-gray-200/40 mb-1 sm:mb-1 md:mb-2 flex items-center justify-center">
              <FaClock className="text-white text-sm sm:text-lg md:text-2xl" />
            </span>
            <span className="font-bold text-xs sm:text-sm md:text-lg tracking-wide text-center px-1">Recent Activity</span>
            <span className="text-[10px] sm:text-xs text-gray-300">No recent activity</span>
          </div>
        )}

        {/* Quick Access - Dynamic Second Last */}
        {secondLastComponent ? (
          <NavLink
            to={secondLastComponent.path}
            className="group flex flex-col items-center justify-center h-[100px] sm:h-[120px] md:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-cyan-600/60 cursor-pointer bg-gradient-to-br from-cyan-700 via-teal-800 to-blue-800 text-white hover:bg-cyan-700/80 hover:scale-105 relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-cyan-400 rounded-l-xl sm:rounded-l-2xl"></div>
            <span className="bg-gradient-to-tr from-cyan-400 via-teal-400 to-blue-400 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-cyan-200/40 mb-1 sm:mb-1 md:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
              <secondLastComponent.icon className="text-white text-sm sm:text-lg md:text-2xl group-hover:animate-bounce" />
            </span>
            <span className="font-bold text-xs sm:text-sm md:text-lg tracking-wide text-center px-1">{secondLastComponent.name}</span>
            <span className="text-[10px] sm:text-xs text-gray-200">Quick access</span>
          </NavLink>
        ) : (
          <div className="group flex flex-col items-center justify-center h-[100px] sm:h-[120px] md:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-gray-600/60 cursor-not-allowed bg-gradient-to-br from-gray-700 via-gray-800 to-slate-800 text-white relative overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-gray-400 rounded-l-xl sm:rounded-l-2xl"></div>
            <span className="bg-gradient-to-tr from-gray-400 via-slate-400 to-gray-500 p-1.5 sm:p-2 md:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-gray-200/40 mb-1 sm:mb-1 md:mb-2 flex items-center justify-center">
              <FaRocket className="text-white text-sm sm:text-lg md:text-2xl" />
            </span>
            <span className="font-bold text-xs sm:text-sm md:text-lg tracking-wide text-center px-1">Quick Access</span>
            <span className="text-[10px] sm:text-xs text-gray-300">No quick access</span>
          </div>
        )}
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Attendance */}
        <NavLink
          to={`attendance`}
          className="group flex flex-col items-center justify-center h-[120px] sm:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-indigo-600/60 cursor-pointer bg-gradient-to-br from-gray-800 via-indigo-800 to-slate-800 text-white hover:bg-gray-800/80 hover:scale-105 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.15s', animationDuration: '3s' }}
        >
          <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-purple-400 rounded-l-xl sm:rounded-l-2xl"></div>
          <span className="bg-gradient-to-tr from-purple-400 via-indigo-400 to-pink-400 p-2 sm:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-purple-200/40 mb-1 sm:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaCalendarCheck className="text-white text-lg sm:text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-bold text-sm sm:text-lg tracking-wide text-center px-1">Attendance</span>
          <span className="text-xs text-gray-300">Track your presence</span>
        </NavLink>

        {/* Announcements */}
        <NavLink
          to={`announcements`}
          className="group flex flex-col items-center justify-center h-[120px] sm:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-indigo-600/60 cursor-pointer bg-gradient-to-br from-gray-800 via-indigo-800 to-slate-800 text-white hover:bg-gray-800/80 hover:scale-105 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.2s', animationDuration: '3s' }}
        >
          <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-yellow-400 rounded-l-xl sm:rounded-l-2xl"></div>
          <span className="bg-gradient-to-tr from-yellow-400 via-orange-400 to-pink-400 p-2 sm:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-yellow-200/40 mb-1 sm:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaBullhorn className="text-white text-lg sm:text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-bold text-sm sm:text-lg tracking-wide text-center px-1">Announcements</span>
          <span className="text-xs text-gray-300">Latest updates</span>
        </NavLink>

        {/* Activities */}
        <NavLink
          to={`activities`}
          className="group flex flex-col items-center justify-center h-[120px] sm:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-indigo-600/60 cursor-pointer bg-gradient-to-br from-gray-800 via-indigo-800 to-slate-800 text-white hover:bg-gray-800/80 hover:scale-105 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.3s', animationDuration: '3s' }}
        >
          <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-blue-400 rounded-l-xl sm:rounded-l-2xl"></div>
          <span className="bg-gradient-to-tr from-blue-400 via-cyan-400 to-indigo-400 p-2 sm:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-blue-200/40 mb-1 sm:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaTasks className="text-white text-lg sm:text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-bold text-sm sm:text-lg tracking-wide text-center px-1">Activities</span>
          <span className="text-xs text-gray-300">Submit work</span>
        </NavLink>

        {/* Quiz Hub */}
        <NavLink
          to={`quiz`}
          className="group flex flex-col items-center justify-center h-[120px] sm:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-indigo-600/60 cursor-pointer bg-gradient-to-br from-gray-800 via-indigo-800 to-slate-800 text-white hover:bg-gray-800/80 hover:scale-105 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.35s', animationDuration: '3s' }}
        >
          <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-pink-400 rounded-l-xl sm:rounded-l-2xl"></div>
          <span className="bg-gradient-to-tr from-pink-400 via-fuchsia-400 to-yellow-400 p-2 sm:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-pink-200/40 mb-1 sm:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaQuestionCircle className="text-white text-lg sm:text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-bold text-sm sm:text-lg tracking-wide text-center px-1">Quiz Hub</span>
          <span className="text-xs text-gray-300">Take quizzes</span>
        </NavLink>

        {/* Class List */}
        <NavLink
          to={`classlist`}
          className="group flex flex-col items-center justify-center h-[120px] sm:h-[140px] rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 animate-fade-in-up border-2 sm:border-3 border-indigo-600/60 cursor-pointer bg-gradient-to-br from-gray-800 via-indigo-800 to-slate-800 text-white hover:bg-gray-800/80 hover:scale-105 relative overflow-hidden"
          style={{ textDecoration: 'none', animationDelay: '0.4s', animationDuration: '3s' }}
        >
          <div className="absolute left-0 top-0 h-full w-1 sm:w-1.5 bg-green-400 rounded-l-xl sm:rounded-l-2xl"></div>
          <span className="bg-gradient-to-tr from-green-400 via-emerald-400 to-yellow-400 p-2 sm:p-3 rounded-full shadow-lg ring-1 sm:ring-2 ring-green-200/40 mb-1 sm:mb-2 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FaUsers className="text-white text-lg sm:text-2xl group-hover:animate-bounce" />
          </span>
          <span className="font-bold text-sm sm:text-lg tracking-wide text-center px-1">Class List</span>
          <span className="text-xs text-gray-300">View classmates</span>
        </NavLink>
      </div>
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