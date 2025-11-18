// Service Worker - DISABLED FOR DEVELOPMENT
console.log('Service Worker: Development mode - disabling all functionality');

// Immediately unregister this service worker
self.registration.unregister().then(() => {
  console.log('Service Worker: Successfully unregistered');
}).catch((error) => {
  console.log('Service Worker: Unregister failed:', error);
});

// Clear all existing caches
caches.keys().then(cacheNames => {
  return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}).then(() => {
  console.log('Service Worker: All caches cleared');
});

// Skip waiting and take control immediately to disable caching
self.skipWaiting();
self.clients.claim();

// Intercept all fetch events and do nothing (let requests pass through normally)
self.addEventListener('fetch', () => {
  // Do not respond to fetch events - let them go through normally
  return;
});

// Minimal install handler
self.addEventListener('install', () => {
  console.log('Service Worker: Install event - skipping');
  self.skipWaiting();
});

// Minimal activate handler that clears everything
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event - clearing caches and unregistering');
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => 
        Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      ),
      self.registration.unregister()
    ])
  );
});

console.log('Service Worker: Disabled for development mode');