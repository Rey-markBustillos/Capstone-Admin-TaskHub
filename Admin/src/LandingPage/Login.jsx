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
        // Store JWT token if provided
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
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
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Decorative subtle blue circles for background */}
      <div aria-hidden="true" className="absolute top-8 left-8 pointer-events-none select-none">
        <div className="w-12 h-12 rounded-full bg-blue-100 opacity-40"></div>
      </div>
      <div aria-hidden="true" className="absolute top-24 left-32 pointer-events-none select-none">
        <div className="w-20 h-20 rounded-full bg-blue-200 opacity-30"></div>
      </div>
      <div aria-hidden="true" className="absolute top-1/2 left-16 -translate-y-1/2 pointer-events-none select-none">
        <div className="w-32 h-32 rounded-full bg-blue-300 opacity-25"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-24 right-32 pointer-events-none select-none">
        <div className="w-40 h-40 rounded-full bg-indigo-200 opacity-20"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-8 right-8 pointer-events-none select-none">
        <div className="w-56 h-56 rounded-full bg-blue-300 opacity-15"></div>
      </div>
      <div aria-hidden="true" className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <div className="w-72 h-72 rounded-full bg-indigo-100 opacity-15"></div>
      </div>
      {/* 3D Bubble with studying.png and up-down animation */}
      <div aria-hidden="true" className="absolute top-1/4 left-20 pointer-events-none select-none z-10 hidden lg:block">
        <div className="relative w-40 h-40 animate-float">
          {/* Outer bubble with 3D effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100/40 via-blue-200/30 to-blue-300/20 backdrop-blur-sm border border-blue-200/40 shadow-xl">
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white/30 to-transparent"></div>
            {/* Highlight for 3D effect */}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/50 blur-sm"></div>
          </div>
          {/* studying.png inside the bubble */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/studying.png" 
              alt="Studying" 
              className="w-24 h-24 object-contain drop-shadow-xl"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
        </div>
      </div>
      {/* Additional subtle blue circles for background */}
      <div aria-hidden="true" className="absolute top-40 left-1/2 -translate-x-1/2 pointer-events-none select-none">
        <div className="w-10 h-10 rounded-full bg-blue-50 opacity-40"></div>
      </div>
      <div aria-hidden="true" className="absolute top-1/4 right-24 pointer-events-none select-none">
        <div className="w-16 h-16 rounded-full bg-indigo-100 opacity-30"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-1/3 left-1/3 pointer-events-none select-none">
        <div className="w-24 h-24 rounded-full bg-blue-200 opacity-25"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-32 left-1/4 pointer-events-none select-none">
        <div className="w-36 h-36 rounded-full bg-indigo-200 opacity-20"></div>
      </div>
      <div aria-hidden="true" className="absolute top-3/4 right-1/4 pointer-events-none select-none">
        <div className="w-48 h-48 rounded-full bg-blue-100 opacity-15"></div>
      </div>
      <div aria-hidden="true" className="absolute bottom-1/4 right-1/2 translate-x-1/2 pointer-events-none select-none">
        <div className="w-64 h-64 rounded-full bg-indigo-100 opacity-15"></div>
      </div>
      {/* LOGIN BOX */}
      <div className="relative bg-white p-6 sm:p-10 rounded-xl shadow-lg max-w-md w-full mx-auto border border-gray-200">
        <div className="flex flex-col items-center mb-8">
          <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-600 shadow-lg border-4 border-white mb-2 overflow-hidden">
            <img
              src="/taskhublogos.png"
              alt="TaskHub Logo"
              className="w-20 h-20 object-cover rounded-full"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </span>
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight flex items-center gap-2 drop-shadow">
            TaskHub
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
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
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white text-gray-900 placeholder:text-gray-400 hover:border-blue-300"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-semibold text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
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
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all bg-white text-gray-900 placeholder:text-gray-400 hover:border-blue-300"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-lg font-semibold shadow-md hover:shadow-lg"
            aria-busy={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <FaSignInAlt className="mr-2" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8">
          <button
            onClick={onBack}
            tabIndex={0}
            type="button"
            className="inline-flex items-center gap-2 text-base font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-all duration-200 px-4 py-2 rounded-lg hover:bg-blue-50"
            aria-label="Back to Welcome"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onBack();
            }}
          >
            <FaArrowLeft /> Back to Welcome
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