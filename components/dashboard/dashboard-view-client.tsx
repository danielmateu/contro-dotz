'use client'

import React from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/i18n-context'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { ExpenseDialog } from '@/components/expenses/expense-dialog'
import { SendReportButton } from '@/components/household/send-report-button'
import { formatCurrency } from '@/lib/format'
import { TamagotchiCard } from '@/components/game/tamagotchi-card'
import { calculatePetStats } from '@/lib/game/fin-pet-engine'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Receipt,
  PiggyBank,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface DashboardViewClientProps {
  householdId: string
  userId: string
  isOwner: boolean
  categories: any[]
  mappedMembers: any[]
  totalHouseholdFund: number
  currentTotalSpent: number
  dailyAverage: number
  daysPassed: number
  diffAbsolute: number
  diffPercentage: number
  totalBudgeted: number
  pieChartData: any[]
  lineChartData: any[]
  barChartData: any[]
  stackedChartData: any[]
  memberNames: string[]
  membersIncomeAndSpent: any[]
  budgetsAlert: any[]
  latestExpenses: any[]
  activities: any[]
}

export function DashboardViewClient({
  householdId,
  userId,
  isOwner,
  categories,
  mappedMembers,
  totalHouseholdFund,
  currentTotalSpent,
  dailyAverage,
  daysPassed,
  diffAbsolute,
  diffPercentage,
  totalBudgeted,
  pieChartData,
  lineChartData,
  barChartData,
  stackedChartData,
  memberNames,
  membersIncomeAndSpent,
  budgetsAlert,
  latestExpenses,
  activities,
}: DashboardViewClientProps) {
  const { t, locale } = useI18n()

  const dateLocaleStr = locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-US' : 'es-ES'

  const petStats = calculatePetStats({
    currentTotalSpent,
    totalBudgeted,
    daysPassed,
    totalDaysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
    totalHouseholdFund,
    locale,
  })

  return (
    <div className="space-y-6">
      {/* Top Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            {t('dashboard.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SendReportButton
            householdId={householdId}
            compact
          />
          <ExpenseDialog
            householdId={householdId}
            categories={categories || []}
            members={mappedMembers}
            currentUserId={userId}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* Hero Widget: Tamagotchi Dotzi */}
      <TamagotchiCard
        stats={petStats}
        locale={locale}
        variant="hero"
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Household Fund */}
        <Card className="border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-xs relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {locale === 'en' ? 'Household Fund' : locale === 'ca' ? 'Fons Comú de la Llar' : 'Fondo Común del Hogar'}
            </span>
            <PiggyBank className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalHouseholdFund)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              {totalHouseholdFund > 0 ? (
                <>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totalHouseholdFund - currentTotalSpent)}
                  </span>
                  <span>{locale === 'en' ? 'remaining from contributions.' : locale === 'ca' ? 'remanent de les quotes.' : 'remanente de las cuotas.'}</span>
                </>
              ) : (
                <span>{locale === 'en' ? 'No contributions configured.' : locale === 'ca' ? 'Sense aportacions configurades.' : 'Sin aportaciones configuradas.'}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card className="border-slate-200/50 shadow-xs relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.totalSpent')}
            </span>
            <Receipt className="h-4.5 w-4.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(currentTotalSpent)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              {diffAbsolute > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-destructive font-semibold">
                    +{diffPercentage.toFixed(0)}%
                  </span>
                </>
              ) : diffAbsolute < 0 ? (
                <>
                  <TrendingDown className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-emerald-500 font-semibold">
                    {diffPercentage.toFixed(0)}%
                  </span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{locale === 'en' ? 'Same' : locale === 'ca' ? 'Igual' : 'Igual'}</span>
                </>
              )}
              <span className="text-muted-foreground">{locale === 'en' ? 'vs last month' : locale === 'ca' ? 'vs mes anterior' : 'vs. mes anterior'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Average */}
        <Card className="border-slate-200/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.monthlyAvg')}
            </span>
            <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(dailyAverage)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'en' ? `Calculated over ${daysPassed} days.` : locale === 'ca' ? `Calculat sobre ${daysPassed} dies traspassats.` : `Calculado sobre ${daysPassed} días transcurridos.`}
            </p>
          </CardContent>
        </Card>

        {/* Budget Limit */}
        <Card className="border-slate-200/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dashboard.budgetStatus')}
            </span>
            <Layers className="h-4.5 w-4.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalBudgeted)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {totalBudgeted > 0
                  ? `${((currentTotalSpent / totalBudgeted) * 100).toFixed(0)}%`
                  : '0%'}
              </span>
              <span>{locale === 'en' ? 'of allocated budget consumed.' : locale === 'ca' ? 'del pressupost total consumit.' : 'del total asignado consumido.'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Charts */}
      <DashboardCharts
        pieData={pieChartData}
        lineData={lineChartData}
        barData={barChartData}
        stackedData={stackedChartData}
        memberNames={memberNames}
        membersIncomeAndSpent={membersIncomeAndSpent}
      />

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Budgets in Alert */}
        <Card className="border-slate-200/50 shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {locale === 'en' ? 'Budgets in Alert' : locale === 'ca' ? 'Pressupostos en Alerta' : 'Presupuestos en Alerta'}
            </CardTitle>
            <CardDescription>
              {locale === 'en' ? 'Categories over 80% of monthly budget.' : locale === 'ca' ? 'Categories que han superat el 80% del pressupost.' : 'Categorías que han superado el 80% de su presupuesto.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!budgetsAlert || budgetsAlert.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
                {locale === 'en' ? 'No budgets in alert state this month. Great job!' : locale === 'ca' ? 'Cap pressupost en alerta aquest mes. Bona feina!' : 'No hay presupuestos en estado de alerta este mes. ¡Buen trabajo!'}
              </div>
            ) : (
              budgetsAlert.map((b) => {
                const isExceeded = b.percent >= 100

                return (
                  <div key={b.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        {b.categoryName}
                      </span>
                      <span className={isExceeded ? 'text-destructive font-bold' : 'text-amber-500 font-semibold'}>
                        {b.percent.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isExceeded ? 'bg-destructive' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(b.percent, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{formatCurrency(b.spent)}</span>
                      <span>{locale === 'en' ? 'Limit:' : locale === 'ca' ? 'Límit:' : 'Límite:'} {formatCurrency(b.limit)}</span>
                    </div>
                  </div>
                )
              })
            )}
            <Link
              href="/budgets"
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: 'w-full text-xs text-primary hover:text-primary mt-2',
              })}
            >
              {locale === 'en' ? 'Manage budgets' : locale === 'ca' ? 'Gestionar pressupostos' : 'Gestionar presupuestos'}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Household Activity */}
        <div className="lg:col-span-1 h-full">
          <ActivityFeed activities={activities} />
        </div>

        {/* Latest Expenses */}
        <Card className="border-slate-200/50 shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.recentExpenses')}</CardTitle>
            <CardDescription>
              {locale === 'en' ? 'The 5 most recent expenses recorded.' : locale === 'ca' ? 'Les 5 darreres despeses enregistrades.' : 'Los 5 gastos registrados más recientes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground">
                {t('expenses.noExpenses')}
              </div>
            ) : (
              <div className="space-y-4">
                {latestExpenses.map((exp, idx) => {
                  const category = exp.categories as any
                  const creator = exp.profiles as any
                  const LucideIconComp = category?.icon
                    ? ((Icons as any)[category.icon] as LucideIcon)
                    : null

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:bg-muted/10 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-9 w-9 rounded-xl flex items-center justify-center shadow-xs border"
                          style={{
                            backgroundColor: `${category?.color || '#64748b'}15`,
                            color: category?.color || '#64748b',
                          }}
                        >
                          {LucideIconComp ? (
                            <LucideIconComp className="h-5 w-5" />
                          ) : (
                            <Icons.Tag className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-foreground truncate">
                            {exp.description}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>{category?.name}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Avatar className="h-3.5 w-3.5 border border-border/40">
                                {creator?.avatar_url ? (
                                  <AvatarImage src={creator.avatar_url} alt={creator.display_name || 'Miembro'} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="bg-muted text-muted-foreground text-[8px] font-semibold">
                                  {(creator?.display_name || 'M').substring(0, 1).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{creator?.display_name}</span>
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-bold text-sm text-foreground">
                          {formatCurrency(exp.amount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(exp.expense_date).toLocaleDateString(dateLocaleStr, {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })}

                <Link
                  href="/expenses"
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'sm',
                    className: 'w-full text-xs text-primary hover:text-primary mt-2',
                  })}
                >
                  {locale === 'en' ? 'View all expenses' : locale === 'ca' ? 'Veure totes les despeses' : 'Ver todos los gastos'}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
