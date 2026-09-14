'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { HouseholdTask, updateTaskStatusAction } from '@/app/actions/tasks'
import { TaskCard } from './task-card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TasksKanbanViewProps {
  tasks: HouseholdTask[]
  currentUserId?: string
  onEditTask: (task: HouseholdTask) => void
  onTaskStatusChanged: () => void
}

const COLUMNS = [
  {
    id: 'pending',
    titleKey: 'tasks.statusPending',
    icon: Clock,
    headerColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    hoverBorder: 'border-amber-500/50 bg-amber-500/5 ring-2 ring-amber-500/20',
  },
  {
    id: 'in_progress',
    titleKey: 'tasks.statusInProgress',
    icon: PlayCircle,
    headerColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    hoverBorder: 'border-blue-500/50 bg-blue-500/5 ring-2 ring-blue-500/20',
  },
  {
    id: 'completed',
    titleKey: 'tasks.statusCompleted',
    icon: CheckCircle2,
    headerColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    hoverBorder: 'border-emerald-500/50 bg-emerald-500/5 ring-2 ring-emerald-500/20',
  },
]

export function TasksKanbanView({
  tasks,
  currentUserId,
  onEditTask,
  onTaskStatusChanged,
}: TasksKanbanViewProps) {
  const { t } = useI18n()
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingTaskId(taskId)
  }

  const handleDragEnd = () => {
    setDraggingTaskId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: 'pending' | 'in_progress' | 'completed') => {
    e.preventDefault()
    setDragOverColumn(null)

    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId
    if (!taskId) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === targetStatus) {
      setDraggingTaskId(null)
      return
    }

    setDraggingTaskId(null)

    try {
      const res = await updateTaskStatusAction(taskId, targetStatus)
      if (res.success) {
        if (res.xpEarned && res.xpEarned > 0) {
          toast.add({
            title: t('tasks.xpEarned', { xp: res.xpEarned }),
            description: `¡Excelente trabajo completando "${task.title}"!`,
            type: 'success',
          })
        } else {
          toast.add({
            title: 'Estado de tarea actualizado',
            type: 'success',
          })
        }
        window.dispatchEvent(new CustomEvent('contro-tasks-updated'))
        onTaskStatusChanged()
      } else {
        toast.add({
          title: res.error || 'Error al mover la tarea',
          type: 'error',
        })
      }
    } catch {
      toast.add({
        title: 'Error de conexión al mover la tarea',
        type: 'error',
      })
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id)
        const ColIcon = col.icon
        const isHovered = dragOverColumn === col.id

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id as any)}
            className={cn(
              'flex flex-col gap-3 p-4 rounded-3xl border border-border/40 bg-card/40 min-h-[450px] transition-all duration-200',
              isHovered && col.hoverBorder
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`px-2.5 py-1 rounded-xl font-extrabold gap-1.5 ${col.headerColor}`}>
                  <ColIcon className="w-3.5 h-3.5" />
                  <span>{t(col.titleKey)}</span>
                </Badge>
              </div>
              <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex flex-col gap-3 pt-1 flex-1">
              {columnTasks.length === 0 ? (
                <div
                  className={cn(
                    'py-12 text-center border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-colors',
                    isHovered && 'border-primary/50 bg-primary/5 text-primary font-semibold'
                  )}
                >
                  <p className="text-xs text-muted-foreground font-medium">
                    {isHovered ? 'Soltar tarea aquí' : 'Sin tareas en esta columna'}
                  </p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const isDragging = draggingTaskId === task.id

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'relative group transition-all duration-200 cursor-grab active:cursor-grabbing select-none',
                        isDragging ? 'opacity-40 scale-95 grayscale' : 'hover:scale-[1.01]'
                      )}
                    >
                      <TaskCard
                        task={task}
                        currentUserId={currentUserId}
                        onEdit={onEditTask}
                        onStatusChanged={onTaskStatusChanged}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
