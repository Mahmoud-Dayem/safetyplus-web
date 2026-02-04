/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/guides/advanced-recipes

// Service worker for PWA functionality

const CACHE_NAME = 'safetyplus-cache-v27'; // Increment for auth fix
const urlsToCache = [
  '/manifest.json',
  '/favicon.ico'
]; // Minimal cache to avoid 404 errors on hashed files

// Skip waiting and claim clients immediately during development
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Install a service worker
self.addEventListener('install', event => {
  // Skip waiting during development for immediate updates
  if (isDevelopment) {
    self.skipWaiting();
  }
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(function(cache) {
         // Cache only files that definitely exist, ignore 404s
         return Promise.all(
           urlsToCache.map(url => {
             return fetch(url)
               .then(response => {
                 if (response.ok) {
                   return cache.put(url, response);
                 }
               })
               .catch(() => {
                 // Silently ignore fetch errors for optional cache files
               });
           })
         );
      })
      .catch(error => {
        console.warn('Service Worker cache installation error:', error);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Never cache HTML pages or auth-related requests
  const url = new URL(event.request.url);
  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isAuthRequest = url.pathname.includes('/auth') || url.pathname === '/';
  const isApiRequest = url.hostname !== location.hostname;
  
  // Skip caching for HTML, auth pages, and external API calls
  if (isHTML || isAuthRequest || isApiRequest) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      }
    )
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  // Claim clients immediately during development
  if (isDevelopment) {
    event.waitUntil(self.clients.claim());
  }
  
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});