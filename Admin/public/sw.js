// Service Worker - DISABLED FOR DEVELOPMENT
console.log('Service Worker: Development mode - completely disabled');

// Clear all existing caches immediately
caches.keys().then(cacheNames => {
  return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
}).then(() => {
  console.log('Service Worker: All caches cleared');
});

// Install event - skip waiting and clear caches
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event - clearing caches');
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
    )
  );
  self.skipWaiting();
});

// Activate event - clean up and unregister
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event - cleaning up');
  event.waitUntil(
    Promise.all([
      // Clear all caches
      caches.keys().then(cacheNames => 
        Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      ),
      // Take control of all clients
      self.clients.claim().then(() => {
        console.log('Service Worker: Claimed clients');
        // Unregister after claiming
        return self.registration.unregister();
      }).then(() => {
        console.log('Service Worker: Successfully unregistered');
      }).catch((error) => {
        console.log('Service Worker: Cleanup failed:', error);
      })
    ])
  );
});

// No fetch event handler to avoid "no-op" warning
// Completely removed to prevent overhead

console.log('Service Worker: Loaded in disabled mode');