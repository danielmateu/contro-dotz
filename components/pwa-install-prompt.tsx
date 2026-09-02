'use client'

import { useEffect, useState } from 'react'
import { Download, Share2, PlusSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Register Service Worker for PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.error('SW registration error:', err))
    }

    // Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone
    setIsStandalone(isStandaloneMode)

    if (isStandaloneMode) return

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Show prompt for iOS if not dismissed before
    const dismissed = localStorage.getItem('pwa_prompt_dismissed')
    if (isIosDevice && !dismissed) {
      setShowPrompt(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  if (isStandalone || !showPrompt) return null

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } else if (isIOS) {
      setShowIOSInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 p-4 bg-card/95 backdrop-blur border border-border rounded-xl shadow-xl flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            CD
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Instalar Control Dotz</h4>
            <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla de inicio</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {showIOSInstructions ? (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg space-y-1.5">
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            1. Pulsa el botón Compartir <Share2 className="w-3.5 h-3.5 text-primary inline" />
          </p>
          <p className="flex items-center gap-1.5 font-medium text-foreground">
            2. Selecciona &quot;Añadir a la pantalla de inicio&quot; <PlusSquare className="w-3.5 h-3.5 text-primary inline" />
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-8">
            Ahora no
          </Button>
          <Button size="sm" onClick={handleInstallClick} className="text-xs h-8 gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Instalar App
          </Button>
        </div>
      )}
    </div>
  )
}
