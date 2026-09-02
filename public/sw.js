const CACHE_NAME = 'control-dotz-v1';

// Installation: immediate activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activation: claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch event listener (Required for Chrome Desktop PWA Installability Criteria)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
