'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Receipt, 
  MessageSquare, 
  ShoppingBasket, 
  Check, 
  PiggyBank, 
  Sparkles,
  Activity
} from 'lucide-react'

export interface ActivityEvent {
  id: string
  type: 'expense' | 'message' | 'shopping_add' | 'shopping_bought' | 'saving_contribution'
  title: string
  amount?: number
  user_name: string
  avatar_url?: string
  date: string
}

interface ActivityFeedProps {
  activities: ActivityEvent[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  // Función para parsear texto en negrita simple (**texto**)
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  // Obtener icono e info visual de la actividad
  const getActivityMeta = (type: string) => {
    switch (type) {
      case 'expense':
        return {
          icon: <Receipt className="h-4 w-4" />,
          bgColor: 'bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-500/20',
        }
      case 'message':
        return {
          icon: <MessageSquare className="h-4 w-4" />,
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 border border-indigo-500/20',
        }
      case 'shopping_add':
        return {
          icon: <ShoppingBasket className="h-4 w-4" />,
          bgColor: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-500 border border-cyan-500/20',
        }
      case 'shopping_bought':
        return {
          icon: <Check className="h-4 w-4" />,
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-500/20',
        }
      case 'saving_contribution':
        return {
          icon: <PiggyBank className="h-4 w-4" />,
          bgColor: 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-500/20',
        }
      default:
        return {
          icon: <Sparkles className="h-4 w-4" />,
          bgColor: 'bg-slate-50 dark:bg-slate-900/40 text-slate-500 border border-slate-500/10',
        }
    }
  }

  // Formatear fecha
  const formatActivityDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="border-slate-200/50 shadow-md h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Actividad del Hogar
        </CardTitle>
        <CardDescription className="text-xs">
          Últimos movimientos colaborativos de la familia en tiempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-0 pb-4 max-h-[380px]">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground">
            No hay actividad reciente registrada en el hogar.
          </div>
        ) : (
          <div className="space-y-0.5">
            {activities.map((activity) => {
              const meta = getActivityMeta(activity.type)
              const isGemini = activity.user_name === 'Gemini AI'

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800/30 last:border-0 hover:bg-muted/10 transition-all duration-200"
                >
                  {/* Avatar de usuario */}
                  <Avatar className={`h-8 w-8 shrink-0 border border-border/40 ${isGemini ? 'ring-1 ring-primary/40' : ''}`}>
                    {activity.avatar_url ? (
                      <AvatarImage src={activity.avatar_url} alt={activity.user_name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="bg-primary/5 text-primary font-semibold text-[10px]">
                      {activity.user_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Cuerpo de la actividad */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-xs text-muted-foreground leading-normal break-words">
                      <span className="font-bold text-foreground mr-1">
                        {activity.user_name}
                      </span>
                      {renderFormattedText(activity.title)}
                    </p>
                    
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                      <span>{formatActivityDate(activity.date)}</span>
                    </div>
                  </div>

                  {/* Icono de tipo */}
                  <div className={`h-6.5 w-6.5 rounded-lg flex items-center justify-center shrink-0 ${meta.bgColor}`}>
                    {meta.icon}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
