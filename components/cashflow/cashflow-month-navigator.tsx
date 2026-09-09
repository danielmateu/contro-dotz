'use client'

import React, { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  RotateCcw,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

interface CashflowMonthNavigatorProps {
  currentMonthStr: string // YYYY-MM
  currentYear: number
  activeView: 'calendar' | 'annual'
}

export function CashflowMonthNavigator({
  currentMonthStr,
  currentYear,
  activeView,
}: CashflowMonthNavigatorProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [yearNum, monthNum] = currentMonthStr.split('-').map((v) => parseInt(v, 10))

  const today = new Date()
  const todayMonthStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`

  const dateLocale = locale === 'en' ? 'en-US' : locale === 'ca' ? 'ca-ES' : 'es-ES'

  const getMonthNameFull = (monthIndex1Based: number, year: number) => {
    const date = new Date(year, monthIndex1Based - 1, 1)
    return date.toLocaleDateString(dateLocale, { month: 'long' })
  }

  const getMonthNameShort = (monthIndex1Based: number) => {
    const date = new Date(2026, monthIndex1Based - 1, 1)
    return date.toLocaleDateString(dateLocale, { month: 'short' })
  }

  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(newParams).forEach(([key, val]) => {
      if (val) {
        params.set(key, val)
      } else {
        params.delete(key)
      }
    })
    startTransition(() => {
      router.push(`/cashflow?${params.toString()}`)
    })
  }

  // Prev / Next month
  const handlePrevMonth = () => {
    let newYear = yearNum
    let newMonth = monthNum - 1
    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    const newMonthStr = `${newYear}-${newMonth.toString().padStart(2, '0')}`
    updateUrl({ month: newMonthStr, year: newYear.toString() })
  }

  const handleNextMonth = () => {
    let newYear = yearNum
    let newMonth = monthNum + 1
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }
    const newMonthStr = `${newYear}-${newMonth.toString().padStart(2, '0')}`
    updateUrl({ month: newMonthStr, year: newYear.toString() })
  }

  // Select month index (1..12)
  const handleSelectMonthIndex = (idx: number) => {
    const newMonthStr = `${yearNum}-${idx.toString().padStart(2, '0')}`
    updateUrl({ month: newMonthStr, year: yearNum.toString() })
  }

  // Prev / Next year (Annual view)
  const handlePrevYear = () => {
    const newYear = currentYear - 1
    updateUrl({ year: newYear.toString(), month: `${newYear}-01` })
  }

  const handleNextYear = () => {
    const newYear = currentYear + 1
    updateUrl({ year: newYear.toString(), month: `${newYear}-01` })
  }

  return (
    <div className="space-y-3 bg-card/60 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-border/60 shadow-xs">
      {/* Fila Principal: Switcher de Vista & Botones de Navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Modos: Calendario Mensual vs Previsión Anual */}
        <div className="inline-flex p-1 bg-muted/50 rounded-2xl border border-border/40 shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant={activeView === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateUrl({ view: 'calendar' })}
            className={`rounded-xl text-xs font-bold gap-1.5 transition-all ${
              activeView === 'calendar' ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('cashflow.monthlyView')}</span>
          </Button>

          <Button
            type="button"
            variant={activeView === 'annual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateUrl({ view: 'annual' })}
            className={`rounded-xl text-xs font-bold gap-1.5 transition-all ${
              activeView === 'annual' ? 'shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>{t('cashflow.annualForecast')}</span>
          </Button>
        </div>

        {/* Controles de Navegación según la vista active */}
        {activeView === 'calendar' ? (
          <div className="flex items-center gap-2 justify-between sm:justify-end min-w-0">
            {currentMonthStr !== todayMonthStr && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateUrl({ month: todayMonthStr, year: today.getFullYear().toString() })}
                className="rounded-xl text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10 h-9"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t('cashflow.currentMonth')}</span>
              </Button>
            )}

            <div className="flex items-center gap-1 bg-muted/30 border border-border/50 rounded-2xl p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                disabled={isPending}
                className="h-7 w-7 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-xs sm:text-sm font-extrabold text-foreground px-2 capitalize min-w-[110px] text-center font-heading">
                {getMonthNameFull(monthNum, yearNum)} {yearNum}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                disabled={isPending}
                className="h-7 w-7 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center gap-1 bg-muted/30 border border-border/50 rounded-2xl p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrevYear}
                disabled={isPending}
                className="h-7 w-7 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-xs sm:text-sm font-extrabold text-foreground px-3 font-heading">
                {t('dashboard.charts.yearLabel', { year: currentYear })}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNextYear}
                disabled={isPending}
                className="h-7 w-7 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tira Rápida de los 12 Meses del Año (Solo visible en vista mensual) */}
      {activeView === 'calendar' && (
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((monthIdx) => {
              const name = getMonthNameShort(monthIdx)
              const isSelected = monthNum === monthIdx
              const isThisCurrentMonth =
                today.getFullYear() === yearNum && today.getMonth() + 1 === monthIdx

              return (
                <button
                  key={monthIdx}
                  type="button"
                  onClick={() => handleSelectMonthIndex(monthIdx)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 capitalize ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs scale-105'
                      : isThisCurrentMonth
                      ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                      : 'bg-muted/30 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <span>{name}</span>
                  {isThisCurrentMonth && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
