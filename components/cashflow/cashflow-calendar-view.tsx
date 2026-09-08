'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DayCashflowStatus,
  ScheduledBill,
  convertRecurringToExpenseAction,
  deleteRecurringExpenseAction,
  RecurringExpense,
} from '@/app/actions/cashflow'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Plus,
  Coins,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Tag,
  Check,
  Trash2,
} from 'lucide-react'

interface CashflowCalendarViewProps {
  householdId: string
  days: DayCashflowStatus[]
  monthStr: string
  recurringExpenses: RecurringExpense[]
}

export function CashflowCalendarView({
  householdId,
  days,
  monthStr,
  recurringExpenses,
}: CashflowCalendarViewProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [isPending, startTransition] = useTransition()

  // Selected Day Modal State
  const [selectedDay, setSelectedDay] = useState<DayCashflowStatus | null>(null)
  const [actingBillId, setActingBillId] = useState<string | null>(null)
  const [deletingRecId, setDeletingRecId] = useState<string | null>(null)

  const handleConvertBill = async (bill: ScheduledBill) => {
    if (!selectedDay) return
    setActingBillId(bill.id)

    startTransition(async () => {
      const res = await convertRecurringToExpenseAction(householdId, bill.id, selectedDay.dateStr)
      setActingBillId(null)
      if (res.success) {
        setSelectedDay(null)
        router.refresh()
      }
    })
  }

  const handleDeleteRecurring = async (recId: string) => {
    setDeletingRecId(recId)
    startTransition(async () => {
      const res = await deleteRecurringExpenseAction(recId)
      setDeletingRecId(null)
      if (res.success) {
        router.refresh()
      }
    })
  }

  // Parse month date
  const [yearNum, monthNum] = monthStr.split('-').map((v) => parseInt(v, 10))
  const monthDateObj = new Date(yearNum, monthNum - 1, 1)
  const monthName = monthDateObj.toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-US' : 'es-ES', {
    month: 'long',
    year: 'numeric',
  })

  // Dias de la semana abreviados
  const weekDays = locale === 'ca'
    ? ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']
    : locale === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  // Calcular dia de la semana del primer dia del mes (0=Sun, 1=Mon, ..., 6=Sat)
  let firstDayOfWeek = new Date(yearNum, monthNum - 1, 1).getDay() - 1
  if (firstDayOfWeek === -1) firstDayOfWeek = 6 // Ajustar Domingo a 6

  // Celdas vacías iniciales para alinear el calendario
  const emptyLeadingCells = Array.from({ length: firstDayOfWeek })

  return (
    <div className="space-y-6">
      {/* Cabecera del Calendario & Lista de Recibos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda/Centro: Grilla del Calendario Mensual */}
        <Card className="lg:col-span-2 border-border/60 shadow-md overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-extrabold capitalize font-heading">
                    {monthName}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Evolución diaria del saldo disponible acumulado
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Saldo positivo
                </span>
                <span className="flex items-center gap-1 text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Descubierto
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-2 sm:p-4">
            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-muted-foreground uppercase pb-2">
              {weekDays.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Rejilla de días */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Celdas vacías previas al día 1 */}
              {emptyLeadingCells.map((_, i) => (
                <div key={`empty-${i}`} className="h-16 sm:h-24 bg-muted/10 rounded-2xl border border-transparent" />
              ))}

              {/* Días del mes */}
              {days.map((day) => {
                const hasBills = day.scheduledBills.length > 0
                const isDeficit = day.projectedEndingBalance < 0

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDay(day)}
                    className={`h-20 sm:h-26 p-1.5 sm:p-2 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                      day.isToday
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                        : isDeficit
                        ? 'border-destructive/50 bg-destructive/5 hover:border-destructive'
                        : day.isPast
                        ? 'border-border/40 bg-muted/20 hover:bg-muted/40'
                        : 'border-border/60 bg-card hover:border-primary/50 hover:bg-muted/30 shadow-2xs'
                    }`}
                  >
                    {/* Cabecera de celda: Número de día + Badge hoy */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-extrabold ${
                          day.isToday
                            ? 'text-primary bg-primary/15 px-1.5 py-0.5 rounded-lg'
                            : 'text-foreground'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {day.dayNumber === 1 && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-extrabold px-1 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hidden sm:inline-flex"
                        >
                          +Nómina
                        </Badge>
                      )}
                    </div>

                    {/* Facturas del día */}
                    <div className="space-y-1 my-0.5">
                      {hasBills && (
                        <div className="space-y-0.5 max-h-10 overflow-hidden">
                          {day.scheduledBills.map((b) => (
                            <div
                              key={b.id}
                              className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center justify-between gap-1 ${
                                b.isPaid
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 line-through opacity-70'
                                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                              }`}
                            >
                              <span className="truncate">{b.name}</span>
                              <span className="shrink-0">{formatCurrency(b.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Saldo estimado acumulado al final del día */}
                    <div className="pt-0.5 text-right border-t border-border/30">
                      <span
                        className={`text-[9px] sm:text-[11px] font-extrabold leading-none block truncate ${
                          isDeficit ? 'text-destructive font-black' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(day.projectedEndingBalance)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Catálogo de Facturas Recurrentes Registradas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-foreground font-heading">
              Facturas Fijas Registradas
            </h3>
            <Badge variant="outline" className="text-xs font-bold px-2 py-0.5">
              {recurringExpenses.length} Fijas
            </Badge>
          </div>

          <Card className="border-border/60 shadow-md">
            <CardContent className="p-3 divide-y divide-border/40">
              {recurringExpenses.length === 0 ? (
                <div className="py-8 text-center space-y-2 text-xs text-muted-foreground">
                  <Receipt className="w-8 h-8 mx-auto text-muted-foreground/60 stroke-1" />
                  <p className="font-semibold text-foreground">No hay facturas fijas todavía</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Añade tu primer gasto recurrente (alquiler, luz, suscripciones) para calcular la previsión.
                  </p>
                </div>
              ) : (
                recurringExpenses.map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shrink-0">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{rec.name}</h4>
                        <p className="text-[10px] text-muted-foreground">
                          Día {rec.day_of_month} de cada mes • {rec.payment_method}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(rec.amount)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={deletingRecId === rec.id}
                        onClick={() => handleDeleteRecurring(rec.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Desplegable al Hacer Clic en un Día */}
      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-4 sm:p-6 bg-card border-border shadow-2xl">
            <DialogHeader className="space-y-1 text-left border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-extrabold font-heading flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span>Día {selectedDay.dayNumber} de {monthName}</span>
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold px-2.5 py-0.5 ${
                    selectedDay.projectedEndingBalance < 0
                      ? 'bg-destructive/15 text-destructive border-destructive/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  Saldo: {formatCurrency(selectedDay.projectedEndingBalance)}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Desglose de facturas previstas y gastos reales registrados en este día.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Facturas Previstas del Día */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                  Facturas Previstas para este Día
                </h4>

                {selectedDay.scheduledBills.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No hay facturas recurrentes programadas para el día {selectedDay.dayNumber}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDay.scheduledBills.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-2xl border border-border/60 bg-muted/30 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground">{b.name}</p>
                          <span
                            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${b.categoryColor}20`,
                              color: b.categoryColor,
                            }}
                          >
                            {b.categoryName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-foreground">
                            {formatCurrency(b.amount)}
                          </span>

                          {b.isPaid ? (
                            <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1 px-2 py-1 rounded-xl">
                              <CheckCircle2 className="w-3 h-3" />
                              Abonada
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              disabled={actingBillId === b.id || isPending}
                              onClick={() => handleConvertBill(b)}
                              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 shadow-sm gap-1"
                            >
                              {actingBillId === b.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Pagar / Gasto
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedDay(null)}
                className="rounded-xl text-xs font-bold"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
