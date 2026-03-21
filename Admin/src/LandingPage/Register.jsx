import { useState } from "react";
import PropTypes from "prop-types";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaLock,
  FaIdCard,
  FaSpinner,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/+$/, "");

function Register({ onBackToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    lrn: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // ✅ Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        lrn: formData.lrn.trim(),
        role: "student",
      };

      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to register account.");
        return;
      }

      setSuccess("Account created successfully! Redirecting...");
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        lrn: "",
      });

      setTimeout(() => onBackToLogin(), 2000);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">

      {/* Background blobs (hidden on mobile) */}
      <div className="hidden sm:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-3xl opacity-50" />
      <div className="hidden sm:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-50" />

      <div className="relative z-10 bg-white/90 backdrop-blur-xl p-5 sm:p-6 md:p-8 lg:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl border border-white">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4 transform -rotate-6">
            <FaIdCard className="text-white text-xl sm:text-2xl rotate-6" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800">
            Create Account
          </h2>

          <p className="text-slate-500 mt-2 text-xs sm:text-sm font-medium">
            Join our community today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">

          {/* Name */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
              Full Name
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center text-slate-400 group-focus-within:text-blue-500">
                <FaUser size={14} />
              </div>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 ml-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center text-slate-400">
                <FaEnvelope size={14} />
              </div>
              <input
                type="email"
                name="email"
                placeholder="hello@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 sm:pl-11 py-2.5 sm:py-3 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* LRN */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 ml-1">
              LRN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center text-slate-400">
                <FaIdCard size={14} />
              </div>
              <input
                type="text"
                name="lrn"
                placeholder="Enter LRN"
                value={formData.lrn}
                onChange={handleChange}
                className="w-full pl-10 sm:pl-11 py-2.5 sm:py-3 bg-slate-50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center text-slate-400">
                <FaLock size={14} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-slate-50 rounded-2xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-400 ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center text-slate-400">
                <FaLock size={14} />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-slate-50 rounded-2xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {success && <p className="text-green-500 text-xs">{success}</p>}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-2xl font-bold"
          >
            {loading ? "Processing..." : "Register"}
          </button>

          {/* Back */}
          <div className="text-center pt-4">
            <button onClick={onBackToLogin} type="button" className="text-sm text-blue-600">
              ← Back to Login
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

Register.propTypes = {
  onBackToLogin: PropTypes.func.isRequired,
};

export default Register;