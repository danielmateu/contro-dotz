'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format, isPast, isToday } from 'date-fns'
import { es, enUS, ca } from 'date-fns/locale'
import { useI18n } from '@/lib/i18n/i18n-context'
import { HouseholdTask, updateTaskStatusAction, deleteTaskAction } from '@/app/actions/tasks'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Calendar,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  Lock,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
} from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface TaskCardProps {
  task: HouseholdTask
  currentUserId?: string
  onEdit: (task: HouseholdTask) => void
  onStatusChanged?: () => void
}

const PRIORITY_STYLES: Record<string, { labelKey: string; className: string; icon: any }> = {
  low: {
    labelKey: 'tasks.priorityLow',
    className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    icon: Clock,
  },
  medium: {
    labelKey: 'tasks.priorityMedium',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Sparkles,
  },
  high: {
    labelKey: 'tasks.priorityHigh',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: AlertTriangle,
  },
  urgent: {
    labelKey: 'tasks.priorityUrgent',
    className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse',
    icon: AlertTriangle,
  },
}

export function TaskCard({ task, currentUserId, onEdit, onStatusChanged }: TaskCardProps) {
  const { t, locale } = useI18n()
  const [updating, setUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const dateLocale = locale === 'ca' ? ca : locale === 'en' ? enUS : es

  const isCompleted = task.status === 'completed'
  const isInProgress = task.status === 'in_progress'

  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
  const PriorityIcon = priorityStyle.icon

  const formattedDueDate = task.due_date
    ? format(new Date(task.due_date), 'dd MMM', { locale: dateLocale })
    : null

  const isDueDateOverdue = task.due_date && !isCompleted && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date))

  const handleStatusChange = async (nextStatus: 'pending' | 'in_progress' | 'completed') => {
    setUpdating(true)
    try {
      const res = await updateTaskStatusAction(task.id, nextStatus)
      if (res.success) {
        if (res.xpEarned && res.xpEarned > 0) {
          toast.add({
            title: t('tasks.xpEarned', { xp: res.xpEarned }),
            description: `¡Excelente trabajo completando "${task.title}"!`,
            type: 'success',
          })
        }
        window.dispatchEvent(new CustomEvent('contro-tasks-updated'))
        if (onStatusChanged) onStatusChanged()
      } else {
        toast.add({
          title: res.error || 'Error al cambiar estado',
          type: 'error',
        })
      }
    } catch {
      toast.add({
        title: 'Error de conexión',
        type: 'error',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await deleteTaskAction(task.id)
      if (res.success) {
        toast.add({
          title: 'Tarea eliminada con éxito',
          type: 'success',
        })
        window.dispatchEvent(new CustomEvent('contro-tasks-updated'))
        if (onStatusChanged) onStatusChanged()
      } else {
        toast.add({
          title: res.error || 'Error al eliminar tarea',
          type: 'error',
        })
      }
    } catch {
      toast.add({
        title: 'Error al conectar',
        type: 'error',
      })
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${
            isCompleted
              ? 'bg-slate-500/5 border-slate-200/50 dark:border-slate-800/50 opacity-75'
              : isInProgress
              ? 'bg-blue-500/5 border-blue-500/30 dark:border-blue-500/20'
              : 'bg-card border-border/60 hover:border-border'
          }`}
        >
          <div className="flex flex-col gap-2.5">
            {/* Top Row: Checkbox + Title + More Options Menu */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="pt-0.5 shrink-0">
                  <Checkbox
                    checked={isCompleted}
                    disabled={updating}
                    onCheckedChange={(checked) => {
                      handleStatusChange(checked ? 'completed' : 'pending')
                    }}
                    className="size-4.5 sm:size-5 rounded-lg border-2 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all cursor-pointer"
                  />
                </div>

                <h3
                  className={`font-semibold text-xs sm:text-sm leading-snug break-words ${
                    isCompleted
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground font-heading'
                  }`}
                >
                  {task.title}
                </h3>
              </div>

              {/* Options Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0 -mr-1 -mt-1"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem onClick={() => onEdit(task)} className="gap-2 cursor-pointer font-medium">
                    <Pencil className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('common.edit')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('common.delete')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Description */}
            {task.description && (
              <p
                className={`text-xs leading-relaxed line-clamp-2 break-words pl-7 ${
                  isCompleted ? 'text-muted-foreground/60' : 'text-muted-foreground'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Badges & Quick Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-[11px]">
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                {/* Priority Badge */}
                <Badge variant="outline" className={`px-2 py-0.5 rounded-lg font-bold gap-1 ${priorityStyle.className}`}>
                  <PriorityIcon className="w-3 h-3" />
                  <span>{t(priorityStyle.labelKey)}</span>
                </Badge>

                {/* Scope Badge (Household vs Private) */}
                <Badge variant="outline" className="px-1.5 py-0.5 rounded-lg font-medium gap-1 bg-muted/30 border-border/40 text-muted-foreground">
                  {task.is_private ? (
                    <>
                      <Lock className="w-2.5 h-2.5 text-amber-500" />
                      <span>{t('tasks.scopePrivate')}</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-2.5 h-2.5 text-blue-500" />
                      <span>{t('tasks.scopeHousehold')}</span>
                    </>
                  )}
                </Badge>

                {/* Due Date Badge */}
                {formattedDueDate && (
                  <span
                    className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-lg border ${
                      isDueDateOverdue
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                        : 'bg-muted/40 border-border/40 text-muted-foreground'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDueDate}</span>
                  </span>
                )}

                {/* Assignee Avatar */}
                {task.assignee_name && (
                  <span className="inline-flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                    <Avatar className="size-4">
                      <AvatarImage src={task.assignee_avatar || undefined} />
                      <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                        {task.assignee_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.assignee_name}</span>
                  </span>
                )}
              </div>

              {/* Quick Status Action Button */}
              {!isCompleted && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange(isInProgress ? 'completed' : 'in_progress')
                  }}
                  className={`h-7 px-2.5 text-[11px] font-bold rounded-xl gap-1 shrink-0 ${
                    isInProgress
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                  }`}
                >
                  {isInProgress ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('tasks.completeAction')}</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{t('tasks.inProgressAction')}</span>
                    </>
                  )}
                </Button>
              )}

              {isCompleted && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={updating}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange('pending')
                  }}
                  className="h-7 px-2 text-[11px] font-medium rounded-xl text-muted-foreground hover:bg-muted gap-1 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('tasks.reopenAction')}</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Alert Dialog for Deleting Task */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">{t('tasks.deleteTaskTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tasks.deleteTaskDesc', { title: task.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
            >
              {deleting ? t('common.loading') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
