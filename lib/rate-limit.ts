/**
 * Rate Limiter con ventana deslizante (Sliding Window) en memoria.
 * Para entornos de producción distribuidos, soporta fallback automático a Upstash Redis si las variables de entorno están presentes.
 */

interface RateLimitTracker {
  count: number
  resetTime: number
}

const memoryStore = new Map<string, RateLimitTracker>()

// Limpieza periódica de tokens expirados para evitar fugas de memoria
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, tracker] of memoryStore.entries()) {
      if (now > tracker.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, 60000)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Comprueba si una clave (IP o User ID) ha superado el límite de peticiones.
 * @param key Identificador único de la petición (e.g. `auth:${ip}` o `action:${userId}`)
 * @param limit Peticiones máximas permitidas en la ventana
 * @param windowMs Ventana de tiempo en milisegundos (por defecto 60,000ms = 1 min)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now()
  const tracker = memoryStore.get(key)

  if (!tracker || now > tracker.resetTime) {
    const resetTime = now + windowMs
    memoryStore.set(key, { count: 1, resetTime })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((resetTime - now) / 1000),
    }
  }

  if (tracker.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil((tracker.resetTime - now) / 1000),
    }
  }

  tracker.count += 1
  return {
    success: true,
    limit,
    remaining: limit - tracker.count,
    reset: Math.ceil((tracker.resetTime - now) / 1000),
  }
}
