'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/i18n-context'
import { HouseholdTask, getTasksAction } from '@/app/actions/tasks'
import { TaskCard } from './task-card'
import { TaskDialog } from './task-dialog'
import { TaskFilters } from './task-filters'
import { TasksKanbanView } from './tasks-kanban-view'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckSquare, Plus, Sparkles, Clock, CheckCircle2, ListTodo, ShieldAlert } from 'lucide-react'

interface HouseholdMemberOption {
  id: string
  displayName: string
}

interface TasksViewClientProps {
  initialTasks: HouseholdTask[]
  currentUserId?: string
  householdId?: string | null
  householdMembers?: HouseholdMemberOption[]
}

export function TasksViewClient({
  initialTasks,
  currentUserId,
  householdId,
  householdMembers = [],
}: TasksViewClientProps) {
  const { t } = useI18n()
  const [tasks, setTasks] = useState<HouseholdTask[]>(initialTasks)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<HouseholdTask | null>(null)

  const reloadTasks = async () => {
    try {
      const refreshed = await getTasksAction(householdId)
      setTasks(refreshed)
      window.dispatchEvent(new CustomEvent('contro-tasks-updated'))
    } catch (err) {
      console.error('Error refreshing tasks:', err)
    }
  }

  // Escuchar eventos de actualización de tareas desde cualquier componente
  useEffect(() => {
    const handleCustomUpdate = async () => {
      try {
        const refreshed = await getTasksAction(householdId)
        setTasks(refreshed)
      } catch (err) {
        console.error('Error refreshing tasks on custom event:', err)
      }
    }

    window.addEventListener('contro-tasks-updated', handleCustomUpdate)
    return () => {
      window.removeEventListener('contro-tasks-updated', handleCustomUpdate)
    }
  }, [householdId])

  const handleCreateNew = () => {
    setTaskToEdit(null)
    setDialogOpen(true)
  }

  const handleEdit = (task: HouseholdTask) => {
    setTaskToEdit(task)
    setDialogOpen(true)
  }

  // Filtered Tasks Computation
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(query)
        const matchDesc = task.description?.toLowerCase().includes(query) || false
        if (!matchTitle && !matchDesc) return false
      }

      // Scope
      if (scopeFilter === 'household' && task.is_private) return false
      if (scopeFilter === 'private' && !task.is_private) return false

      // Status
      if (statusFilter !== 'all' && task.status !== statusFilter) return false

      // Assignee
      if (assigneeFilter !== 'all' && task.assigned_to !== assigneeFilter) return false

      return true
    })
  }, [tasks, searchQuery, scopeFilter, statusFilter, assigneeFilter])

  // Stats Computation
  const stats = useMemo(() => {
    const total = tasks.length
    const pending = tasks.filter((t) => t.status === 'pending').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const totalXp = tasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.xp_reward || 15), 0)

    return { total, pending, inProgress, completed, totalXp }
  }, [tasks])

  return (
    <div className="space-y-6">
      {/* Header con título y botón de Nueva Tarea */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary shadow-xs">
              <CheckSquare className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              {t('tasks.title')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {t('tasks.subtitle')}
          </p>
        </div>

        <Button
          onClick={handleCreateNew}
          className="bg-linear-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 px-5 py-2.5 h-auto text-xs sm:text-sm gap-2 transition-all hover:scale-[1.02] active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('tasks.newTask')}</span>
        </Button>
      </div>

      {/* Tarjetas de Estadísticas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-border/40 bg-card/60 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-semibold">
            <span>Total Tareas</span>
            <ListTodo className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-heading">{stats.total}</p>
        </Card>

        <Card className="p-4 border-border/40 bg-card/60 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-semibold">
            <span>Pendientes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-heading">
            {stats.pending + stats.inProgress}
          </p>
        </Card>

        <Card className="p-4 border-border/40 bg-card/60 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-semibold">
            <span>Completadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-heading">
            {stats.completed}
          </p>
        </Card>

        <Card className="p-4 border-border/40 bg-card/60 rounded-2xl space-y-1.5 shadow-xs">
          <div className="flex justify-between items-center text-muted-foreground text-xs font-semibold">
            <span>XP para Dotzi</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-extrabold text-primary font-heading">+{stats.totalXp} XP</p>
        </Card>
      </div>

      {/* Barra de Filtros (Buscador, Ámbito, Estado, Asignado, Cambiador de Vista) */}
      <TaskFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        scopeFilter={scopeFilter}
        onScopeFilterChange={setScopeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        householdMembers={householdMembers}
      />

      {/* Lista de Tareas o Tablero Kanban */}
      {viewMode === 'kanban' ? (
        <TasksKanbanView
          tasks={filteredTasks}
          currentUserId={currentUserId}
          onEditTask={handleEdit}
          onTaskStatusChanged={reloadTasks}
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-border/60 bg-card/40 rounded-3xl space-y-3">
              <div className="p-3 bg-muted/40 rounded-full w-12 h-12 mx-auto flex items-center justify-center text-muted-foreground">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground font-heading">
                  {t('tasks.emptyTitle')}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t('tasks.emptyDesc')}
                </p>
              </div>
              <Button
                onClick={handleCreateNew}
                variant="outline"
                className="rounded-2xl text-xs font-bold gap-1.5 border-border/80"
              >
                <Plus className="w-4 h-4" />
                <span>{t('tasks.newTask')}</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    onEdit={handleEdit}
                    onStatusChanged={reloadTasks}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Dialog para Crear/Editar Tarea */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        taskToEdit={taskToEdit}
        householdId={householdId}
        householdMembers={householdMembers}
        onSuccess={reloadTasks}
      />
    </div>
  )
}
