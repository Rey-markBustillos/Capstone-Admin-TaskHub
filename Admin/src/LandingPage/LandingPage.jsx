import React, { useState } from "react";

// LandingPage component
const LandingPage = ({ onContinue }) => (
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
      <h1 className="text-3xl font-bold mb-6">Welcome to School Portal</h1>
      <p className="mb-6 text-gray-700">Please click the button below to login.</p>
      <button
        onClick={onContinue}
        className="bg-blue-600 text-white py-3 px-6 rounded hover:bg-blue-700 transition"
        aria-label="Continue to login"
      >
        Go to Login
      </button>
    </div>
  </div>
);

function Login({ onBack, onLoginSuccess }) {
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
      // DEBUG: log payload before sending
      console.log("Login payload:", formData);

      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim(),
      };

      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // DEBUG: log status and response
      console.log("Status:", res.status);
      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok) {
        setError(data.message || "Invalid email or password.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        onLoginSuccess();
      }
    } catch (error) {
      setError("Server error. Please try again later.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-left">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>
        {error && <p className="mb-4 text-red-600" role="alert">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email" className="block mb-1 font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="username"
            className="w-full mb-4 px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label htmlFor="password" className="block mb-1 font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className="w-full mb-6 px-3 py-2 border rounded border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p
          onClick={onBack}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => (e.key === "Enter" ? onBack() : null)}
          className="mt-4 text-blue-600 cursor-pointer hover:underline select-none text-center"
          aria-label="Back to Welcome"
        >
          ← Back to Welcome
        </p>
      </div>
    </div>
  );
}
// Main App component
export default function App() {
  const [currentPage, setCurrentPage] = useState("landingpage"); // 'landingpage', 'login', 'studentdashboard'
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setCurrentPage("studentdashboard");
  };

  if (isLoggedIn && currentPage === "studentdashboard") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-center text-4xl font-bold">Welcome to your dashboard!</h1>
      </div>
    );
    // Replace the above with your full StudentDashboard component when ready
  }

  return (
    <>
      {currentPage === "landingpage" && <LandingPage onContinue={() => setCurrentPage("login")} />}
      {currentPage === "login" && (
        <Login onBack={() => setCurrentPage("landingpage")} onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}
