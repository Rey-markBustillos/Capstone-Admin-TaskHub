import React, { useState } from "react";

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

      const res = await fetch("http://localhost:5000/api/users/login", {
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
    <div className="relative min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Decorative background blobs */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3"
      >
        <div className="w-[40rem] h-[40rem] rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-30 blur-3xl"></div>
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3"
      >
        <div className="w-[40rem] h-[40rem] rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 opacity-30 blur-3xl"></div>
      </div>

      <div className="relative bg-slate-800/60 backdrop-blur-xl p-8 sm:p-10 rounded-xl shadow-2xl shadow-black/20 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">TaskHub</h1>
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
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="username"
              className="w-full px-4 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow bg-slate-700/50 text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-shadow bg-slate-700/50 text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p
            onClick={onBack}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onBack();
            }}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer"
            aria-label="Back to Welcome"
          >
            ← Back to Welcome
          </p>
        </div>
      </div>
    </div>
  );
}