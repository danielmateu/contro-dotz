const CACHE_NAME = 'control-dotz-v5'
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/expenses',
  '/chat',
  '/budgets',
  '/shopping',
  '/saving-goals',
  '/household',
  '/categories',
  '/settings',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/apple-touch-icon.png',
]

// Instalación: precargar recursos esenciales y tomar control inmediato
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset)
        } catch (_) {}
      }
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
  if (url.includes('/_next/webpack-hmr') || url.includes('/api/auth') || url.includes('/__nextjs')) return

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          (networkResponse.status === 200 || networkResponse.status === 304) &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {})

            // Guardar también copia con URL limpia sin parámetros RSC
            try {
              const cleanUrl = new URL(event.request.url)
              if (cleanUrl.searchParams.has('_rsc')) {
                cleanUrl.searchParams.delete('_rsc')
                cache.put(cleanUrl.toString(), networkResponse.clone()).catch(() => {})
              }
            } catch (_) {}
          })
        }
        return networkResponse
      })
      .catch(async () => {
        // 1. Coincidencia exacta de petición en la caché
        let cachedResponse = await caches.match(event.request)
        if (cachedResponse) return cachedResponse

        // 2. Coincidencia ignorando parámetros de consulta (?_rsc=...)
        cachedResponse = await caches.match(event.request, { ignoreSearch: true })
        if (cachedResponse) return cachedResponse

        // 3. Coincidencia con URL limpia sin parámetros
        try {
          const cleanUrl = new URL(event.request.url)
          cleanUrl.search = ''
          cachedResponse = await caches.match(cleanUrl.toString())
          if (cachedResponse) return cachedResponse
        } catch (_) {}

        // 4. Si es una petición RSC de Next.js (_rsc=) y no hay caché, responder formato RSC válido para no romper la navegación cliente
        if (url.includes('_rsc=') || event.request.headers.get('RSC') === '1') {
          return new Response('[]', {
            status: 200,
            headers: { 'Content-Type': 'text/x-component; charset=utf-8' },
          })
        }

        // 5. Si es una navegación HTML y no hay red ni caché previa, servir dashboard o fallback HTML
        const accept = event.request.headers.get('accept') || ''
        const isHtmlNav = event.request.mode === 'navigate' || accept.includes('text/html')

        if (isHtmlNav) {
          const dashboardCache = await caches.match('/dashboard')
          if (dashboardCache) return dashboardCache

          const rootCache = await caches.match('/')
          if (rootCache) return rootCache

          // HTML de cortesía si no hay caché previa
          return new Response(
            `<!DOCTYPE html>
            <html lang="es">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Control Dotz - Modo Offline</title>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1.5rem; text-align: center; }
                  .card { background: #18181b; padding: 2.5rem 2rem; border-radius: 1.5rem; border: 1px solid #27272a; max-width: 380px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
                  .icon { font-size: 2.5rem; margin-bottom: 1rem; }
                  h1 { font-size: 1.25rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #f59e0b; }
                  p { font-size: 0.875rem; color: #a1a1aa; line-height: 1.6; margin: 0 0 1.5rem 0; }
                  button { width: 100%; padding: 0.75rem 1.25rem; background: #6366f1; color: white; border: none; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: opacity 0.2s; }
                  button:active { opacity: 0.8; }
                </style>
              </head>
              <body>
                <div class="card">
                  <div class="icon">⚡</div>
                  <h1>Modo Offline Activo</h1>
                  <p>Estás usando Control Dotz sin conexión a internet. Todos los gastos y cambios se guardan en tu dispositivo y se sincronizarán automáticamente al reconectar.</p>
                  <button onclick="window.location.reload()">Reintentar Conexión</button>
                </div>
              </body>
            </html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          )
        }

        // Si es un archivo CSS o JS sin caché, responder con status 200 vacío
        if (url.endsWith('.css') || accept.includes('text/css')) {
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } })
        }

        if (url.endsWith('.js') || accept.includes('text/javascript') || accept.includes('*/*')) {
          return new Response('/* offline fallback */', { status: 200, headers: { 'Content-Type': 'text/javascript' } })
        }

        return new Response('', { status: 200 })
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
