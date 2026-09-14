'use client'

import { useI18n } from '@/lib/i18n/i18n-context'
import { HouseholdTask } from '@/app/actions/tasks'
import { TaskCard } from './task-card'
import { Badge } from '@/components/ui/badge'
import { Clock, PlayCircle, CheckCircle2 } from 'lucide-react'

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
  },
  {
    id: 'in_progress',
    titleKey: 'tasks.statusInProgress',
    icon: PlayCircle,
    headerColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  {
    id: 'completed',
    titleKey: 'tasks.statusCompleted',
    icon: CheckCircle2,
    headerColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
]

export function TasksKanbanView({
  tasks,
  currentUserId,
  onEditTask,
  onTaskStatusChanged,
}: TasksKanbanViewProps) {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id)
        const ColIcon = col.icon

        return (
          <div
            key={col.id}
            className="flex flex-col gap-3 p-4 rounded-3xl border border-border/40 bg-card/40 min-h-[400px]"
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

            {/* Column Cards */}
            <div className="flex flex-col gap-3 pt-1">
              {columnTasks.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border/40 rounded-2xl">
                  <p className="text-xs text-muted-foreground font-medium">
                    Sin tareas en esta columna
                  </p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    onEdit={onEditTask}
                    onStatusChanged={onTaskStatusChanged}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
