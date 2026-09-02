import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Ajustar la tasa de muestreo de trazas en producción (ej: 10% de transacciones)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capturar errores no controlados y habilitar filtrado de errores de desarrollo
  debug: false,
  enabled: process.env.NODE_ENV === 'production' || !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  ignoreErrors: [
    // Ignorar errores triviales de la red del usuario
    'ResizeObserver loop limit exceeded',
    'NetworkError when attempting to fetch resource',
    'Failed to fetch',
  ],
})
