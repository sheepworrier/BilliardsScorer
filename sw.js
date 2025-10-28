const CACHE_NAME = 'billiards-scorer-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/index.tsx',
    '/App.tsx',
    '/types.ts',
    '/components/SetupScreen.tsx',
    '/components/GameScreen.tsx',
    '/components/SummaryScreen.tsx',
    '/components/icons.tsx',
    '/components/shotConfig.ts',
    '/manifest.json',
    '/icon.svg',
];

// Install the service worker and precache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// Serve cached content and cache new requests
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
      return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }

      // If not in cache, fetch from network.
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response. Don't cache errors.
        if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
        }

        // We need to clone the response because it's a one-time use stream.
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(error => {
          console.error('Fetching from network failed:', error);
          // When offline, fetch will throw an error.
          // If the request is not in the cache, the user will see the browser's offline page.
          throw error;
      });
    })
  );
});


// Clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
