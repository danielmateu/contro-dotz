'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createSavingGoalAction,
  addSavingContributionAction,
  deleteSavingGoalAction,
  deleteSavingContributionAction,
} from '@/app/actions/saving-goals'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress' // Let's check: do we have Progress? If not we render a custom div, but wait, let's render a custom div to ensure maximum visual control and robustness!
import { formatCurrency } from '@/lib/format'
import { PiggyBank, Plus, Calendar, Trash2, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react'

interface SavingGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  created_by: string
  created_at: string
}

interface Contribution {
  id: string
  goal_id: string
  goal_name: string
  user_id: string
  user_name: string
  avatar_url: string
  amount: number
  created_at: string
}

interface Member {
  id: string
  name: string
  avatar_url: string
}

interface SavingGoalsClientProps {
  householdId: string
  currentUserId: string
  isOwner: boolean
  initialGoals: SavingGoal[]
  initialContributions: Contribution[]
  members: Member[]
}

export function SavingGoalsClient({
  householdId,
  currentUserId,
  isOwner,
  initialGoals,
  initialContributions,
  members,
}: SavingGoalsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null)
  const [contributionToDelete, setContributionToDelete] = useState<Contribution | null>(null)

  // Form states
  const [goalName, setGoalName] = useState('')
  const [goalTargetAmount, setGoalTargetAmount] = useState('')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [goalError, setGoalError] = useState('')
  const [goalSuccess, setGoalSuccess] = useState('')

  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionError, setContributionError] = useState('')
  const [contributionSuccess, setContributionSuccess] = useState('')

  // Handlers
  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGoalError('')
    setGoalSuccess('')

    const formData = new FormData()
    formData.append('name', goalName)
    formData.append('target_amount', goalTargetAmount)
    formData.append('target_date', goalTargetDate)

    startTransition(async () => {
      const res = await createSavingGoalAction(householdId, {}, formData)
      if (res.error) {
        setGoalError(res.error)
      } else {
        setGoalSuccess(res.success)
        setGoalName('')
        setGoalTargetAmount('')
        setGoalTargetDate('')
        setTimeout(() => {
          setIsGoalModalOpen(false)
          setGoalSuccess('')
          router.refresh()
        }, 1000)
      }
    })
  }

  const handleAddContribution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedGoal) return
    setContributionError('')
    setContributionSuccess('')

    const formData = new FormData()
    formData.append('amount', contributionAmount)

    startTransition(async () => {
      const res = await addSavingContributionAction(selectedGoal.id, householdId, {}, formData)
      if (res.error) {
        setContributionError(res.error)
      } else {
        setContributionSuccess(res.success)
        setContributionAmount('')
        setTimeout(() => {
          setIsContributionModalOpen(false)
          setContributionSuccess('')
          setSelectedGoal(null)
          router.refresh()
        }, 1000)
      }
    })
  }


  const getDaysRemaining = (targetDateStr: string | null) => {
    if (!targetDateStr) return null
    const target = new Date(targetDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Columna Izquierda/Centro: Tarjetas de Huchas */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground font-heading">Huchas Activas</h2>
          <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
            <DialogTrigger render={
              <Button size="sm" className="flex items-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                Nueva Meta
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Meta de Ahorro</DialogTitle>
                <DialogDescription>
                  Define un objetivo financiero para tu hogar y ahorrad juntos.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                {goalError && (
                  <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{goalError}</AlertDescription>
                  </Alert>
                )}

                {goalSuccess && (
                  <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <AlertTitle>Éxito</AlertTitle>
                    <AlertDescription>{goalSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <Label htmlFor="goal-name">Nombre de la Meta</Label>
                  <Input
                    id="goal-name"
                    placeholder="Ej. Vacaciones de Verano 2027, Sofá nuevo"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="goal-target">Importe Objetivo (€)</Label>
                    <Input
                      id="goal-target"
                      placeholder="500,00"
                      value={goalTargetAmount}
                      onChange={(e) => setGoalTargetAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="goal-date">Fecha Límite (opcional)</Label>
                    <Input
                      id="goal-date"
                      type="date"
                      value={goalTargetDate}
                      onChange={(e) => setGoalTargetDate(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creando...' : 'Crear Meta'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {initialGoals.length === 0 ? (
          <Card className="border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-muted rounded-full text-muted-foreground/80 mb-3">
              <PiggyBank className="h-10 w-10" />
            </div>
            <h3 className="font-bold text-lg text-foreground">No hay metas de ahorro</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Establece vuestra primera hucha virtual para empezar a guardar dinero colaborativamente para viajes, reparaciones o compras compartidas.
            </p>
            <Button size="sm" onClick={() => setIsGoalModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear Meta
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialGoals.map((goal) => {
              const progressPercentage = Math.min(
                100,
                goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0
              )
              const daysRemaining = getDaysRemaining(goal.target_date)
              const isCompleted = goal.current_amount >= goal.target_amount

              return (
                <Card key={goal.id} className="border-slate-200/60 dark:border-slate-800/80 shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-primary/30 transition-all duration-300">
                  {isCompleted && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-bl-lg uppercase tracking-wider shadow-xs animate-pulse">
                      ¡Completada! 🎉
                    </div>
                  )}
                  <div>
                    <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 space-y-0">
                      <div className="space-y-1 pr-6">
                        <CardTitle className="text-base font-bold line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                          {goal.name}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {goal.target_date ? (
                            <span>
                              Hasta el {new Date(goal.target_date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span>Sin límite de fecha</span>
                          )}
                        </CardDescription>
                      </div>

                      <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 border border-primary/20">
                        <PiggyBank className="h-5 w-5" />
                      </div>
                    </CardHeader>

                    <CardContent className="pb-3 space-y-3">
                      {/* Cuentas y Progreso */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs">
                          <span className="text-muted-foreground">Ahorrado:</span>
                          <span className="font-bold text-foreground">
                            {formatCurrency(goal.current_amount)}
                            <span className="text-[10px] font-normal text-muted-foreground"> de {formatCurrency(goal.target_amount)}</span>
                          </span>
                        </div>

                        {/* Barra de progreso personalizada */}
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`font-semibold ${isCompleted ? 'text-emerald-500' : 'text-primary'}`}>
                            {progressPercentage}% completado
                          </span>
                          {daysRemaining !== null && (
                            <span className={daysRemaining < 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                              {daysRemaining < 0
                                ? 'Excedido'
                                : daysRemaining === 0
                                ? '¡Hoy es el último día!'
                                : `Quedan ${daysRemaining} días`}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-3">
                    <Button
                      size="sm"
                      variant={isCompleted ? "outline" : "default"}
                      className="flex-1 text-xs h-8.5 rounded-lg"
                      onClick={() => {
                        setSelectedGoal(goal)
                        setIsContributionModalOpen(true)
                      }}
                    >
                      Aportar Fondos
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8.5 w-8.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                      onClick={() => setGoalToDelete(goal)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Columna Derecha: Aportaciones Recientes */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground font-heading">Aportaciones</h2>
        
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Últimas Transacciones</CardTitle>
            <CardDescription className="text-xs">
              Historial de aportaciones realizadas a los ahorros familiares.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-4">
            {initialContributions.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No hay aportaciones registradas.
              </div>
            ) : (
              <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
                {initialContributions.map((c) => {
                  const isOwn = c.user_id === currentUserId

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800/30 last:border-0 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8.5 w-8.5 border border-border/40 shrink-0">
                          {c.avatar_url ? (
                            <AvatarImage src={c.avatar_url} alt={c.user_name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {c.user_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-foreground truncate leading-snug">
                            {c.user_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate leading-tight">
                            en meta: <strong className="text-foreground/80 font-medium">{c.goal_name}</strong>
                          </span>
                          <span className="text-[9px] text-muted-foreground mt-0.5">
                            {new Date(c.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(c.amount)}
                        </span>
                        {isOwn && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                            onClick={() => setContributionToDelete(c)}
                            disabled={isPending}
                          >
                            <XIcon className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Aportar Fondos */}
      <Dialog open={isContributionModalOpen} onOpenChange={setIsContributionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aportar Fondos</DialogTitle>
            <DialogDescription>
              Añade fondos a la hucha: <strong className="text-foreground">{selectedGoal?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddContribution} className="space-y-4">
            {contributionError && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{contributionError}</AlertDescription>
              </Alert>
            )}

            {contributionSuccess && (
              <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{contributionSuccess}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="contribution-amount">Importe a Aportar (€)</Label>
              <Input
                id="contribution-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                required
                className="bg-muted/50 focus:bg-background text-lg font-bold"
              />
              <p className="text-[10px] text-muted-foreground">
                El dinero aportado se sumará automáticamente al total de la hucha seleccionada.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Aportar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    {/* Diálogo de Confirmación para Eliminar Meta */}
    <AlertDialog open={!!goalToDelete} onOpenChange={(open) => !open && setGoalToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar meta de ahorro?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar la meta de ahorro &quot;{goalToDelete?.name}&quot;? 
            Se borrarán también todas sus aportaciones de forma permanente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              if (goalToDelete) {
                startTransition(async () => {
                  const res = await deleteSavingGoalAction(goalToDelete.id, householdId)
                  if (res.error) {
                    alert(res.error)
                  } else {
                    setGoalToDelete(null)
                    router.refresh()
                  }
                })
              }
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isPending ? 'Eliminando...' : 'Sí, eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Diálogo de Confirmación para Eliminar Aportación */}
    <AlertDialog open={!!contributionToDelete} onOpenChange={(open) => !open && setContributionToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar aportación?</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que quieres eliminar esta aportación de {contributionToDelete ? formatCurrency(contributionToDelete.amount) : ''}? 
            El dinero acumulado en la hucha se restará automáticamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              if (contributionToDelete) {
                startTransition(async () => {
                  const res = await deleteSavingContributionAction(contributionToDelete.id)
                  if (res.error) {
                    alert(res.error)
                  } else {
                    setContributionToDelete(null)
                    router.refresh()
                  }
                })
              }
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isPending ? 'Eliminando...' : 'Sí, eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
