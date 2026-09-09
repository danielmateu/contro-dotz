'use client'

import { useEffect, useState } from 'react'
import { MegaphoneIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppUpdatesModal } from './app-updates-modal'
import {
  getAppUpdatesAction,
  markAppUpdatesAsReadAction,
  AppUpdate,
} from '@/app/actions/app-updates'

export function AppUpdatesWidget() {
  const [open, setOpen] = useState(false)
  const [updates, setUpdates] = useState<AppUpdate[]>([])
  const [hasUnread, setHasUnread] = useState(false)

  const loadUpdates = async () => {
    try {
      const res = await getAppUpdatesAction()
      if (res.updates) {
        setUpdates(res.updates)
        setHasUnread(res.hasUnread)
      }
    } catch (err) {
      console.error('Error cargando novedades:', err)
    }
  }

  useEffect(() => {
    loadUpdates()
  }, [])

  const handleOpenModal = async () => {
    setOpen(true)
    if (hasUnread) {
      setHasUnread(false)
      try {
        await markAppUpdatesAsReadAction()
      } catch (err) {
        console.error('Error al marcar novedades como leídas:', err)
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenModal}
        className="relative gap-1.5 rounded-xl border-border bg-background/80 hover:bg-accent text-foreground transition-all duration-200"
        title="Novedades y Actualizaciones"
      >
        <div className="relative flex items-center justify-center">
          <MegaphoneIcon className={`w-4 h-4 ${hasUnread ? 'text-indigo-500 animate-pulse' : 'text-primary'}`} />
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
            </span>
          )}
        </div>
        <span className="hidden lg:inline font-medium text-xs">Novedades</span>
      </Button>

      <AppUpdatesModal
        open={open}
        onOpenChange={setOpen}
        updates={updates}
      />
    </>
  )
}
