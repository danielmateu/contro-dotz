'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { SaveBudgetForm } from '@/components/budgets/save-budget-form'
import { MonthSelector } from '@/components/budgets/month-selector'
import { DeleteBudgetButton } from '@/components/budgets/delete-budget-button'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PiggyBank, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface BudgetsViewClientProps {
  month: string
  categories: any[]
  budgets: any[]
  categorySpentMap: Record<string, number>
  saveActionWithId: any
  monthName: string
}

export function BudgetsViewClient({
  month,
  categories,
  budgets,
  categorySpentMap,
  saveActionWithId,
  monthName,
}: BudgetsViewClientProps) {
  const { t, locale } = useI18n()

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

        {/* Month selector */}
        <MonthSelector defaultMonth={month} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Save Form Sidebar */}
        <div className="md:col-span-1">
          <SaveBudgetForm
            categories={categories || []}
            month={month}
            action={saveActionWithId}
          />
        </div>

        {/* List & Progress */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
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
                      ? 'Set budgets for your expense categories in the left panel.'
                      : locale === 'ca'
                      ? 'Estableix pressupostos per a les teves categories en el formulari de l\'esquerra.'
                      : 'Establece presupuestos para tus categorías de gastos en el formulario de la izquierda.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
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
                        className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 bg-muted/10 hover:bg-muted/20 transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center shadow-xs border"
                              style={{
                                backgroundColor: `${category?.color || '#cbd5e1'}15`,
                                color: category?.color || '#64748b',
                              }}
                            >
                              {LucideIconComp ? (
                                <LucideIconComp className="h-4 w-4" />
                              ) : (
                                <Icons.Tag className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">
                                {category?.name || (locale === 'en' ? 'Deleted category' : locale === 'ca' ? 'Categoria eliminada' : 'Categoría eliminada')}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {locale === 'en' ? 'Limit:' : locale === 'ca' ? 'Límit:' : 'Límite:'} {formatCurrency(limit)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                {formatCurrency(spent)} {locale === 'en' ? 'spent' : locale === 'ca' ? 'gastats' : 'gastados'}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider font-semibold ${textColor}`}>
                                {percent.toFixed(0)}% {locale === 'en' ? 'consumed' : locale === 'ca' ? 'consumit' : 'consumido'}
                              </span>
                            </div>

                            <DeleteBudgetButton
                              budgetId={budget.id}
                              categoryName={category?.name || 'Categoría'}
                              month={month}
                            />
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className={`h-2.5 w-full rounded-full overflow-hidden ${bgProgress}`}>
                            <div
                              className={`h-full transition-all duration-300 ${progressColor}`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>

                          {/* Alerts */}
                          {percent >= 100 ? (
                            <div className="flex items-center gap-1 text-[11px] text-destructive font-medium pt-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              {locale === 'en'
                                ? `Budget exceeded! You have spent ${formatCurrency(spent - limit)} extra.`
                                : locale === 'ca'
                                ? `Pressupost superat! Has gastat ${formatCurrency(spent - limit)} de més.`
                                : `¡Presupuesto superado! Has gastado ${formatCurrency(spent - limit)} de más.`}
                            </div>
                          ) : percent >= 80 ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1">
                              <Info className="h-3 w-3 shrink-0" />
                              {locale === 'en'
                                ? 'Warning: You are about to exceed this category limit.'
                                : locale === 'ca'
                                ? 'Atenció: Estàs a punt de superar el límit d\'aquesta categoria.'
                                : 'Atención: Estás a punto de superar el límite de esta categoría.'}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              {locale === 'en'
                                ? 'Budget under control.'
                                : locale === 'ca'
                                ? 'Pressupost sota control.'
                                : 'Presupuesto bajo control.'}
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
