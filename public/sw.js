// Minimal PWA Service Worker for Let Me Hear You
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Let the browser handle standard network requests
  // Essential to satisfy browser PWA installability requirements
});
