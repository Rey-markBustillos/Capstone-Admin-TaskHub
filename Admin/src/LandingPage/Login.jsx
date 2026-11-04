import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FaUserCircle, FaLock, FaSignInAlt } from "react-icons/fa";
import { recordApplicationVisit, recordPageVisit, recordUserLogin } from '../utils/visitTracker';
import { buildApiUrl } from '../config/api';

export default function Login({ onLoginSuccess, onRegister }) {
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

  const res = await fetch(buildApiUrl('/users/login'), {
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
      {/* Centered container that becomes two-column on xl screens */}
      <div className="relative z-40 w-full max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-8 xl:gap-12 items-center px-4 py-8">
        {/* ALS purpose and values */}
        <section aria-labelledby="als-purpose-title" className="w-full max-w-3xl mx-auto xl:pr-4">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">Alternative Learning System</p>
          <h2 id="als-purpose-title" className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-blue-950">Our purpose, our promise</h2>
          <p className="mt-3 leading-7 text-gray-600">The Alternative Learning System opens learning opportunities for people whose needs are not met by the formal education system.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white shadow-lg md:col-span-2">
              <h3 className="text-xl font-bold">Our Vision</h3>
              <p className="mt-3 text-sm leading-6 text-blue-50">We will have nation-loving and competent lifelong learners who are able to respond to challenges and opportunities through quality, accessible, relevant, and liberating K to 12 Program delivered by a modern, professional, pro-active, nimble, trusted and nurturing DepEd.</p>
            </article>
            <article className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm md:col-span-2">
              <h3 className="text-xl font-bold text-indigo-700">Our Mission</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">To develop exemplary programs and open learning opportunities for out-of-school youth and adults to achieve multiple competencies and skills for Industry 4.0.</p>
            </article>
            <article className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm md:col-span-2">
              <h3 className="text-xl font-bold text-rose-700">Core Values</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                <li className="rounded-xl bg-slate-50 p-3"><strong className="text-gray-800">Inclusivity &amp; Equity</strong><p className="mt-1 text-sm text-gray-600">Education for all, leaving no learner behind.</p></li>
                <li className="rounded-xl bg-slate-50 p-3"><strong className="text-gray-800">Lifelong Learning</strong><p className="mt-1 text-sm text-gray-600">Building skills and confidence at every stage of life.</p></li>
                <li className="rounded-xl bg-slate-50 p-3"><strong className="text-gray-800">Community Empowerment</strong><p className="mt-1 text-sm text-gray-600">Strengthening communities through accessible learning.</p></li>
                <li className="rounded-xl bg-slate-50 p-3"><strong className="text-gray-800">Flexibility &amp; Adaptability</strong><p className="mt-1 text-sm text-gray-600">Learning that responds to different needs and situations.</p></li>
              </ul>
            </article>
          </div>
        </section>

        {/* Right column: login form */}
        <div className="flex justify-center">
          <div className="relative bg-white p-8 sm:p-10 rounded-xl shadow-lg w-full max-w-md border border-gray-200 z-50">
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
                onClick={() => onRegister()}
                tabIndex={0}
                type="button"
                className="inline-flex items-center gap-2 text-base font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer transition-all duration-200 px-4 py-2 rounded-lg hover:bg-indigo-50"
                aria-label="Register Account"
              >
                Create Account
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  onLoginSuccess: PropTypes.func.isRequired,
  onRegister: PropTypes.func.isRequired,
};
