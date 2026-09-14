'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { getTasksAction, updateTaskStatusAction, HouseholdTask } from '@/app/actions/tasks'
import { toast } from '@/components/ui/toast'
import { Bell, CheckSquare, Clock, CheckCircle2, ArrowRight, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderTasksTriggerProps {
  householdId?: string
}

export function HeaderTasksTrigger({ householdId }: HeaderTasksTriggerProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [tasks, setTasks] = useState<HouseholdTask[]>([])
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      const allTasks = await getTasksAction(householdId)
      const pendingList = allTasks.filter((t) => t.status !== 'completed')
      setTasks(pendingList)
    } catch (err) {
      console.error('Error loading tasks for notification bell:', err)
    }
  }

  useEffect(() => {
    fetchTasks()

    // Listener para eventos locales del mismo cliente
    const handleCustomUpdate = () => fetchTasks()
    window.addEventListener('contro-tasks-updated', handleCustomUpdate)

    // Listener para Supabase Realtime
    const supabase = createClient()
    const channel = supabase
      .channel(`header_tasks_${householdId || 'user'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_tasks',
        },
        () => {
          fetchTasks()
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('contro-tasks-updated', handleCustomUpdate)
      supabase.removeChannel(channel)
    }
  }, [householdId])

  const handleQuickComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingId(taskId)
    startTransition(async () => {
      const res = await updateTaskStatusAction(taskId, 'completed')
      setLoadingId(null)
      if (res.success) {
        toast.add({
          title: t('tasks.statusCompleted'),
          description: res.xpEarned ? t('tasks.xpEarned', { xp: res.xpEarned }) : undefined,
        })
        fetchTasks()
        window.dispatchEvent(new CustomEvent('contro-tasks-updated'))
      } else {
        toast.add({
          title: 'Error',
          description: res.error || 'No se pudo completar la tarea',
        })
      }
    })
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    medium: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  }

  if (tasks.length === 0) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-transform active:scale-95 text-muted-foreground hover:text-foreground"
            aria-label={t('tasks.pendingNotifications')}
          >
            <Bell className="h-4 w-4" />
            {tasks.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
                {tasks.length > 9 ? '9+' : tasks.length}
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-2rem)] sm:w-80 p-0 border border-border/80 rounded-2xl overflow-hidden shadow-xl bg-background/95 backdrop-blur-xl"
      >
        {/* Encabezado Popover */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/40">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-cyan-500" />
            <span className="font-semibold text-sm text-foreground">
              {t('tasks.pendingNotifications')}
            </span>
          </div>
          {tasks.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">
              {t('tasks.pendingCount', { count: tasks.length })}
            </Badge>
          )}
        </div>

        {/* Lista de Tareas Pendientes */}
        <div className="max-h-72 overflow-y-auto divide-y divide-border/30 p-1">
          {tasks.length === 0 ? (
            <div className="py-8 px-4 text-center text-muted-foreground flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-500">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium">{t('tasks.noPendingTasks')}</p>
            </div>
          ) : (
            tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="group flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-medium text-xs text-foreground truncate block">
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span
                      className={cn(
                        'px-1.5 py-0.2 font-medium rounded-full border',
                        priorityColors[task.priority] || priorityColors.medium
                      )}
                    >
                      {task.priority === 'urgent'
                        ? 'Urgente'
                        : task.priority === 'high'
                        ? 'Alta'
                        : task.priority === 'low'
                        ? 'Baja'
                        : 'Media'}
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  disabled={loadingId === task.id}
                  onClick={(e) => handleQuickComplete(task.id, e)}
                  className="h-7 w-7 shrink-0 rounded-full border-cyan-500/30 text-cyan-600 hover:bg-cyan-500 hover:text-white dark:text-cyan-400 transition-colors"
                  title={t('tasks.completeAction')}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer / Link a /tasks */}
        <div className="p-2 border-t border-border/50 bg-muted/20">
          <Link
            href="/tasks"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground font-medium hover:bg-accent/50 transition-colors"
          >
            <span>{t('tasks.viewAllTasks')}</span>
            <ArrowRight className="h-3.5 w-3.5 text-cyan-500" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
