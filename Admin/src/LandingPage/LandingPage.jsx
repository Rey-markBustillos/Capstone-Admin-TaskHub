import React, { useState } from "react";
import Login from "./Login"; // I-import ang Login component

// Ito ang Welcome Screen component na dating LandingPage
const WelcomeScreen = ({ onContinue }) => {
  const [activeTab, setActiveTab] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'vision':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100">Our Vision</h3>
            <p className="text-slate-300 mt-2">
              To empower Filipino out-of-school youth and adults to continue learning and transform their lives and communities.
            </p>
          </div>
        );
      case 'mission':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100">Our Mission</h3>
            <p className="text-slate-300 mt-2">
              To provide a viable alternative to the existing formal education system, encompassing all basic education needs of diverse learners through a range of flexible learning pathways.
            </p>
          </div>
        );
      case 'values':
        return (
          <div>
            <h3 className="text-xl font-bold text-slate-100">Core Values</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2">
              <li>Inclusivity & Equity</li>
              <li>Lifelong Learning</li>
              <li>Community Empowerment</li>
              <li>Flexibility & Adaptability</li>
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
    <div className="relative min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
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

      <div className="relative bg-slate-800/60 backdrop-blur-xl p-8 sm:p-12 rounded-xl shadow-2xl shadow-black/20 max-w-3xl w-full text-center">
        
        <div className="flex justify-center border-b border-slate-700 mb-8">
          <button
            onClick={() => setActiveTab('vision')}
            className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'vision' ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            Vision
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'mission' ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            Mission
          </button>
          <button
            onClick={() => setActiveTab('values')}
            className={`px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'values' ? 'border-b-2 border-indigo-400 text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            Core Values
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-7xl font-extrabold tracking-tight">
            <span className="text-blue-500">A</span>
            <span className="text-red-500">L</span>
            <span className="text-yellow-400">S</span>
          </h1>
          <p className="text-slate-300 font-semibold tracking-wider mt-1">
            Alternative Learning System
          </p>
        </div>

        <div>
          <button
            onClick={onContinue}
            className="w-full sm:w-auto bg-indigo-600 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-indigo-500 transition-colors transform hover:scale-105"
            aria-label="Continue to login"
          >
            Continue to Login
          </button>
        </div>

        <div className="text-left min-h-[160px] p-4 mt-8">
          {renderContent()}
        </div>
        
      </div>
    </div>
  );
};


// Ito na ngayon ang main component ng file na ito.
// Siya ang mag-mamanage kung WelcomeScreen o Login ang ipapakita.
export default function LandingPage() {
  const [view, setView] = useState('welcome'); // 'welcome' or 'login'

  const handleLoginSuccess = () => {
    // I-reload ang page para ma-trigger ng App.js ang redirect sa dashboard
    window.location.reload();
  };

  if (view === 'login') {
    return <Login onBack={() => setView('welcome')} onLoginSuccess={handleLoginSuccess} />;
  }

  // By default, show the welcome screen
  return <WelcomeScreen onContinue={() => setView('login')} />;
}