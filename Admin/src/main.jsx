import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { showConfirm } from './utils/swal'

const UPDATE_AVAILABLE_EVENT = 'taskhub:update-available';
const isProductionBuild = import.meta.env.PROD;

// Setup axios request interceptor to add JWT token to all requests
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CRITICAL FIX: For FormData, remove Content-Type header so browser can set it with proper multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Setup axios response interceptor for 401/403 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear session data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Service Worker Registration
if ('serviceWorker' in navigator) {
  const notifyUpdateAvailable = () => {
    window.dispatchEvent(new CustomEvent(UPDATE_AVAILABLE_EVENT));
  };

  const cleanupDevelopmentServiceWorkers = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
  };

  window.addEventListener('load', () => {
    if (!isProductionBuild) {
      cleanupDevelopmentServiceWorkers().catch((error) => {
        console.error('PWA: Failed to clean up development service workers', error);
      });
      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA: Service Worker registered successfully', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', async () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('PWA: New content available, please refresh');
              notifyUpdateAvailable();
              
              // Auto-update or show notification to user
              const shouldUpdate = await showConfirm('Update Available', 'New version available! Update now?', {
                confirmButtonText: 'Update',
                cancelButtonText: 'Later',
                confirmButtonColor: '#2563eb',
              });
              if (shouldUpdate) {
                (registration.waiting || newWorker).postMessage({ type: 'SKIP_WAITING' });
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('PWA: Service Worker registration failed', error);
      });
  });

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('PWA: Service Worker updated');
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </StrictMode>,
)
