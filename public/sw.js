const CACHE_NAME = 'control-dotz-v2'
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/apple-touch-icon.png',
]

// Instalación: precargar recursos esenciales y tomar control inmediato
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activación: limpiar cachés antiguas y reclamar clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Manejo de peticiones de red (Estrategia Network-First con fallback a Caché)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = event.request.url

  // Ignorar esquemas no soportados por la Cache API (chrome-extension://, moz-extension://, etc.)
  if (!url.startsWith('http://') && !url.startsWith('https://')) return

  // Omitir endpoints API dinámicos o hot-reloading de desarrollo
  if (url.includes('/_next/webpack-hmr') || url.includes('/api/auth')) return

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {})
          })
        }
        return networkResponse
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) return cachedResponse

        // Si es una navegación HTML y no hay red ni caché específica, intentar responder con /
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const rootCache = await caches.match('/')
          if (rootCache) return rootCache
        }

        return new Response('Modo Offline: Sin conexión a internet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      })
  )
})

// Listener de Notificaciones Push PWA
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const payload = event.data.json()
    const title = payload.title || 'Control Dotz'
    const options = {
      body: payload.body || 'Nuevo mensaje recibido',
      icon: payload.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.tag || 'household-chat',
      renotify: true,
      data: {
        url: payload.url || '/chat',
      },
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Error al procesar evento Push:', err)
  }
})

// Manejador al hacer clic en la notificación nativa
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) || '/chat'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/chat') || client.url.includes(targetUrl)) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
