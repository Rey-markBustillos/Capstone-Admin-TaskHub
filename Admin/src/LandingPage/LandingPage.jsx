import React from "react";

export default function LandingPage({ onContinue }) {
  return (
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
}
