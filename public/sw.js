// Service Worker for Rebeldia FM Web App
const CACHE_NAME = 'rebeldia-fm-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through audio streaming requests to avoid caching live streams
  if (event.request.url.includes(':6806') || event.request.url.includes('stream') || event.request.url.includes('hdradios')) {
    return;
  }
  // Standard network first fetch
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
