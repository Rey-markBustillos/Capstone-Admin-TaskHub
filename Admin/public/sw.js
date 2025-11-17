// TaskHub Service Worker
const CACHE_NAME = 'taskhub-v1.0.3';
const API_CACHE_NAME = 'taskhub-api-v1.0.3';

// Static files to cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/taskhublogos.png',
  '/class-bg.svg',
  '/vite.svg',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/src/index.css',
  // Add other critical static assets
];

// API endpoints to cache (for offline functionality)
const API_ENDPOINTS = [
  '/api/classes',
  '/api/announcements',
  '/api/activities',
  '/api/quizzes'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Strategy for API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request, API_CACHE_NAME));
    return;
  }

  // Strategy for static files
  if (isStaticFile(request)) {
    event.respondWith(cacheFirstWithNetworkFallback(request, CACHE_NAME));
    return;
  }

  // Strategy for navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCacheFallback(request, CACHE_NAME));
    return;
  }

  // Default strategy for other requests
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Caching strategies
async function cacheFirstWithNetworkFallback(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('Service Worker: Serving from cache', request.url);
      return cached;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('Service Worker: Cache first strategy failed', error);
    return new Response('Offline - Content not available', { status: 503 });
  }
}

async function networkFirstWithFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      console.log('Service Worker: Updated cache from network', request.url);
    }
    return response;
  } catch {
    console.log('Service Worker: Network failed, trying cache', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Unable to fetch data while offline' 
      }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function networkFirstWithCacheFallback(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    console.log('Service Worker: Network failed for navigation, trying cache');
    const cached = await caches.match('/index.html');
    return cached || new Response('Offline', { status: 503 });
  }
}

// Helper functions
function isStaticFile(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.js', '.jsx', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Implement background sync logic for offline actions
    console.log('Service Worker: Performing background sync');
    
    // Example: Sync offline submissions, announcements, etc.
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await syncAction(action);
        await removeOfflineAction(action.id);
      } catch {
        console.error('Service Worker: Failed to sync action', action);
      }
    }
  } catch {
    console.error('Service Worker: Background sync failed');
  }
}

// Placeholder functions for offline action management
async function getOfflineActions() {
  // Implement logic to retrieve offline actions from IndexedDB
  return [];
}

async function syncAction(action) {
  // Implement logic to sync individual actions
  console.log('Service Worker: Syncing action', action);
}

async function removeOfflineAction(actionId) {
  // Implement logic to remove synced actions from IndexedDB
  console.log('Service Worker: Removed offline action', actionId);
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  if (event.data) {
    const options = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(options.title || 'TaskHub Notification', {
        body: options.body || 'You have a new notification',
        icon: '/taskhublogos.png',
        badge: '/taskhublogos.png',
        tag: options.tag || 'taskhub-notification',
        requireInteraction: true,
        actions: [
          {
            action: 'open',
            title: 'Open App',
            icon: '/taskhublogos.png'
          },
          {
            action: 'close',
            title: 'Dismiss',
            icon: '/taskhublogos.png'
          }
        ],
        data: options.data || {}
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('Service Worker: Loaded successfully');