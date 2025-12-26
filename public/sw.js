const CACHE_NAME = 'billiards-scorer-cache-v2';

// Install the service worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installing');
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Serve cached content and cache new requests
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
      return;
  }

  const url = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then((response) => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }

      // If not in cache, fetch from network.
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response. Don't cache errors.
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
            return networkResponse;
        }

        // Clone the response for caching
        const responseToCache = networkResponse.clone();

        // Cache the fetched resource
        caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(async (error) => {
          console.error('Fetching from network failed:', error);

          // When offline, try to return index.html for navigation requests
          if (event.request.mode === 'navigate') {
              const cache = await caches.open(CACHE_NAME);
              const cachedResponse = await cache.match('/index.html');
              if (cachedResponse) {
                  return cachedResponse;
              }
          }

          throw error;
      });
    })
  );
});


// Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Claim all clients immediately
            return self.clients.claim();
        })
    );
});
