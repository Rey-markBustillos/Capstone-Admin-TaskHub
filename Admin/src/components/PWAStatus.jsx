import React, { useState, useEffect } from 'react';
import '../Css/pwa.css';

const UPDATE_AVAILABLE_EVENT = 'taskhub:update-available';

const PWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Online/Offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(UPDATE_AVAILABLE_EVENT, handleUpdateAvailable);

    if ('serviceWorker' in navigator) {
      // Check for updates periodically
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.update();
          });
        });
      };

      // Check for updates every 30 minutes
      const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

      return () => {
        clearInterval(updateInterval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener(UPDATE_AVAILABLE_EVENT, handleUpdateAvailable);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(UPDATE_AVAILABLE_EVENT, handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      registrations.forEach((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
      window.location.reload();
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  return (
    <>
      {/* Offline Indicator */}
      <div className={`offline-indicator ${!isOnline ? 'show' : ''}`}>
        <div className="offline-dot"></div>
        <span>You're offline</span>
      </div>

      {/* Update Available Banner */}
      <div className={`update-banner ${updateAvailable ? 'show' : ''}`}>
        <span>A new version of TaskHub is available!</span>
        <button onClick={handleUpdate}>Update Now</button>
        <button 
          onClick={dismissUpdate}
          style={{ background: '#6b7280', marginLeft: '8px' }}
        >
          Later
        </button>
      </div>
    </>
  );
};

export default PWAStatus;
