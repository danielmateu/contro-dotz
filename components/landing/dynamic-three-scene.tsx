'use client'

import { useState, useEffect, ComponentType } from 'react'

export function DynamicThreeScene() {
  const [ThreeScene, setThreeScene] = useState<ComponentType<any> | null>(null)

  useEffect(() => {
    // Si la pantalla es móvil (Lighthouse mobile test) o prefiere movimiento reducido, omitir la carga del bundle 3D pesado
    if (
      typeof window === 'undefined' ||
      window.innerWidth < 768 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const loadScene = () => {
      import('./three-scene').then((mod) => {
        setThreeScene(() => mod.ThreeScene)
      })
    }

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(loadScene, { timeout: 2000 })
      return () => {
        if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(handle)
      }
    } else {
      const timer = setTimeout(loadScene, 600)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!ThreeScene) return null

  return <ThreeScene />
}


