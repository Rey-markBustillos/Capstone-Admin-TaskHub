import React from 'react';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

const PWAInfo = () => {
  const pwaFeatures = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Instant loading and smooth performance with advanced caching'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'Perfect experience on any device - phone, tablet, or desktop'
    },
    {
      icon: '🔌',
      title: 'Works Offline',
      description: 'Access your classes and content even without internet connection'
    },
    {
      icon: '🔔',
      title: 'Push Notifications',
      description: 'Get instant alerts for new assignments, announcements, and updates'
    },
    {
      icon: '🏠',
      title: 'Home Screen Access',
      description: 'Add to home screen for quick access like a native app'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data stays secure with offline-first architecture'
    }
  ];

  const installSteps = [
    {
      device: 'Android Chrome',
      steps: [
        'Tap the menu button (⋮) in Chrome',
        'Select "Add to Home screen"',
        'Tap "Add" to confirm installation'
      ]
    },
    {
      device: 'iOS Safari',
      steps: [
        'Tap the Share button (□↗)',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" to confirm installation'
      ]
    },
    {
      device: 'Desktop Chrome',
      steps: [
        'Click the install icon in the address bar',
        'Or use the "Install TaskHub" button above',
        'Click "Install" to confirm'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/taskhublogos.png" 
                alt="TaskHub Logo" 
                className="w-12 h-12 rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TaskHub PWA</h1>
                <p className="text-gray-600">Progressive Web Application</p>
              </div>
            </div>
            <PWAInstallPrompt />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Install TaskHub for the Best Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get native app-like performance, offline access, and push notifications 
            by installing TaskHub as a Progressive Web App on your device.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {pwaFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Installation Guide */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How to Install TaskHub
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {installSteps.map((guide, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  {guide.device}
                </h4>
                <ol className="space-y-2">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-gray-600 text-sm">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* PWA Status */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium">
              {window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
                ? 'TaskHub is installed and running as a PWA'
                : 'TaskHub is ready to be installed as a PWA'
              }
            </span>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Why Install TaskHub?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Installing TaskHub as a PWA gives you a seamless, native app experience 
            with improved performance, offline capabilities, and easy access from your home screen.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">No App Store Required</span>
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">Automatic Updates</span>
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">Cross-Platform</span>
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm">Lightweight</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInfo;