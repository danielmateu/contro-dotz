'use client'

import React from 'react'
import Link from 'next/link'
import { AnnualCashflowForecastResult } from '@/app/actions/cashflow'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import {
  TrendingUp,
  TrendingDown,
  Coins,
  AlertTriangle,
  CalendarCheck2,
  ArrowRight,
  ShieldCheck,
  Receipt,
  Layers,
} from 'lucide-react'

interface CashflowAnnualViewProps {
  annualData: AnnualCashflowForecastResult
  householdId: string
}

export function CashflowAnnualView({ annualData }: CashflowAnnualViewProps) {
  const {
    year,
    totalAnnualIncome,
    totalAnnualSpent,
    totalAnnualNet,
    hasDeficitMonths,
    deficitMonthNames,
    months,
  } = annualData

  return (
    <div className="space-y-6">
      {/* Alerta Destacada en caso de Meses con Descubierto */}
      {hasDeficitMonths && (
        <div className="p-4 rounded-3xl bg-destructive/10 border border-destructive/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-destructive shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-destructive/15 text-destructive shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold font-heading">
                Riesgo de descubierto detectado en {deficitMonthNames.length}{' '}
                {deficitMonthNames.length === 1 ? 'mes' : 'meses'}
              </h4>
              <p className="text-xs text-destructive/90">
                La previsión de saldo acumulado muestra cifras en negativo en:{' '}
                <strong className="underline">{deficitMonthNames.join(', ')}</strong>. Considera ajustar facturas fijas o añadir ingresos adicionales.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas KPI Anuales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Anuales */}
        <Card className="border-border/60 shadow-xs bg-card/80 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Ingresos Anuales ({year})
              </p>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-heading">
                {formatCurrency(totalAnnualIncome)}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Gastos Totales Proyectados */}
        <Card className="border-border/60 shadow-xs bg-card/80 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Gastos Totales ({year})
              </p>
              <h3 className="text-2xl font-black text-foreground font-heading">
                {formatCurrency(totalAnnualSpent)}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Receipt className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Ahorro / Resultado Neto Anual */}
        <Card className="border-border/60 shadow-xs bg-card/80 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Resultado Neto Anual
              </p>
              <h3
                className={`text-2xl font-black font-heading ${
                  totalAnnualNet >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive'
                }`}
              >
                {formatCurrency(totalAnnualNet)}
              </h3>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Coins className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Estado de Salud Anual */}
        <Card className="border-border/60 shadow-xs bg-card/80 backdrop-blur-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Salud de Liquidez
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                {hasDeficitMonths ? (
                  <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 font-extrabold text-xs px-2.5 py-1 rounded-xl">
                    Riesgo en {deficitMonthNames.length} {deficitMonthNames.length === 1 ? 'mes' : 'meses'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-extrabold text-xs px-2.5 py-1 rounded-xl gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Liquidez Estable
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 text-muted-foreground border border-border/40">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rejilla de los 12 Meses del Año */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-foreground font-heading">
            Previsión Mes a Mes ({year})
          </h3>
          <p className="text-xs text-muted-foreground">
            Desglose estimado de ingresos, facturas fijas y saldo acumulado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {months.map((m) => {
            const isDeficit = m.isDeficitRisk

            return (
              <Card
                key={m.monthStr}
                className={`border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                  m.isCurrent
                    ? 'border-primary ring-2 ring-primary/20 bg-card'
                    : isDeficit
                    ? 'border-destructive/50 bg-destructive/5'
                    : m.isPast
                    ? 'border-border/50 bg-muted/20'
                    : 'border-border/70 bg-card'
                }`}
              >
                <CardHeader className="pb-2 pt-3.5 px-4 border-b border-border/30 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-extrabold capitalize font-heading flex items-center gap-2">
                      {m.monthName}
                    </CardTitle>

                    {m.isCurrent ? (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-black uppercase px-2 py-0.5 rounded-lg">
                        Mes Actual
                      </Badge>
                    ) : m.isPast ? (
                      <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-border/60">
                        Finalizado
                      </Badge>
                    ) : isDeficit ? (
                      <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] font-black">
                        Descubierto
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Desglose de Cifras */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Ingresos</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(m.totalIncome)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{m.isPast ? 'Gasto Real' : 'Gastos/Facturas Fijas'}</span>
                      <span className="font-bold text-foreground">
                        -{formatCurrency(m.projectedSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/30 font-semibold">
                      <span>Neto del Mes</span>
                      <span
                        className={
                          m.projectedNet >= 0
                            ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                            : 'text-destructive font-extrabold'
                        }
                      >
                        {m.projectedNet >= 0 ? '+' : ''}
                        {formatCurrency(m.projectedNet)}
                      </span>
                    </div>
                  </div>

                  {/* Saldo Acumulado al final del mes */}
                  <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/40 text-center space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground block tracking-wider">
                      Saldo Acumulado Proyectado
                    </span>
                    <span
                      className={`text-base font-black font-heading block ${
                        isDeficit ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCurrency(m.projectedEndingBalance)}
                    </span>
                  </div>

                  {/* Enlace al detalle diario del mes */}
                  <div className="pt-1">
                    <Link
                      href={`/cashflow?month=${m.monthStr}&view=calendar`}
                      className="inline-flex w-full items-center justify-center border border-border bg-background hover:bg-primary hover:text-primary-foreground text-xs font-bold gap-1.5 h-8 px-2.5 rounded-xl transition-all shadow-2xs"
                    >
                      <CalendarCheck2 className="w-3.5 h-3.5" />
                      <span>Ver Calendario</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
