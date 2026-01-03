// Service Worker for Neon Winder PWA
const CACHE_NAME = 'neon-winder-v2';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/chatgpt-splash.png'
];

// Google Fonts to cache
const FONT_URLS = [
  'https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyGy6BoWgz.woff2',
  'https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyKS6BoWgz.woff2',
  'https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyCC6BoWgz.woff2',
  'https://fonts.gstatic.com/s/orbitron/v31/yMJMMIlzdpvBhQQL_SC3X9yhF25-T1nyYS6BoWgz.woff2'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      // Cache fonts separately to handle CORS
      FONT_URLS.forEach(url => {
        fetch(url, { mode: 'cors' })
          .then(response => cache.put(url, response))
          .catch(err => console.log('[SW] Font cache failed:', url));
      });
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Don't cache non-ok responses or opaque responses
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Clone the response (it can only be consumed once)
        const responseToCache = networkResponse.clone();

        // Cache the fetched resource
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Network failed and not in cache - return offline fallback for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
