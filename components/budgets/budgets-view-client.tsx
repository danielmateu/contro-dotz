'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'
import { SaveBudgetForm } from '@/components/budgets/save-budget-form'
import { MonthSelector } from '@/components/budgets/month-selector'
import { DeleteBudgetButton } from '@/components/budgets/delete-budget-button'
import { ImportBudgetsButton } from '@/components/budgets/import-budgets-button'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PiggyBank, Info, AlertTriangle, CheckCircle2, Globe, Home, User } from 'lucide-react'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface BudgetsViewClientProps {
  householdId: string
  month: string
  currentScope?: 'all' | 'shared' | 'personal'
  categories: any[]
  budgets: any[]
  categorySpentMap: Record<string, number>
  saveActionWithId: any
  monthName: string
  previousMonthInfo?: {
    month: string
    monthName: string
    count: number
  } | null
}

export function BudgetsViewClient({
  householdId,
  month,
  currentScope = 'all',
  categories,
  budgets,
  categorySpentMap,
  saveActionWithId,
  monthName,
  previousMonthInfo,
}: BudgetsViewClientProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleScopeChange = (newScope: 'all' | 'shared' | 'personal') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('scope', newScope)
    if (month) params.set('month', month)
    router.push(`/budgets?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            {locale === 'en' ? 'Monthly Budgets' : locale === 'ca' ? 'Pressupostos Mensuals' : 'Presupuestos Mensuales'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'en'
              ? 'Set and control monthly spending limits for each category.'
              : locale === 'ca'
                ? 'Estableix i controla els límits de despesa mensual per a cada categoria.'
                : 'Establece y controla los límites de gasto mensual para cada categoría.'}
          </p>
        </div>

        {/* Month selector, Scope Filter and Import Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Ámbito (Todos, Hogar, Personal) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xs">
            {[
              {
                id: 'all',
                label: locale === 'en' ? 'All' : locale === 'ca' ? 'Tots' : 'Todos',
                icon: Globe,
              },
              {
                id: 'shared',
                label: locale === 'en' ? 'Household' : locale === 'ca' ? 'Llar' : 'Hogar',
                icon: Home,
              },
              {
                id: 'personal',
                label: locale === 'en' ? 'Personal' : locale === 'ca' ? 'Personal' : 'Personal',
                icon: User,
              },
            ].map((sc) => {
              const Icon = sc.icon
              const isActive = currentScope === sc.id
              return (
                <button
                  key={sc.id}
                  onClick={() => handleScopeChange(sc.id as any)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{sc.label}</span>
                </button>
              )
            })}
          </div>

          <ImportBudgetsButton
            householdId={householdId}
            targetMonth={month}
            sourceMonthInfo={previousMonthInfo}
            variant="header"
          />
          <MonthSelector defaultMonth={month} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Save Form Sidebar */}
        <div className="lg:col-span-1">
          <SaveBudgetForm
            categories={categories || []}
            month={month}
            action={saveActionWithId}
          />
        </div>

        {/* List & Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg capitalize">
                  {locale === 'en' ? `Budgets for ${monthName}` : locale === 'ca' ? `Pressupostos de ${monthName}` : `Presupuestos de ${monthName}`}
                </CardTitle>
                <CardDescription>
                  {locale === 'en'
                    ? 'Expense overview against established limit for this month.'
                    : locale === 'ca'
                      ? 'Resum de despeses enfront del límit establert per a aquest mes.'
                      : 'Resumen de gastos frente al límite establecido para este mes.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {!budgets || budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PiggyBank className="h-12 w-12 text-slate-400 stroke-1 mb-3" />
                  <h4 className="font-semibold font-heading">
                    {locale === 'en' ? 'No budgets assigned' : locale === 'ca' ? 'Sense pressupostos assignats' : 'No hay presupuestos asignados'}
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-xs mt-1">
                    {locale === 'en'
                      ? 'Set budgets for your expense categories in the left panel or import from previous month.'
                      : locale === 'ca'
                        ? 'Estableix pressupostos per a les teves categories o importa del mes anterior.'
                        : 'Establece presupuestos para tus categorías o impórtalos fácilmente del mes anterior.'}
                  </p>

                  {/* Botón destacado en pantalla vacía */}
                  <ImportBudgetsButton
                    householdId={householdId}
                    targetMonth={month}
                    sourceMonthInfo={previousMonthInfo}
                    variant="card"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {budgets.map((budget) => {
                    const category = budget.categories as any
                    const spent = categorySpentMap[budget.category_id] || 0
                    const limit = Number(budget.amount)
                    const percent = limit > 0 ? (spent / limit) * 100 : 0
                    const LucideIconComp = category?.icon
                      ? ((Icons as any)[category.icon] as LucideIcon)
                      : null

                    let progressColor = 'bg-emerald-500'
                    let textColor = 'text-emerald-600 dark:text-emerald-400'
                    let bgProgress = 'bg-emerald-100 dark:bg-emerald-950/30'

                    if (percent >= 100) {
                      progressColor = 'bg-destructive animate-pulse'
                      textColor = 'text-destructive font-semibold'
                      bgProgress = 'bg-destructive/10'
                    } else if (percent >= 80) {
                      progressColor = 'bg-amber-500'
                      textColor = 'text-amber-600 dark:text-amber-400 font-semibold'
                      bgProgress = 'bg-amber-100 dark:bg-amber-950/30'
                    }

                    return (
                      <div
                        key={budget.id}
                        className="p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl space-y-3 bg-card/60 hover:bg-card/90 transition-all flex flex-col justify-between shadow-2xs group"
                      >
                        {/* Fila Superior: Icono, Nombre de Categoría y Botón Eliminar */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="h-8.5 w-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border"
                              style={{
                                backgroundColor: `${category?.color || '#cbd5e1'}15`,
                                color: category?.color || '#64748b',
                                borderColor: `${category?.color || '#cbd5e1'}30`,
                              }}
                            >
                              {LucideIconComp ? (
                                <LucideIconComp className="h-4 w-4" />
                              ) : (
                                <Icons.Tag className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-sm text-foreground truncate">
                                {category?.name || (locale === 'en' ? 'Deleted category' : locale === 'ca' ? 'Categoria eliminada' : 'Categoría eliminada')}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {locale === 'en' ? 'Limit:' : locale === 'ca' ? 'Límit:' : 'Límite:'} <strong className="font-semibold text-foreground/80">{formatCurrency(limit)}</strong>
                              </span>
                            </div>
                          </div>

                          <DeleteBudgetButton
                            budgetId={budget.id}
                            categoryName={category?.name || 'Categoría'}
                            month={month}
                          />
                        </div>

                        {/* Fila Intermedia: Gasto y Porcentaje Consumido */}
                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/40">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-muted-foreground font-medium">
                              {locale === 'en' ? 'Spent:' : locale === 'ca' ? 'Gastat:' : 'Gastado:'}
                            </span>
                            <span className="font-extrabold text-sm text-foreground">
                              {formatCurrency(spent)}
                            </span>
                          </div>
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md shrink-0 ${textColor} ${bgProgress}`}>
                            {percent.toFixed(0)}% {locale === 'en' ? 'consumed' : locale === 'ca' ? 'consumit' : 'consumido'}
                          </span>
                        </div>

                        {/* Barra de Progreso y Alertas */}
                        <div className="space-y-1">
                          <div className={`h-2.5 w-full rounded-full overflow-hidden ${bgProgress}`}>
                            <div
                              className={`h-full transition-all duration-300 ${progressColor}`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>

                          {percent >= 100 ? (
                            <div className="flex items-center gap-1 text-[11px] text-destructive font-medium pt-0.5">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {locale === 'en'
                                  ? `Budget exceeded! (+${formatCurrency(spent - limit)})`
                                  : locale === 'ca'
                                    ? `Pressupost superat! (+${formatCurrency(spent - limit)})`
                                    : `¡Presupuesto superado! (+${formatCurrency(spent - limit)})`}
                              </span>
                            </div>
                          ) : percent >= 80 ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
                              <Info className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {locale === 'en'
                                  ? 'Warning: Limit almost reached.'
                                  : locale === 'ca'
                                    ? 'Atenció: Límit quasi aconseguit.'
                                    : 'Atención: Límit de gasto casi alcanzado.'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span>
                                {locale === 'en'
                                  ? 'Budget under control.'
                                  : locale === 'ca'
                                    ? 'Pressupost sota control.'
                                    : 'Presupuesto bajo control.'}
                              </span>
                            </div>
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
      </div>
    </div>
  )
}
