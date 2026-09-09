'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, Rocket, Zap, Wrench, Megaphone, Calendar } from 'lucide-react'
import { AppUpdate } from '@/app/actions/app-updates'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppUpdatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  updates: AppUpdate[]
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  feature: {
    label: 'Nueva Función',
    icon: Rocket,
    className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  },
  improvement: {
    label: 'Mejora',
    icon: Zap,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  fix: {
    label: 'Corrección',
    icon: Wrench,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  announcement: {
    label: 'Anuncio',
    icon: Megaphone,
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
}

export function AppUpdatesModal({ open, onOpenChange, updates }: AppUpdatesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredUpdates = updates.filter((item) => {
    if (selectedCategory === 'all') return true
    return item.category === selectedCategory
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 overflow-hidden rounded-2xl border border-border shadow-2xl">
        {/* Cabecera del modal */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
              <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Novedades y Actualizaciones
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Descubre las últimas mejoras y nuevas funciones de Control Dotz
              </DialogDescription>
            </div>
          </div>

          {/* Filtros de Categoría */}
          <div className="flex flex-wrap gap-1.5 mt-4 pt-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              Todas ({updates.length})
            </button>
            <button
              onClick={() => setSelectedCategory('feature')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'feature'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              🚀 Novedades
            </button>
            <button
              onClick={() => setSelectedCategory('improvement')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'improvement'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              ⚡ Mejoras
            </button>
            <button
              onClick={() => setSelectedCategory('fix')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === 'fix'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              🛠️ Correcciones
            </button>
          </div>
        </DialogHeader>

        {/* Lista de Actualizaciones */}
        <ScrollArea className="max-h-[55vh] p-6">
          {filteredUpdates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No hay novedades registradas en esta categoría.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredUpdates.map((update) => {
                const config = CATEGORY_CONFIG[update.category] || CATEGORY_CONFIG.feature
                const IconComponent = config.icon

                let formattedDate = ''
                try {
                  formattedDate = format(new Date(update.published_at), "d 'de' MMMM, yyyy", {
                    locale: es,
                  })
                } catch {
                  formattedDate = update.published_at
                }

                return (
                  <div
                    key={update.id}
                    className="group relative p-5 rounded-xl border border-border/60 bg-card hover:border-indigo-500/30 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`gap-1.5 px-2.5 py-0.5 text-xs font-medium border ${config.className}`}>
                          <IconComponent className="h-3.5 w-3.5" />
                          {config.label}
                        </Badge>
                        {update.version && (
                          <Badge variant="secondary" className="text-xs font-mono font-semibold bg-muted text-muted-foreground">
                            {update.version}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {update.title}
                    </h3>

                    <div className="mt-2 text-sm text-muted-foreground/90 whitespace-pre-line leading-relaxed">
                      {update.content}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
