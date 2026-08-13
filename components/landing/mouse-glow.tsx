'use client'

import * as React from 'react'

export function MouseGlow() {
  const glowRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const glow = glowRef.current
    const wrapper = wrapperRef.current
    if (!glow || !wrapper) return

    const handleMouseMove = (e: MouseEvent) => {
      // Usar requestAnimationFrame para alinear la actualización de la GPU con el refresco de pantalla
      requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${e.clientX - 175}px, ${e.clientY - 175}px, 0)`
      })
      if (wrapper.style.opacity !== '1') {
        wrapper.style.opacity = '1'
      }
    }

    const handleMouseLeave = () => {
      wrapper.style.opacity = '0'
    }

    const handleMouseEnter = () => {
      wrapper.style.opacity = '1'
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
      style={{ opacity: 0 }}
    >
      <div
        ref={glowRef}
        className="absolute w-87.5 h-87.5 rounded-full bg-primary/10 dark:bg-primary/15 blur-3xl pointer-events-none will-change-transform"
        style={{
          left: 0,
          top: 0,
          transform: 'translate3d(-175px, -175px, 0)',
          transition: 'transform 0.1s cubic-bezier(0.1, 0.8, 0.3, 1)',
        }}
      />
    </div>
  )
}
