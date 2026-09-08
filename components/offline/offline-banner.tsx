'use client'

import React, { useState, useEffect } from 'react'
import { useOfflineSync } from '@/components/providers/offline-sync-provider'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync()
  const [showSyncedSuccess, setShowSyncedSuccess] = useState(false)
  const [prevPending, setPrevPending] = useState(pendingCount)

  // Detectar cuando termina una sincronización con éxito para mostrar breve mensaje verde
  useEffect(() => {
    if (prevPending > 0 && pendingCount === 0 && isOnline && !isSyncing) {
      setShowSyncedSuccess(true)
      const timer = setTimeout(() => setShowSyncedSuccess(false), 4000)
      return () => clearTimeout(timer)
    }
    setPrevPending(pendingCount)
  }, [pendingCount, isOnline, isSyncing, prevPending])

  const isVisible = !isOnline || pendingCount > 0 || isSyncing || showSyncedSuccess

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto"
        >
          {!isOnline ? (
            // Estado 1: Sin Conexión (Offline)
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-slate-900/90 dark:bg-slate-950/95 text-amber-300 border border-amber-500/40 shadow-xl backdrop-blur-md text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  Modo Offline {pendingCount > 0 && `• ${pendingCount} pendiente(s)`}
                </span>
              </div>
              <span className="text-[10px] text-amber-200/80 font-normal hidden sm:inline">
                Guardando en tu dispositivo
              </span>
            </div>
          ) : isSyncing ? (
            // Estado 2: Sincronizando...
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-slate-900/90 dark:bg-slate-950/95 text-blue-300 border border-blue-500/40 shadow-xl backdrop-blur-md text-xs font-semibold">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
                <span>Sincronizando {pendingCount} cambio(s)...</span>
              </div>
            </div>
          ) : showSyncedSuccess ? (
            // Estado 3: Éxito tras sincronización
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shadow-xl backdrop-blur-md text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Conexión restablecida. ¡Todo sincronizado!</span>
              </div>
            </div>
          ) : (
            // Estado 4: Hay cambios pendientes y estamos online
            <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-full bg-slate-900/90 dark:bg-slate-950/95 text-slate-200 border border-slate-700 shadow-xl backdrop-blur-md text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CloudUpload className="h-4 w-4 text-primary shrink-0" />
                <span>{pendingCount} cambio(s) listo(s) para subir</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => syncNow()}
                className="h-6 text-[10px] px-2 rounded-full bg-primary/20 hover:bg-primary/30 text-primary-foreground font-bold"
              >
                Sincronizar ahora
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
