import React, { useState } from "react";
import Login from "./Login";
import { FaEye, FaBullseye, FaHeart, FaBookOpen, FaArrowRight } from "react-icons/fa";

// Welcome Screen component with improved responsiveness, icons, and design
const WelcomeScreen = ({ onContinue }) => {
  const [activeTab, setActiveTab] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'vision':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FaEye className="text-indigo-300" /> Our Vision
            </h3>
            <p className="text-slate-300 mt-2">
              To empower Filipino out-of-school youth and adults to continue learning and transform their lives and communities.
            </p>
          </div>
        );
      case 'mission':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FaBullseye className="text-indigo-300" /> Our Mission
            </h3>
            <p className="text-slate-300 mt-2">
              To provide a viable alternative to the existing formal education system, encompassing all basic education needs of diverse learners through a range of flexible learning pathways.
            </p>
          </div>
        );
      case 'values':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FaHeart className="text-indigo-300" /> Core Values
            </h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2 ml-2">
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-300" /> Inclusivity & Equity</li>
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-300" /> Lifelong Learning</li>
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-300" /> Community Empowerment</li>
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-300" /> Flexibility & Adaptability</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="text-center text-slate-400">
            <p>Select a category above to learn more about our goals.</p>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Decorative background blobs (same as login) */}
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

      <div className="relative bg-gradient-to-br from-indigo-900/80 via-slate-900/80 to-blue-900/80 backdrop-blur-2xl p-6 sm:p-10 md:p-14 rounded-2xl shadow-2xl shadow-black/30 max-w-3xl w-full text-center border-2 border-indigo-700/40">
        {/* TaskHub Logo and ALS Title */}
        <div className="flex flex-col items-center mb-8">
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500 shadow-lg border-4 border-white mb-2 animate-bounce-slow">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="url(#landingLogoGradient)" />
              <defs>
                <linearGradient id="landingLogoGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M12 8v8" />
            </svg>
          </span>
          <div className="flex items-center justify-center gap-2 mb-2 mt-2">
            <span className="text-blue-500 text-5xl sm:text-6xl font-extrabold drop-shadow-lg animate-pulse">A</span>
            <span className="text-red-500 text-5xl sm:text-6xl font-extrabold drop-shadow-lg animate-pulse">L</span>
            <span className="text-yellow-400 text-5xl sm:text-6xl font-extrabold drop-shadow-lg animate-pulse">S</span>
          </div>
          <p className="text-slate-200 font-bold tracking-wider text-xl sm:text-2xl drop-shadow-lg">
            Alternative Learning System
          </p>
        </div>

        {/* Tabs */}
  <div className="flex flex-wrap justify-center border-b border-slate-700 mb-8 gap-2">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 py-2 text-base sm:text-lg font-medium transition-colors rounded-t-md ${
              activeTab === 'vision'
                ? 'border-b-2 border-indigo-400 text-indigo-400 bg-slate-900'
                : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            <FaEye className="inline mr-1 mb-1" /> Vision
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 text-base sm:text-lg font-medium transition-colors rounded-t-md ${
              activeTab === 'mission'
                ? 'border-b-2 border-indigo-400 text-indigo-400 bg-slate-900'
                : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            <FaBullseye className="inline mr-1 mb-1" /> Mission
          </button>
          <button
            onClick={() => setActiveTab('values')}
            className={`px-4 py-2 text-base sm:text-lg font-medium transition-colors rounded-t-md ${
              activeTab === 'values'
                ? 'border-b-2 border-indigo-400 text-indigo-400 bg-slate-900'
                : 'text-slate-400 hover:text-indigo-400'
            }`}
          >
            <FaHeart className="inline mr-1 mb-1" /> Core Values
          </button>
        </div>

        {/* Content */}
  <div className="text-left min-h-[160px] p-4 mt-4 bg-slate-900/60 rounded-lg shadow-inner">
          {renderContent()}
        </div>

        {/* Continue Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={onContinue}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-violet-500 to-blue-500 text-white py-3 px-10 rounded-xl text-xl font-bold hover:from-indigo-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 shadow-xl shadow-indigo-900/20 ring-2 ring-indigo-400/10 animate-bounce-slow"
            aria-label="Continue to login"
          >
            Continue to Login <FaArrowRight className="ml-2 animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main LandingPage component
export default function LandingPage() {
  const [view, setView] = useState('welcome'); // 'welcome' or 'login'

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  if (view === 'login') {
    return <Login onBack={() => setView('welcome')} onLoginSuccess={handleLoginSuccess} />;
  }

  return <WelcomeScreen onContinue={() => setView('login')} />;
}