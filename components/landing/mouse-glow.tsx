'use client'

import * as React from 'react'

export function MouseGlow() {
  const [coords, setCoords] = React.useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCoords({ x: e.clientX, y: e.clientY })
      if (!isVisible) setIsVisible(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [isVisible])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className="absolute w-[350px] h-[350px] rounded-full bg-primary/10 dark:bg-primary/15 blur-3xl pointer-events-none will-change-transform"
        style={{
          left: 0,
          top: 0,
          transform: `translate3d(${coords.x - 175}px, ${coords.y - 175}px, 0)`,
          transition: 'transform 0.1s cubic-bezier(0.1, 0.8, 0.3, 1)',
        }}
      />
    </div>
  )
}
