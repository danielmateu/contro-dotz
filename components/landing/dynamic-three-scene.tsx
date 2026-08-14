'use client'

import dynamic from 'next/dynamic'

export const DynamicThreeScene = dynamic(
  () => import('./three-scene').then((mod) => mod.ThreeScene),
  { ssr: false }
)
