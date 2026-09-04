'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ThreeSceneComponent = dynamic(
  () => import('./three-scene').then((mod) => mod.ThreeScene),
  { ssr: false }
)

export function DynamicThreeScene() {
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Retardar el montaje 3D para dejar que el hilo principal procese el LCP y el render inicial
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => setShouldRender(true), { timeout: 1200 })
      return () => {
        if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(handle)
      }
    } else {
      const timer = setTimeout(() => setShouldRender(true), 250)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!shouldRender) return null

  return <ThreeSceneComponent />
}

