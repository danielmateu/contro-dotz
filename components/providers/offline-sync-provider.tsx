'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  enqueueOfflineAction,
  getPendingQueue,
  PendingAction,
} from '@/lib/offline/offline-store'
import { runSyncProcess } from '@/lib/offline/sync-engine'
import { toast } from '@/components/ui/toast'

interface OfflineSyncContextType {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  lastSyncedAt: number | null
  syncNow: () => Promise<void>
  enqueueAction: (
    type: PendingAction['type'],
    payload: Record<string, any>
  ) => Promise<PendingAction>
  refreshPendingCount: () => Promise<number>
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined)

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)

  const refreshPendingCount = useCallback(async () => {
    const queue = await getPendingQueue()
    setPendingCount(queue.length)
    return queue.length
  }, [])

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    setIsSyncing(true)
    try {
      const report = await runSyncProcess(async () => {
        await refreshPendingCount()
      })

      if (report.total > 0 && report.successCount > 0) {
        setLastSyncedAt(Date.now())
        toast.add({
          title: 'Sincronización completada',
          description: `${report.successCount} cambio(s) guardado(s) en la nube.`,
          type: 'success',
        })
      }
    } catch (err) {
      console.error('Error durante la sincronización automática:', err)
    } finally {
      setIsSyncing(false)
      await refreshPendingCount()
    }
  }, [isSyncing, refreshPendingCount])

  const enqueueAction = useCallback(
    async (type: PendingAction['type'], payload: Record<string, any>) => {
      const action = await enqueueOfflineAction(type, payload)
      await refreshPendingCount()

      toast.add({
        title: '⚡ Modo Offline',
        description: 'Tu cambio se ha guardado localmente y se sincronizará al conectar.',
        type: 'info',
      })

      if (navigator.onLine) {
        syncNow()
      }

      return action
    },
    [refreshPendingCount, syncNow]
  )

  useEffect(() => {
    // Inicializar estado online
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      refreshPendingCount()
    }

    const handleOnline = () => {
      setIsOnline(true)
      toast.add({
        title: 'Conexión restablecida',
        description: 'Conexión a internet recuperada.',
        type: 'success',
      })
      syncNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.add({
        title: 'Sin conexión',
        description: 'Te has quedado sin cobertura. Modo offline activo.',
        type: 'warning',
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshPendingCount, syncNow])

  return (
    <OfflineSyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        lastSyncedAt,
        syncNow,
        enqueueAction,
        refreshPendingCount,
      }}
    >
      {children}
    </OfflineSyncContext.Provider>
  )
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext)
  if (!context) {
    throw new Error('useOfflineSync debe usarse dentro de un OfflineSyncProvider')
  }
  return context
}
