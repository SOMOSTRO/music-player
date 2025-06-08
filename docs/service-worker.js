const CACHE_NAME = 'music-player-v1';
const OFFLINE_PAGE = 'https://SOMOSTRO.github.io/music-player/index.html'; // Fallback page
const ESSENTIAL_FILES = [
  'https://SOMOSTRO.github.io/music-player/',
  'https://SOMOSTRO.github.io/music-player/index.html',
  'https://SOMOSTRO.github.io/music-player/manifest.json',
  'https://SOMOSTRO.github.io/music-player/images/icon-192x192.png',
  'https://SOMOSTRO.github.io/music-player/images/icon-512x512.png',
  'https://SOMOSTRO.github.io/music-player/images/dark.jpg',
  'https://SOMOSTRO.github.io/music-player/images/white.jpeg',
  'https://SOMOSTRO.github.io/music-player/images/moon.jpg',
  'https://SOMOSTRO.github.io/music-player/images/sun.png',
  'https://SOMOSTRO.github.io/music-player/style.css',
  'https://SOMOSTRO.github.io/music-player/script.js',
  'https://SOMOSTRO.github.io/music-player/bundle.js',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap'
  //'https://cdn.jsdelivr.net/npm/eruda'
];

console.log("Service Worker Updated.");

// Install the service worker and cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => {
        console.log('All essential files cached');
        return self.skipWaiting(); // Force activation
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim()); // Take control of all clients
});

// Serve cached files or fallback to index.html
self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        return fetch(event.request)
          .catch(() => {
            console.log('Network failed, serving offline page');
            return caches.match(OFFLINE_PAGE);
          });
      })
  );
});