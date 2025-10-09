import React, { useState, useEffect } from 'react';
import '../Css/pwa.css';

const PWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Online/Offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Service Worker update detection
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });

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
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
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