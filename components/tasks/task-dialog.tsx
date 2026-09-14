'use client'

import { useState, useEffect } from 'react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { HouseholdTask, createTaskAction, updateTaskAction } from '@/app/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Sparkles, CheckSquare, Lock, Users, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface HouseholdMemberOption {
  id: string
  displayName: string
}

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskToEdit?: HouseholdTask | null
  householdId?: string | null
  householdMembers?: HouseholdMemberOption[]
  onSuccess?: () => void
}

const PRIORITY_XP: Record<string, number> = {
  low: 10,
  medium: 15,
  high: 25,
  urgent: 40,
}

export function TaskDialog({
  open,
  onOpenChange,
  taskToEdit,
  householdId,
  householdMembers = [],
  onSuccess,
}: TaskDialogProps) {
  const { t } = useI18n()
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [isPrivate, setIsPrivate] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string>('unassigned')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setDescription(taskToEdit.description || '')
      setPriority(taskToEdit.priority)
      setIsPrivate(taskToEdit.is_private)
      setAssignedTo(taskToEdit.assigned_to || 'unassigned')
      setDueDate(taskToEdit.due_date ? taskToEdit.due_date.substring(0, 10) : '')
    } else {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setIsPrivate(false)
      setAssignedTo('unassigned')
      setDueDate('')
    }
  }, [taskToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.add({ title: 'Introduce un título para la tarea', type: 'error' })
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('priority', priority)
      formData.append('is_private', isPrivate ? 'true' : 'false')
      if (householdId && !isPrivate) {
        formData.append('household_id', householdId)
      }
      if (assignedTo !== 'unassigned') {
        formData.append('assigned_to', assignedTo)
      }
      if (dueDate) {
        formData.append('due_date', dueDate)
      }

      let res: { success: boolean; error?: string }
      if (taskToEdit) {
        res = await updateTaskAction(taskToEdit.id, formData)
      } else {
        res = await createTaskAction(formData)
      }

      if (res.success) {
        toast.add({ title: taskToEdit ? 'Tarea actualizada' : '¡Tarea creada con éxito!', type: 'success' })
        window.dispatchEvent(new CustomEvent('contro-tasks-updated'))
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        toast.add({ title: res.error || 'Error al guardar la tarea', type: 'error' })
      }
    } catch {
      toast.add({ title: 'Error de red al guardar la tarea', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const currentXp = PRIORITY_XP[priority] || 15

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 border-slate-200/40 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <CheckSquare className="w-4 h-4" />
            <span>{taskToEdit ? t('tasks.editTask') : t('tasks.newTask')}</span>
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight font-heading">
            {taskToEdit ? t('tasks.editTaskTitle') : t('tasks.createTaskTitle')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('tasks.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Título de la tarea */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">
              {t('tasks.taskNameLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('tasks.taskNamePlaceholder')}
              required
              className="rounded-xl h-10 bg-slate-500/5 focus:bg-background border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Descripción / Detalles */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              {t('tasks.descriptionLabel')}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tasks.descriptionPlaceholder')}
              rows={2}
              className="rounded-xl bg-slate-500/5 focus:bg-background border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          {/* Grid de Prioridad & Ámbito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Prioridad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>{t('tasks.priorityLabel')}</span>
                <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  +{currentXp} XP
                </span>
              </Label>
              <Select value={priority} onValueChange={(val) => val && setPriority(val as any)}>
                <SelectTrigger className="rounded-xl h-10 text-xs bg-slate-500/5 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="low">{t('tasks.priorityLow')}</SelectItem>
                  <SelectItem value="medium">{t('tasks.priorityMedium')}</SelectItem>
                  <SelectItem value="high">{t('tasks.priorityHigh')}</SelectItem>
                  <SelectItem value="urgent">{t('tasks.priorityUrgent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asignar a */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('tasks.assignedToLabel')}</Label>
              <Select value={assignedTo} onValueChange={(val) => setAssignedTo(val || 'unassigned')} disabled={isPrivate}>
                <SelectTrigger className="rounded-xl h-10 text-xs bg-slate-500/5 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="unassigned">{t('tasks.unassigned')}</SelectItem>
                  {householdMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha Límite */}
          <div className="space-y-1.5">
            <Label htmlFor="dueDate" className="text-xs font-semibold flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{t('tasks.dueDateLabel')}</span>
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl h-10 bg-slate-500/5 focus:bg-background border-slate-200 dark:border-slate-800 text-xs"
            />
          </div>

          {/* Toggle de Tarea Privada vs Compartida */}
          <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-500/5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                {isPrivate ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Users className="w-3.5 h-3.5 text-blue-500" />}
                <span>{isPrivate ? t('tasks.scopePrivate') : t('tasks.scopeHousehold')}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isPrivate
                  ? 'Sólo tú podrás ver y gestionar esta tarea'
                  : 'Visible y asignable para todos los miembros del hogar'}
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={(checked) => {
                setIsPrivate(checked)
                if (checked) setAssignedTo('unassigned')
              }}
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? t('tasks.saving') : t('tasks.saveTask')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
