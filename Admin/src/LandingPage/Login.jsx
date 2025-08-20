import React, { useState } from "react";
import { FaUserCircle, FaLock, FaSignInAlt, FaArrowLeft } from "react-icons/fa";

export default function Login({ onBack, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const res = await fetch("https://capstone-admin-task-hub-9c3u.vercel.app/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password.");
      } else {
        localStorage.setItem("user", JSON.stringify(data));
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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
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

      <div className="relative bg-slate-800/80 backdrop-blur-xl p-4 sm:p-8 rounded-xl shadow-2xl shadow-black/20 max-w-md w-full mx-auto border border-indigo-700">
        <div className="flex flex-col items-center mb-6">
          <FaUserCircle className="text-indigo-400 text-5xl mb-2 drop-shadow-lg" />
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            TaskHub
          </h1>
          <p className="text-slate-400 mt-2">Sign in to continue</p>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                <FaUserCircle />
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
                className="w-full pl-10 pr-4 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow bg-slate-700/50 text-slate-100 placeholder:text-slate-400"
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                <FaLock />
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
                className="w-full pl-10 pr-4 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow bg-slate-700/50 text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-3 px-4 rounded-lg hover:from-indigo-500 hover:to-blue-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-lg font-semibold shadow-lg"
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

        <div className="text-center mt-6">
          <button
            onClick={onBack}
            tabIndex={0}
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer transition"
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