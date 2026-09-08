'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Mantener actualizado el SW
          reg.update().catch(() => {})
        })
        .catch((err) => {
          console.error('Error al registrar el Service Worker:', err)
        })
    }
  }, [])

  return null
}
