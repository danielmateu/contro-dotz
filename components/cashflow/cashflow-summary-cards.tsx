'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import {
  TrendingUp,
  Receipt,
  CalendarCheck,
  PiggyBank,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
} from 'lucide-react'

interface CashflowSummaryCardsProps {
  totalMonthlyIncome: number
  totalSpentSoFar: number
  pendingBillsAmount: number
  projectedEndBalance: number
  isDeficitRisk: boolean
  lowestBalanceDay?: { day: number; balance: number }
}

export function CashflowSummaryCards({
  totalMonthlyIncome,
  totalSpentSoFar,
  pendingBillsAmount,
  projectedEndBalance,
  isDeficitRisk,
  lowestBalanceDay,
}: CashflowSummaryCardsProps) {
  const savingsMarginPercent =
    totalMonthlyIncome > 0
      ? Math.round((projectedEndBalance / totalMonthlyIncome) * 100)
      : 0

  return (
    <div className="space-y-4">
      {/* Alerta de Riesgo de Descubierto */}
      {isDeficitRisk && (
        <div className="bg-destructive/15 border border-destructive/30 p-4 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-destructive/20 text-destructive shrink-0 animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-foreground font-heading">
                ⚠️ Alerta de Descubierto Proyectado
              </h4>
              <p className="text-xs text-muted-foreground">
                Teniendo en cuenta los gastos previstos, el saldo acumulado podría caer por debajo de 0€
                {lowestBalanceDay ? ` (mínimo el día ${lowestBalanceDay.day} con ${formatCurrency(lowestBalanceDay.balance)})` : ''}.
              </p>
            </div>
          </div>

          <Badge variant="destructive" className="font-extrabold text-xs px-3 py-1 rounded-xl shrink-0">
            Revisar Facturas
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tarjeta 1: Ingresos Totales del Mes */}
        <Card className="border-border/60 bg-linear-to-br from-card via-card to-emerald-500/5 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Nóminas / Ingresos Mes
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground font-heading">
              {formatCurrency(totalMonthlyIncome)}
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Suma de las aportaciones del hogar
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Gastos Ya Incurridos */}
        <Card className="border-border/60 bg-linear-to-br from-card via-card to-amber-500/5 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Gastos Ya Incurridos
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-heading">
              {formatCurrency(totalSpentSoFar)}
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Registrados en el mes actual
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Facturas Recurrentes Pendientes */}
        <Card className="border-border/60 bg-linear-to-br from-card via-card to-indigo-500/5 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Facturas Pendientes
            </CardTitle>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-heading">
              {formatCurrency(pendingBillsAmount)}
            </div>
            <p className="text-[11px] text-muted-foreground italic">
              Recibos por vencer este mes
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 4: Saldo Proyectado a Fin de Mes */}
        <Card className={`border-border/60 shadow-md ${
          projectedEndBalance < 0
            ? 'bg-linear-to-br from-card via-card to-destructive/10 border-destructive/40'
            : savingsMarginPercent >= 20
            ? 'bg-linear-to-br from-card via-card to-emerald-500/10 border-emerald-500/40'
            : 'bg-linear-to-br from-card via-card to-primary/10 border-primary/40'
        }`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Saldo Proyectado Fin de Mes
            </CardTitle>
            <div className={`p-2 rounded-xl border ${
              projectedEndBalance < 0
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              <PiggyBank className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className={`text-2xl font-extrabold font-heading ${
              projectedEndBalance < 0
                ? 'text-destructive'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {formatCurrency(projectedEndBalance)}
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Badge
                variant="outline"
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                  projectedEndBalance < 0
                    ? 'bg-destructive/15 text-destructive border-destructive/30'
                    : savingsMarginPercent >= 20
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-primary/15 text-primary border-primary/30'
                }`}
              >
                {projectedEndBalance < 0
                  ? '⚠️ Descubierto'
                  : savingsMarginPercent >= 20
                  ? `🚀 Margen ${savingsMarginPercent}%`
                  : `📈 Margen ${savingsMarginPercent}%`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
