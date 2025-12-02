import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaUserCircle, FaLock, FaSignInAlt, FaArrowLeft } from "react-icons/fa";
import { recordApplicationVisit, recordPageVisit, recordUserLogin } from '../utils/visitTracker';

// Switch between local and deployed backend here:
// For Vite:
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/";

export default function Login({ onBack, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Track visits when login page loads
  useEffect(() => {
    recordApplicationVisit(); // Count application visit
    recordPageVisit('login-page'); // Track specific page visit
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
      };

  const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password.");
      } else {
        localStorage.setItem("user", JSON.stringify(data));
        // Record user login for active user tracking
        if (data.id && data.role) {
          recordUserLogin(data.id, data.role);
        }
        onLoginSuccess(data);
      }
    } catch (err) {
      setError("Server error. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Large decorative circles for background - similar size to login box */}
      <div aria-hidden="true" className="absolute top-8 right-8 pointer-events-none select-none">
        <div className="w-80 h-80 rounded-full bg-blue-100 opacity-30"></div>
      </div>
      <div aria-hidden="true" className="absolute top-32 right-24 pointer-events-none select-none">
        <div className="w-96 h-96 rounded-full bg-blue-200 opacity-25"></div>
      </div>
      <div aria-hidden="true" className="absolute top-1/2 right-16 -translate-y-1/2 pointer-events-none select-none">
        <div className="w-80 h-80 rounded-full bg-blue-300 opacity-35"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-24 right-32 pointer-events-none select-none">
        <div className="w-72 h-72 rounded-full bg-blue-400 opacity-40"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-8 right-8 pointer-events-none select-none">
        <div className="w-88 h-88 rounded-full bg-blue-500 opacity-30"></div>
      </div>
      <div aria-hidden="true" className="absolute top-1/2 right-1/4 -translate-y-1/2 pointer-events-none select-none">
        <div className="w-96 h-96 rounded-full bg-blue-700 opacity-20"></div>
      </div>
      {/* 3D Bubble with studying.png and up-down animation */}
      <div aria-hidden="true" className="absolute top-1/4 right-40 pointer-events-none select-none z-10">
        <div className="relative w-40 h-40" style={{animation: 'floatUpDown 3s ease-in-out infinite'}}>
          {/* Outer bubble with 3D effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-200/30 via-blue-300/20 to-blue-500/10 backdrop-blur-sm border border-blue-300/30 shadow-2xl">
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/20 to-transparent"></div>
            {/* Highlight for 3D effect */}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/40 blur-sm"></div>
          </div>
          {/* studying.png inside the bubble */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/studying.png" 
              alt="Studying" 
              className="w-24 h-24 object-contain drop-shadow-2xl"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
        </div>
      </div>
      {/* Additional large circles for background on the right side */}
      <div aria-hidden="true" className="absolute top-40 right-1/3 pointer-events-none select-none">
        <div className="w-64 h-64 rounded-full bg-blue-50 opacity-35"></div>
      </div>
      <div aria-hidden="true" className="absolute top-1/4 right-2/3 pointer-events-none select-none">
        <div className="w-80 h-80 rounded-full bg-blue-200 opacity-30"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-1/3 right-1/2 pointer-events-none select-none">
        <div className="w-72 h-72 rounded-full bg-blue-300 opacity-25"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-32 right-1/4 pointer-events-none select-none">
        <div className="w-88 h-88 rounded-full bg-blue-400 opacity-30"></div>
      </div>
      <div aria-hidden="true" className="absolute top-3/4 right-1/6 pointer-events-none select-none">
        <div className="w-96 h-96 rounded-full bg-blue-500 opacity-20"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-1/4 right-1/3 pointer-events-none select-none">
        <div className="w-80 h-80 rounded-full bg-blue-800 opacity-25"></div>
      </div>
      {/* LOGIN BOX - positioned on the left side */}
      <div className="relative backdrop-blur-2xl p-6 sm:p-10 rounded-2xl shadow-2xl shadow-black/30 max-w-md w-full ml-8 border-2 border-indigo-700/10" style={{backgroundColor: '#0047AB'}}>
        <div className="flex flex-col items-center mb-8">
          <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg border-4 border-white mb-2 animate-bounce-slow overflow-hidden">
            <img
              src="/taskhublogos.png"
              alt="TaskHub Logo"
              className="w-20 h-20 object-cover rounded-full"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </span>
          <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2 drop-shadow-lg">
            TaskHub
          </h1>
          <p className="text-slate-300 mt-2 text-lg font-medium">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-pulse">
                <FaUserCircle size={22} />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 border border-indigo-600/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow bg-slate-700/60 text-slate-100 placeholder:text-slate-400 shadow-inner"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-pulse">
                <FaLock size={20} />
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className="w-full pl-11 pr-4 py-3 border border-indigo-600/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow bg-slate-700/60 text-slate-100 placeholder:text-slate-400 shadow-inner"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-indigo-500 hover:to-blue-400 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-lg font-bold shadow-xl shadow-indigo-900/20 ring-2 ring-indigo-400/10"
            aria-busy={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <FaSignInAlt className="mr-2 animate-bounce" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <button
            onClick={onBack}
            tabIndex={0}
            type="button"
            className="inline-flex items-center gap-2 text-base font-semibold text-indigo-300 hover:text-indigo-100 cursor-pointer transition-all duration-200 px-4 py-2 rounded-lg bg-indigo-900/30 hover:bg-indigo-800/40 shadow"
            aria-label="Back to Welcome"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onBack();
            }}
          >
            <FaArrowLeft className="animate-pulse" /> Back to Welcome
          </button>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  onBack: PropTypes.func.isRequired,
  onLoginSuccess: PropTypes.func.isRequired,
};