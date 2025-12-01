import React, { useState, useEffect } from "react";
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
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3"
      >
        <div className="w-[24rem] sm:w-[40rem] h-[24rem] sm:h-[40rem] rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-30 blur-3xl"></div>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3"
      >
        <div className="w-[24rem] sm:w-[40rem] h-[24rem] sm:h-[40rem] rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 opacity-30 blur-3xl"></div>
      </div>

      <div className="relative bg-gradient-to-br from-indigo-900/80 via-slate-900/80 to-blue-900/80 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl shadow-2xl shadow-black/30 max-w-md w-full mx-auto border-2 border-indigo-700/40">
        <div className="flex flex-col items-center mb-8">
          <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 shadow-lg border-4 border-white mb-2 animate-bounce-slow overflow-hidden">
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

        {error && (
          <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 mb-6 rounded-md" role="alert">
            <p>{error}</p>
          </div>
        )}

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