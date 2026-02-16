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
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <FaEye className="text-blue-500" /> Vision
            </h3>
            <p className="text-gray-700 mt-2">
              We will have nation-loving and competent lifelong learners who are able to respond to challenges and opportunities through quality, accessible, relevant, and liberating K to 12 Program delivered by a modern, professional, pro-active, nimble, trusted and nurturing DepEd.
            </p>
          </div>
        );
      case 'mission':
        return (
          <div>
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <FaBullseye className="text-blue-500" /> Mission
            </h3>
            <p className="text-gray-700 mt-2">
              To develop exemplary programs and open learning opportunities for out-of-school youth and adults to achieve multiple competencies and skills for Industry 4.0.
            </p>
          </div>
        );
      case 'values':
        return (
          <div>
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <FaHeart className="text-blue-500" /> Core Values
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2 ml-2">
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-500" /> Inclusivity & Equity</li>
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-500" /> Lifelong Learning</li>
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-500" /> Community Empowerment</li>
              <li className="flex items-center gap-2"><FaBookOpen className="text-yellow-500" /> Flexibility & Adaptability</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-500">
            <p>Select a category above to learn more about our goals.</p>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
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
      <div className="relative bg-white p-6 sm:p-10 md:p-14 rounded-xl shadow-lg max-w-3xl w-full text-center border border-gray-200">
        {/* TaskHub Logo and ALS Title */}
        <div className="flex flex-col items-center mb-8">
          <span className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-600 shadow-lg border-4 border-white mb-2 overflow-hidden">
            <img
              src="/taskhublogos.png"
              alt="TaskHub Logo"
              className="w-20 h-20 object-cover rounded-full"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </span>
          <div className="flex items-center justify-center gap-2 mb-2 mt-2">
            <span className="text-blue-600 text-5xl sm:text-6xl font-extrabold drop-shadow">A</span>
            <span className="text-red-500 text-5xl sm:text-6xl font-extrabold drop-shadow">L</span>
            <span className="text-yellow-500 text-5xl sm:text-6xl font-extrabold drop-shadow">S</span>
          </div>
          <p className="text-gray-700 font-bold tracking-wider text-xl sm:text-2xl">
            Alternative Learning System
          </p>
        </div>

        {/* Tabs */}
  <div className="flex flex-wrap justify-center border-b border-gray-200 mb-8 gap-2">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 py-2 text-base sm:text-lg font-medium transition-colors rounded-t-md ${
              activeTab === 'vision'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaEye className="inline mr-1 mb-1" /> Vision
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 text-base sm:text-lg font-medium transition-colors rounded-t-md ${
              activeTab === 'mission'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaBullseye className="inline mr-1 mb-1" /> Mission
          </button>
          <button
            onClick={() => setActiveTab('values')}
            className={`px-4 py-2 text-base sm:text-lg font-medium transition-colors rounded-t-md ${
              activeTab === 'values'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FaHeart className="inline mr-1 mb-1" /> Core Values
          </button>
        </div>

        {/* Content */}
  <div className="text-left min-h-[160px] p-4 mt-4 bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-lg shadow-inner border border-blue-100">
          {renderContent()}
        </div>

        {/* Continue Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={onContinue}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white py-3 px-10 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            aria-label="Continue to login"
          >
            Continue to Login <FaArrowRight className="ml-2" />
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