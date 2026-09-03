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

  // Ignorar archivos internos de desarrollo Next.js y endpoints API
  const url = event.request.url;
  if (url.includes('/_next/') || url.includes('webpack') || url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response('Network error', { status: 503, headers: { 'Content-Type': 'text/plain' } });
    })
  );
});

// Listener de Notificaciones Push PWA
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Control Dotz';
    const options = {
      body: payload.body || 'Nuevo mensaje recibido',
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: payload.tag || 'household-chat',
      renotify: true,
      data: {
        url: payload.url || '/chat',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error al procesar evento Push:', err);
  }
});

// Manejador al hacer clic en la notificación nativa
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/chat') || client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
