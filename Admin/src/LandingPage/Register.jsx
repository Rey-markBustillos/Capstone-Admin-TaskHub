import { useState } from "react";
import PropTypes from "prop-types";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaIdCard,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { buildApiUrl } from "../config/api";

function Register({ onBackToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    lrn: "",
    address: "",
    age: "",
    schoolName: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[^A-Za-z0-9\s]/.test(formData.password)) {
      setError("Use at least 8 characters, including one uppercase letter, one number, and one special character.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        lrn: formData.lrn.trim(),
        address: formData.address.trim(),
        age: formData.age,
        schoolName: formData.schoolName.trim(),
        role: "student",
      };

      const res = await fetch(buildApiUrl('/users'), {
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
        address: "",
        age: "",
        schoolName: "",
      });

      setTimeout(() => onBackToLogin(), 2000);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = [
    { label: "8+ chars", valid: formData.password.length >= 8 },
    { label: "A-Z", valid: /[A-Z]/.test(formData.password) },
    { label: "0-9", valid: /[0-9]/.test(formData.password) },
    { label: "Symbol", valid: /[^A-Za-z0-9\s]/.test(formData.password) },
  ];

  const inputBaseClass = `
    w-full pl-10 sm:pl-11 pr-3 py-2 sm:py-2.5
    bg-slate-50/80 border border-slate-200/80
    rounded-xl sm:rounded-2xl
    text-xs sm:text-sm text-slate-700
    placeholder:text-slate-300 placeholder:text-xs placeholder:sm:text-sm
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-blue-500/30
    focus:border-blue-400 focus:bg-white
    hover:border-slate-300 hover:bg-white/90
  `;

  return (
    <div className="h-dvh w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden px-3 py-2 sm:px-5 sm:py-3 lg:px-8">
      {/* Background decorations */}
      <div className="hidden sm:block absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-gradient-to-br from-blue-100 to-blue-200/50 rounded-full blur-3xl opacity-40 animate-pulse" />
      <div className="hidden sm:block absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-gradient-to-tl from-indigo-100 to-purple-200/50 rounded-full blur-3xl opacity-40 animate-pulse" />
      <div className="hidden lg:block absolute top-[20%] right-[15%] w-[20%] h-[20%] bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full blur-3xl opacity-30" />

      {/* Main Card */}
      <div
        className="
          relative z-10 bg-white/95 backdrop-blur-2xl
          rounded-2xl sm:rounded-3xl max-h-full
          shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.06)]
          w-full max-w-[420px] sm:max-w-md md:max-w-2xl lg:max-w-5xl
          border border-white/80
          overflow-hidden
          lg:grid lg:grid-cols-2
          transition-all duration-500
        "
      >
        {/* ─── Left Panel (Desktop) ─── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 xl:p-8 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-white/5 rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full" />
          <div className="absolute top-[40%] left-[60%] w-[25%] h-[25%] bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 xl:w-16 xl:h-16 bg-white/15 backdrop-blur-sm rounded-2xl mb-6 ring-1 ring-white/20">
              <FaIdCard className="text-xl xl:text-2xl" />
            </div>
            <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-black leading-tight tracking-tight">
              Create your
              <br />
              <span className="text-blue-200">student account</span>
            </h2>
            <p className="mt-4 text-blue-100/90 text-sm xl:text-base leading-relaxed max-w-xs">
              Access your classes, announcements, and activities — all in one
              place.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {[
                "Join classes instantly",
                "Track your activities",
                "Stay updated with announcements",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                  <span className="text-blue-100/80 text-xs xl:text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8">
            <div className="h-px bg-white/10 mb-4" />
            <p className="text-[10px] xl:text-xs text-blue-200/70 font-medium tracking-wider uppercase">
              TaskHub Student Portal
            </p>
          </div>
        </div>

        {/* ─── Right Panel (Form) ─── */}
        <div className="p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8">
          {/* Header */}
          <div className="text-center mb-3 sm:mb-4 lg:mb-4">
            <h2
              className="
                text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl
                font-black text-slate-800 tracking-tight
              "
            >
              Create Account
            </h2>

            <p
              className="
                text-slate-400 mt-1
                text-[10px] sm:text-[11px] md:text-xs
                font-medium tracking-wide
              "
            >
              Join our community today ✨
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-1">
            {/* Name */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label
                className="
                  text-[8px] sm:text-[9px]
                  font-bold uppercase tracking-[0.08em]
                  text-slate-400 ml-1
                  transition-colors duration-200
                "
                style={{
                  color: focusedField === "name" ? "#3b82f6" : undefined,
                }}
              >
                Full Name
              </label>
              <div className="relative group">
                <div
                  className={`
                    absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center
                    transition-colors duration-200
                    ${focusedField === "name" ? "text-blue-500" : "text-slate-400"}
                  `}
                >
                  <FaUser className="text-[11px] sm:text-xs md:text-sm" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Dela Cruz, Juan, Santos"
                  title="Enter your name as Last Name, First Name, Middle Name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  className={inputBaseClass}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label
                className="
                  text-[8px] sm:text-[9px]
                  font-bold uppercase tracking-[0.08em]
                  text-slate-400 ml-1
                  transition-colors duration-200
                "
                style={{
                  color: focusedField === "email" ? "#3b82f6" : undefined,
                }}
              >
                Email Address
              </label>
              <div className="relative group">
                <div
                  className={`
                    absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center
                    transition-colors duration-200
                    ${focusedField === "email" ? "text-blue-500" : "text-slate-400"}
                  `}
                >
                  <FaEnvelope className="text-[11px] sm:text-xs md:text-sm" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="hello@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={inputBaseClass}
                  required
                />
              </div>
            </div>

            {/* LRN */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label
                className="
                  text-[8px] sm:text-[9px]
                  font-bold uppercase tracking-[0.08em]
                  text-slate-400 ml-1
                  transition-colors duration-200
                "
                style={{
                  color: focusedField === "lrn" ? "#3b82f6" : undefined,
                }}
              >
                LRN
              </label>
              <div className="relative group">
                <div
                  className={`
                    absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center
                    transition-colors duration-200
                    ${focusedField === "lrn" ? "text-blue-500" : "text-slate-400"}
                  `}
                >
                  <FaIdCard className="text-[11px] sm:text-xs md:text-sm" />
                </div>
                <input
                  type="text"
                  name="lrn"
                  placeholder="Enter LRN"
                  value={formData.lrn}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("lrn")}
                  onBlur={() => setFocusedField(null)}
                  className={inputBaseClass}
                  required
                />
              </div>
            </div>

            {/* Address, Age, and School */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 ml-1">Address</label>
              <input
                type="text"
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
                className={inputBaseClass}
                required
              />
            </div>
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 ml-1">Age</label>
              <input
                type="number"
                name="age"
                min="1"
                step="1"
                placeholder="Enter your age"
                value={formData.age}
                onChange={handleChange}
                className={inputBaseClass}
                required
              />
            </div>
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400 ml-1">School Name</label>
              <input
                type="text"
                name="schoolName"
                placeholder="Enter your school name"
                value={formData.schoolName}
                onChange={handleChange}
                className={inputBaseClass}
                required
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label
                className="
                  text-[8px] sm:text-[9px]
                  font-bold uppercase tracking-[0.08em]
                  text-slate-400 ml-1
                  transition-colors duration-200
                "
                style={{
                  color: focusedField === "password" ? "#3b82f6" : undefined,
                }}
              >
                Password
              </label>
              <div className="relative group">
                <div
                  className={`
                    absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center
                    transition-colors duration-200
                    ${focusedField === "password" ? "text-blue-500" : "text-slate-400"}
                  `}
                >
                  <FaLock className="text-[11px] sm:text-xs md:text-sm" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="8+ chars, A-Z, 0-9, symbol"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputBaseClass} !pr-10 sm:!pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute right-3 sm:right-4 top-1/2 -translate-y-1/2
                    text-slate-400 hover:text-blue-500
                    transition-colors duration-200
                    p-0.5
                  "
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-xs sm:text-sm" />
                  ) : (
                    <FaEye className="text-xs sm:text-sm" />
                  )}
                </button>
              </div>

              <div className="col-start-2 -mt-1 flex flex-wrap gap-x-2 text-[8px] font-semibold" aria-live="polite">
                {passwordRules.map((rule) => <span key={rule.label} className={rule.valid ? "text-emerald-600" : "text-slate-400"}>{rule.valid ? "✓" : "•"} {rule.label}</span>)}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-2">
              <label
                className="
                  text-[8px] sm:text-[9px]
                  font-bold uppercase tracking-[0.08em]
                  text-slate-400 ml-1
                  transition-colors duration-200
                "
                style={{
                  color:
                    focusedField === "confirmPassword"
                      ? "#3b82f6"
                      : undefined,
                }}
              >
                Confirm Password
              </label>
              <div className="relative group">
                <div
                  className={`
                    absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center
                    transition-colors duration-200
                    ${focusedField === "confirmPassword" ? "text-blue-500" : "text-slate-400"}
                  `}
                >
                  <FaLock className="text-[11px] sm:text-xs md:text-sm" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  className={`${inputBaseClass} !pr-10 sm:!pr-12`}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="
                    absolute right-3 sm:right-4 top-1/2 -translate-y-1/2
                    text-slate-400 hover:text-blue-500
                    transition-colors duration-200
                    p-0.5
                  "
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="text-xs sm:text-sm" />
                  ) : (
                    <FaEye className="text-xs sm:text-sm" />
                  )}
                </button>
              </div>

              {/* Password match indicator */}
              {formData.confirmPassword && (
                <div className="col-span-2 flex items-center gap-1.5 px-1">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <FaCheckCircle className="text-emerald-400 text-[10px]" />
                      <span className="text-[9px] sm:text-[10px] text-emerald-500 font-medium">
                        Passwords match
                      </span>
                    </>
                  ) : (
                    <>
                      <FaExclamationCircle className="text-red-400 text-[10px]" />
                      <span className="text-[9px] sm:text-[10px] text-red-400 font-medium">
                        Passwords do not match
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="col-span-1
                  flex items-center gap-2
                  bg-red-50 border border-red-100
                  rounded-xl sm:rounded-2xl
                  px-3 sm:px-4 py-2.5 sm:py-3
                  animate-[shake_0.3s_ease-in-out]
                "
              >
                <FaExclamationCircle className="text-red-400 text-xs sm:text-sm flex-shrink-0" />
                <p className="text-red-500 text-[10px] sm:text-xs md:text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                className="col-span-1
                  flex items-center gap-2
                  bg-emerald-50 border border-emerald-100
                  rounded-xl sm:rounded-2xl
                  px-3 sm:px-4 py-2.5 sm:py-3
                "
              >
                <FaCheckCircle className="text-emerald-400 text-xs sm:text-sm flex-shrink-0" />
                <p className="text-emerald-600 text-[10px] sm:text-xs md:text-sm font-medium">
                  {success}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                col-span-1 w-full
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700
                active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
                text-white
                py-2 sm:py-2.5
                rounded-xl sm:rounded-2xl
                text-xs sm:text-sm md:text-base
                font-bold tracking-wide
                shadow-lg shadow-blue-500/25
                hover:shadow-xl hover:shadow-blue-500/30
                transition-all duration-300 ease-out
                mt-2
              "
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm">
                    Creating account...
                  </span>
                </span>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-2 sm:pt-3">
              <div className="flex-1 h-px bg-slate-200/80" />
              <span className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-medium">
                Already have an account?
              </span>
              <div className="flex-1 h-px bg-slate-200/80" />
            </div>

            {/* Back to Login */}
            <button
              onClick={onBackToLogin}
              type="button"
              className="
                w-full
                bg-slate-50 hover:bg-slate-100
                border border-slate-200/80 hover:border-slate-300
                text-slate-600 hover:text-blue-600
                py-2 sm:py-2.5
                rounded-xl sm:rounded-2xl
                text-[11px] sm:text-xs md:text-sm
                font-semibold tracking-wide
                transition-all duration-300 ease-out
                active:scale-[0.98]
              "
            >
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

Register.propTypes = {
  onBackToLogin: PropTypes.func.isRequired,
};

export default Register;
