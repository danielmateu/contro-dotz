'use client'

import { useOfflineSync } from '@/components/providers/offline-sync-provider'
import { getOfflineCache, setOfflineCache } from '@/lib/offline/offline-store'

export function useOffline() {
  const syncState = useOfflineSync()

  return {
    ...syncState,
    getCache: getOfflineCache,
    setCache: setOfflineCache,
  }
}
