'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Badge } from '@/components/ui/badge'
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
import { formatCurrency } from '@/lib/format'
import {
  PiggyBank,
  Plus,
  Calendar,
  Trash2,
  ShieldAlert,
  Sparkles,
  PlusCircle,
  TrendingUp,
  Percent,
  Coins,
  PartyPopper,
  Infinity as InfinityIcon,
  CheckCircle2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useGameState } from '@/lib/game/game-context'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'

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
  totalMonthlySalary?: number
  totalHouseholdSaved?: number
  currentMonthSavings?: number
}

interface RewardCelebration {
  amount: number
  coinsEarned: number
  questCompleted: boolean
}

export function SavingGoalsClient({
  householdId,
  currentUserId,
  isOwner,
  initialGoals,
  initialContributions,
  members,
  totalMonthlySalary = 0,
  totalHouseholdSaved = 0,
  currentMonthSavings = 0,
}: SavingGoalsClientProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const { gameState, updateGameState } = useGameState()
  const [isPending, startTransition] = useTransition()

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingGoal | null>(null)
  const [goalToDelete, setGoalToDelete] = useState<SavingGoal | null>(null)
  const [contributionToDelete, setContributionToDelete] = useState<Contribution | null>(null)
  const [rewardCelebration, setRewardCelebration] = useState<RewardCelebration | null>(null)

  // Form states
  const [goalName, setGoalName] = useState('')
  const [isFreeGoal, setIsFreeGoal] = useState(false)
  const [goalTargetAmount, setGoalTargetAmount] = useState('')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [goalError, setGoalError] = useState('')
  const [goalSuccess, setGoalSuccess] = useState('')

  const [contributionAmount, setContributionAmount] = useState('')
  const [contributionError, setContributionError] = useState('')
  const [contributionSuccess, setContributionSuccess] = useState('')

  // Cálculos de Salario y Ratio de Ahorro
  const salarySavingsPercent =
    totalMonthlySalary > 0 ? Math.round((currentMonthSavings / totalMonthlySalary) * 100) : 0

  // Handlers
  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setGoalError('')
    setGoalSuccess('')

    const formData = new FormData()
    formData.append('name', goalName)
    formData.append('target_amount', isFreeGoal ? '0' : goalTargetAmount)
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
        setIsFreeGoal(false)
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

    const normalizedAmt = contributionAmount.trim().replace(',', '.')
    const addedAmount = parseFloat(normalizedAmt)
    if (isNaN(addedAmount) || addedAmount <= 0) {
      setContributionError('Introduce un importe válido mayor que 0.')
      return
    }

    const formData = new FormData()
    formData.append('amount', contributionAmount)

    startTransition(async () => {
      const res = await addSavingContributionAction(selectedGoal.id, householdId, {}, formData)
      if (res.error) {
        setContributionError(res.error)
      } else {
        setContributionSuccess(res.success)

        // Otorgar recompensa al Tamagotchi
        const isQuestDone = gameState.completedQuests.includes('quest_saving_contribution')
        const newCompletedQuests = isQuestDone
          ? gameState.completedQuests
          : [...gameState.completedQuests, 'quest_saving_contribution']
        const coinsEarned = isQuestDone ? 15 : 65

        await updateGameState({
          ...gameState,
          coins: gameState.coins + coinsEarned,
          completedQuests: newCompletedQuests,
        })

        setContributionAmount('')
        setTimeout(() => {
          setIsContributionModalOpen(false)
          setContributionSuccess('')
          setSelectedGoal(null)

          // Disparar diálogo de celebración con Tamagotchi Dotzi
          setRewardCelebration({
            amount: addedAmount,
            coinsEarned,
            questCompleted: !isQuestDone,
          })

          router.refresh()
        }, 800)
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
      {/* Widget Superior: Ratio de Ahorro sobre Salario e Interacción Tamagotchi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Salario y Porcentaje Ahorrado */}
        <Card className="md:col-span-2 border-primary/20 bg-linear-to-br from-card via-card to-primary/5 shadow-md relative overflow-hidden">
          <div className="absolute -top-6 -right-6 p-8 opacity-[0.04] pointer-events-none">
            <Percent className="w-48 h-48 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold font-heading">
                    Ratio de Ahorro sobre Salario
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Porcentaje de la nómina mensual del hogar destinado a ahorro
                  </CardDescription>
                </div>
              </div>

              <Badge
                variant="outline"
                className={`text-xs font-extrabold px-3 py-1 rounded-xl shadow-2xs ${salarySavingsPercent >= 20
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : salarySavingsPercent >= 10
                    ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
              >
                {salarySavingsPercent >= 20
                  ? '🚀 Ahorro Excelente (≥20%)'
                  : salarySavingsPercent >= 10
                    ? '📈 Buen Ritmo (10-20%)'
                    : '💡 Ahorro Moderado (<10%)'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-background/80 backdrop-blur-xs rounded-2xl border border-border/50 space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Salario Hogar / Mes
                </span>
                <p className="text-sm sm:text-base font-extrabold text-foreground">
                  {formatCurrency(totalMonthlySalary)}
                </p>
              </div>

              <div className="p-3 bg-background/80 backdrop-blur-xs rounded-2xl border border-border/50 space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Ahorrado este Mes
                </span>
                <p className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(currentMonthSavings)}
                </p>
              </div>

              <div className="p-3 bg-background/80 backdrop-blur-xs rounded-2xl border border-border/50 space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Fondo Total Huchas
                </span>
                <p className="text-sm sm:text-base font-extrabold text-primary">
                  {formatCurrency(totalHouseholdSaved)}
                </p>
              </div>
            </div>

            {/* Barra de Porcentaje */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-muted-foreground">Destinado a Ahorro este Mes</span>
                <span className="text-primary">{salarySavingsPercent}% del salario total</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-border/40">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 via-primary to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, salarySavingsPercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                {totalMonthlySalary === 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
                    💡 Configura los ingresos mensuales en la sección Hogar/Ajustes para calcular automáticamente tu % de ahorro.
                  </span>
                ) : (
                  'Basado en la regla financiera 50/30/20, se recomienda destinar al menos un 20% del salario mensual al ahorro.'
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Tamagotchi Dotzi Booster */}
        <Card className="border-amber-500/20 bg-linear-to-br from-amber-500/5 via-card to-card shadow-md flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base font-extrabold">Impulso Tamagotchi</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/40">
              <TamagotchiAvatar
                mood={currentMonthSavings > 0 ? 'super_hero' : 'happy'}
                size="sm"
                equippedAccessory={gameState.equippedAccessory}
              />
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-extrabold text-foreground">Dotzi te acompaña 🐷</p>
                <p className="text-[11px] text-muted-foreground italic leading-tight line-clamp-2">
                  {currentMonthSavings > 0
                    ? '¡Dotzi está feliz! Vuestras aportaciones de ahorro le dan súper energía.'
                    : '¡Añade dinero a tus huchas para ganar monedas y XP para Dotzi!'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold pt-1 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500 fill-amber-500" /> Recompensa:
              </span>
              <span className="font-extrabold text-amber-600 dark:text-amber-400">
                +15 Monedas / Aportación
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda/Centro: Tarjetas de Huchas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground font-heading">Huchas Activas</h2>
            <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
              <DialogTrigger
                render={
                  <Button size="sm" className="flex items-center gap-1.5 shadow-sm font-bold">
                    <Plus className="h-4 w-4" />
                    Nueva Meta
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Meta o Hucha Libre</DialogTitle>
                  <DialogDescription>
                    Define una meta con objetivo o crea una hucha libre para ahorrar sin límite.
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
                    <Label htmlFor="goal-name">Nombre de la Hucha o Meta</Label>
                    <Input
                      id="goal-name"
                      placeholder="Ej. Vacaciones 2027, Sofá nuevo, Fondo de Emergencia"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Interruptor Hucha Libre (Sin meta fija) */}
                  <div className="flex items-center justify-between bg-muted/50 p-3 rounded-2xl border border-border/60">
                    <div className="space-y-0.5">
                      <Label htmlFor="free-goal" className="text-xs font-bold cursor-pointer text-foreground">
                        Hucha Libre (Sin meta fija)
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Guarda dinero continuamente sin un objetivo ni fecha límite.
                      </p>
                    </div>
                    <input
                      id="free-goal"
                      type="checkbox"
                      checked={isFreeGoal}
                      onChange={(e) => {
                        setIsFreeGoal(e.target.checked)
                        if (e.target.checked) setGoalTargetAmount('0')
                      }}
                      className="h-4.5 w-4.5 rounded border-input text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="goal-target">
                        Importe Objetivo (€) {isFreeGoal && <span className="text-xs text-muted-foreground">(Sin límite)</span>}
                      </Label>
                      <Input
                        id="goal-target"
                        placeholder={isFreeGoal ? 'Libre / 0.00' : '500,00'}
                        value={isFreeGoal ? '0' : goalTargetAmount}
                        onChange={(e) => setGoalTargetAmount(e.target.value)}
                        disabled={isFreeGoal}
                        required={!isFreeGoal}
                        className={isFreeGoal ? 'opacity-60 bg-muted' : ''}
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
                    <Button type="submit" disabled={isPending} className="font-bold">
                      {isPending ? 'Creando...' : isFreeGoal ? 'Crear Hucha Libre' : 'Crear Meta'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {initialGoals.length === 0 ? (
            <Card className="border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-muted rounded-full text-muted-foreground/80 mb-3">
                <PiggyBank className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-foreground">No hay huchas ni metas activas</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
                Establece vuestra primera hucha virtual para empezar a guardar dinero colaborativamente para viajes, fondo de reserva o compras.
              </p>
              <Button size="sm" onClick={() => setIsGoalModalOpen(true)} className="font-bold">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear Primera Hucha
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialGoals.map((goal) => {
                const isFree = goal.target_amount === 0
                const progressPercentage = isFree
                  ? 100
                  : Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
                const daysRemaining = getDaysRemaining(goal.target_date)
                const isCompleted = !isFree && goal.current_amount >= goal.target_amount

                return (
                  <Card
                    key={goal.id}
                    className="border-slate-200/60 dark:border-slate-800/80 shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all duration-300"
                  >
                    {isCompleted && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-bl-lg uppercase tracking-wider shadow-xs animate-pulse">
                        ¡Completada! 🎉
                      </div>
                    )}

                    {isFree && (
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-bl-lg uppercase tracking-wider shadow-xs">
                        Hucha Libre 🐷
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
                                Hasta el{' '}
                                {new Date(goal.target_date).toLocaleDateString('es-ES', {
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
                          <PiggyBank className="h-5 w-5 text-primary" />
                        </div>
                      </CardHeader>

                      <CardContent className="pb-3 space-y-3">
                        {/* Cuentas y Progreso */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-baseline text-xs">
                            <span className="text-muted-foreground font-medium">Ahorrado actual:</span>
                            <span className="font-bold text-foreground">
                              {formatCurrency(goal.current_amount)}
                              {!isFree && (
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {' '}
                                  de {formatCurrency(goal.target_amount)}
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Barra de progreso */}
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isFree
                                ? 'bg-linear-to-r from-indigo-500 to-emerald-500'
                                : isCompleted
                                  ? 'bg-emerald-500'
                                  : 'bg-primary'
                                }`}
                              style={{ width: isFree ? '100%' : `${progressPercentage}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            {isFree ? (
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                <InfinityIcon className="w-3 h-3" /> Crecimiento continuo
                              </span>
                            ) : (
                              <span
                                className={`font-semibold ${isCompleted ? 'text-emerald-500' : 'text-primary'
                                  }`}
                              >
                                {progressPercentage}% completado
                              </span>
                            )}

                            {daysRemaining !== null && (
                              <span
                                className={
                                  daysRemaining < 0
                                    ? 'text-destructive font-semibold'
                                    : 'text-muted-foreground'
                                }
                              >
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
                        variant={isCompleted ? 'outline' : 'default'}
                        className="flex-1 text-xs h-8.5 rounded-lg font-bold"
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
              <CardTitle className="text-base font-bold">Últimas Aportaciones</CardTitle>
              <CardDescription className="text-xs">
                Historial de dinero ingresado en las huchas del hogar.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-4">
              {initialContributions.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No hay aportaciones registradas.
                </div>
              ) : (
                <div className="space-y-0.5 max-h-115 overflow-y-auto pr-1">
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
                              en: <strong className="text-foreground/80 font-medium">{c.goal_name}</strong>
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
                          <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
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
              <DialogTitle>Aportar Fondos de Ahorro</DialogTitle>
              <DialogDescription>
                Añade dinero a la hucha: <strong className="text-foreground">{selectedGoal?.name}</strong>
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
                <Label htmlFor="contribution-amount">Importe a Guardar (€)</Label>
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
                  Al aportar fondos ganarás <strong className="text-amber-600 dark:text-amber-400">+15 Monedas</strong> para tu Tamagotchi Dotzi 🐷.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <DialogClose render={<Button type="button" variant="outline">Cancelar</Button>} />
                <Button type="submit" disabled={isPending} className="font-bold">
                  {isPending ? 'Guardando...' : 'Aportar Ahorro'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal Celebración Tamagotchi Dotzi */}
      {rewardCelebration && (
        <Dialog open={!!rewardCelebration} onOpenChange={() => setRewardCelebration(null)}>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader className="items-center text-center space-y-2">
              <div className="p-3.5 bg-amber-500/15 text-amber-500 rounded-full animate-bounce">
                <PartyPopper className="h-8 w-8" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-foreground font-heading">
                ¡Dotzi está súper feliz! 🎉
              </DialogTitle>
              <DialogDescription className="text-sm">
                Has ingresado <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(rewardCelebration.amount)}</strong> en tus ahorros.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3 bg-muted/40 rounded-3xl border border-border/50 my-2 flex flex-col items-center">
              <TamagotchiAvatar mood="super_hero" size="lg" equippedAccessory={gameState.equippedAccessory} />

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-extrabold px-3 py-1 gap-1.5 rounded-xl">
                  <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
                  +{rewardCelebration.coinsEarned} Monedas
                </Badge>
                <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs font-extrabold px-3 py-1 gap-1.5 rounded-xl">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  +20 XP Dotzi
                </Badge>
              </div>

              {rewardCelebration.questCompleted && (
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Misión &quot;Ahorrador Activo&quot; Completada!</span>
                </div>
              )}
            </div>

            <DialogFooter className="sm:justify-center">
              <Button onClick={() => setRewardCelebration(null)} className="w-full font-bold">
                ¡Genial, a seguir ahorrando! 🚀
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
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
              ¿Estás seguro de que quieres eliminar esta aportación de{' '}
              {contributionToDelete ? formatCurrency(contributionToDelete.amount) : ''}? El dinero acumulado en la hucha se restará automáticamente.
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
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
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
