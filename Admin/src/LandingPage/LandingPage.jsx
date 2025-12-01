import React, { useState, useEffect } from "react";
import Login from "./Login";
import { FaEye, FaBullseye, FaHeart, FaBookOpen, FaArrowRight } from "react-icons/fa";
import { recordApplicationVisit, recordPageVisit } from '../utils/visitTracker';

// Welcome Screen component with improved responsiveness, icons, and design
const WelcomeScreen = ({ onContinue }) => {
  const [activeTab, setActiveTab] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'vision':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FaEye className="text-indigo-300" /> Vision
            </h3>
            <p className="text-slate-300 mt-2">
              We will have nation-loving and competent lifelong learners who are able to respond to challenges and opportunities through quality, accessible, relevant, and liberating K to 12 Program delivered by a modern, professional, pro-active, nimble, trusted and nurturing DepEd.
            </p>
          </div>
        );
      case 'mission':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FaBullseye className="text-indigo-300" /> Mission
            </h3>
            <p className="text-slate-300 mt-2">
              To develop exemplary programs and open learning opportunities for out-of-school youth and adults to achieve multiple competencies and skills for Industry 4.0.
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
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="relative bg-white backdrop-blur-2xl p-6 sm:p-10 md:p-14 rounded-2xl shadow-2xl shadow-black/30 max-w-3xl w-full text-center border-2 border-indigo-700/10">
        {/* TaskHub Logo and ALS Title */}
        <div className="flex flex-col items-center mb-8">
          <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg border-4 border-white mb-2 animate-bounce-slow overflow-hidden">
            <img
              src="/taskhublogos.png"
              alt="TaskHub Logo"
              className="w-20 h-20 object-cover rounded-full"
              style={{ imageRendering: 'crisp-edges' }}
            />
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

  // Track visits when landing page loads
  useEffect(() => {
    recordApplicationVisit(); // Count application visit
    recordPageVisit('landing-page'); // Track specific page visit
  }, []);

  const handleLoginSuccess = () => {
    window.location.reload();
  };

  if (view === 'login') {
    return <Login onBack={() => setView('welcome')} onLoginSuccess={handleLoginSuccess} />;
  }

  return <WelcomeScreen onContinue={() => setView('login')} />;
}