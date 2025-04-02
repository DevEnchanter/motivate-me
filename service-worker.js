// Cache name - update version to force cache refresh
const CACHE_NAME = 'motivate-me-v1';

// Files to cache for offline access
const CACHE_ASSETS = [
  '/mobile.html',
  '/mobile-app.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-solid-900.woff2',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installed');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');

  // Remove old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Skip some external resources & non-relevant URLs
  const url = new URL(event.request.url);
  if (url.origin !== location.origin && 
      !event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  event.respondWith(
    // Network first, cache as fallback strategy
    fetch(event.request)
      .then(response => {
        // Clone the response before using it
        const responseClone = response.clone();
        
        // Open cache and save the response
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });

        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If not in cache, try to get the root page or show fallback
            return caches.match('/mobile.html');
          });
      })
  );
});

// Push notification event
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'MotivateMe reminder',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/mobile.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MotivateMe', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/mobile.html')
  );
}); 