const CACHE_NAME = 'music-player-v1.1.7';
const OFFLINE_PAGE = './index.html'; // Fallback page
const ESSENTIAL_FILES = [
  // './',
  './index.html',
  './manifest.json',
  './images/icon-192x192.png',
  './images/icon-512x512.png',
  './images/dark.jpg',
  './images/white.jpeg',
  './images/moon.jpg',
  './images/sun.png',
  './images/github_logo.png',
  './src/style.css',
  './src/script.js',
  'bundle.js',
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
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
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