'use client'

import { usePathname } from 'next/navigation'

export function ActiveRouteName() {
  const pathname = usePathname()

  const displayName = pathname === '/'
    ? 'Inicio'
    : pathname.replace(/^\//, '').replace(/-/g, ' ')

  return (
    <span className="text-sm font-medium text-muted-foreground capitalize">
      {displayName}
    </span>
  )
}
