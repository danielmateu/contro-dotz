'use client'

import React, { useTransition, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wand2, Loader2, CheckCircle2, Copy } from 'lucide-react'
import { importPreviousBudgetsAction } from '@/app/actions/budget'
import { useI18n } from '@/lib/i18n/i18n-context'

interface ImportBudgetsButtonProps {
  householdId: string
  targetMonth: string
  sourceMonthInfo?: {
    month: string
    monthName: string
    count: number
  } | null
  variant?: 'card' | 'header'
}

export function ImportBudgetsButton({
  householdId,
  targetMonth,
  sourceMonthInfo,
  variant = 'header',
}: ImportBudgetsButtonProps) {
  const { locale } = useI18n()
  const isCatalan = locale === 'ca'
  const isEnglish = locale === 'en'
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleImport = () => {
    setMessage(null)
    startTransition(async () => {
      const res = await importPreviousBudgetsAction(
        householdId,
        targetMonth,
        sourceMonthInfo?.month
      )
      if (res.error) {
        setMessage({ text: res.error, type: 'error' })
      } else if (res.success) {
        const msg = isCatalan
          ? `¡S'han importat ${res.count} pressupostos amb èxit!`
          : isEnglish
          ? `Successfully imported ${res.count} budgets!`
          : `¡Se han importado ${res.count} presupuestos con éxito!`
        setMessage({ text: msg, type: 'success' })
      }
    })
  }

  if (!sourceMonthInfo && variant === 'card') {
    return null
  }

  const buttonText = sourceMonthInfo
    ? isCatalan
      ? `Copiar ${sourceMonthInfo.count} pressupostos de ${sourceMonthInfo.monthName}`
      : isEnglish
      ? `Copy ${sourceMonthInfo.count} budgets from ${sourceMonthInfo.monthName}`
      : `Copiar ${sourceMonthInfo.count} presupuestos de ${sourceMonthInfo.monthName}`
    : isCatalan
    ? 'Copiar pressupostos del mes anterior'
    : isEnglish
    ? 'Copy budgets from previous month'
    : 'Copiar presupuestos del mes anterior'

  if (variant === 'card') {
    return (
      <div className="flex flex-col items-center gap-2 mt-4">
        <Button
          onClick={handleImport}
          disabled={isPending}
          className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 px-5 py-2.5 h-auto text-xs sm:text-sm gap-2 transition-all hover:scale-105 active:scale-95"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Wand2 className="w-4 h-4 text-amber-300 animate-pulse" />
          )}
          <span>{buttonText}</span>
        </Button>

        {message && (
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl animate-fade-in ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {message.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleImport}
        disabled={isPending || !sourceMonthInfo}
        title={buttonText}
        className="h-8 rounded-xl text-xs gap-1.5 bg-background/80 hover:bg-muted/80 border-border/80 font-bold"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-amber-500" />
        )}
        <span className="hidden sm:inline">
          {sourceMonthInfo
            ? isCatalan
              ? `Copiar de ${sourceMonthInfo.monthName}`
              : isEnglish
              ? `Copy from ${sourceMonthInfo.monthName}`
              : `Copiar de ${sourceMonthInfo.monthName}`
            : isCatalan
            ? 'Copiar del mes anterior'
            : isEnglish
            ? 'Copy from previous month'
            : 'Copiar del mes anterior'}
        </span>
      </Button>

      {message && (
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
            message.type === 'success'
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
          }`}
        >
          {message.text}
        </span>
      )}
    </div>
  )
}
