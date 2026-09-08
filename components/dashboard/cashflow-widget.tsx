'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/format'
import { CalendarCheck, ArrowRight, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react'

interface CashflowWidgetProps {
  projectedEndBalance: number
  pendingBillsAmount: number
  isDeficitRisk: boolean
  nextBillName?: string
  nextBillAmount?: number
  nextBillDay?: number
}

export function CashflowWidget({
  projectedEndBalance,
  pendingBillsAmount,
  isDeficitRisk,
  nextBillName,
  nextBillAmount,
  nextBillDay,
}: CashflowWidgetProps) {
  return (
    <Card className="border-border/60 bg-linear-to-br from-card via-card to-primary/5 shadow-md flex flex-col justify-between overflow-hidden relative">
      {isDeficitRisk && (
        <div className="absolute top-0 right-0 bg-destructive text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-bl-xl tracking-wider animate-pulse">
          ⚠️ Riesgo Descubierto
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-extrabold font-heading">
              Previsión Fin de Mes
            </CardTitle>
            <CardDescription className="text-xs">
              Saldo estimado tras recibos fijos
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-xs font-semibold text-muted-foreground">Saldo disponible:</span>
          <span
            className={`text-xl font-extrabold font-heading ${
              projectedEndBalance < 0
                ? 'text-destructive'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {formatCurrency(projectedEndBalance)}
          </span>
        </div>

        {/* Factura más próxima por vencer */}
        {nextBillName && nextBillAmount ? (
          <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between gap-2 text-xs">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                Próxima factura (Día {nextBillDay}):
              </span>
              <p className="font-bold text-foreground truncate">{nextBillName}</p>
            </div>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
              {formatCurrency(nextBillAmount)}
            </span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic bg-muted/30 p-2.5 rounded-2xl border border-border/40">
            Sin facturas pendientes este mes.
          </div>
        )}

        <Link href="/cashflow" className="block pt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-bold rounded-xl justify-between border-primary/30 text-primary hover:bg-primary/10"
          >
            <span>Ver Calendario Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
