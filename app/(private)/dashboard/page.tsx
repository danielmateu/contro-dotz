import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardCharts } from '@/components/dashboard/dashboard-charts'
import { ExpenseDialog } from '@/components/expenses/expense-dialog'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { calculateDailyAverage, calculatePercentageChange } from '@/lib/finance-utils'
import { Progress } from '@/components/ui/progress' // wait, we don't have shadcn progress but we can render a native div bar easily!
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Receipt,
  PiggyBank,
  Plus,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Layers,
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar membresía
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

  // Cargar categorías para el formulario de registro de gastos
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', membership.household_id)
    .order('name')

  // Obtener fechas del mes actual y mes anterior
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth() + 1
  const currentMonthStr = `${currentYear}-${currentMonthNum
    .toString()
    .padStart(2, '0')}`
  const currentLastDay = new Date(currentYear, currentMonthNum, 0).getDate()
  const currentStartDate = `${currentMonthStr}-01`
  const currentEndDate = `${currentMonthStr}-${currentLastDay
    .toString()
    .padStart(2, '0')}`

  // Fechas del mes anterior
  const prevDate = new Date(currentYear, currentMonthNum - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonthNum = prevDate.getMonth() + 1
  const prevMonthStr = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`
  const prevLastDay = new Date(prevYear, prevMonthNum, 0).getDate()
  const prevStartDate = `${prevMonthStr}-01`
  const prevEndDate = `${prevMonthStr}-${prevLastDay.toString().padStart(2, '0')}`

  // 1. Cargar gastos del mes actual
  const { data: currentExpenses } = await supabase
    .from('expenses')
    .select(
      'id, amount, description, expense_date, category_id, created_by, categories(name, color, icon), profiles:created_by(display_name)'
    )
    .eq('household_id', membership.household_id)
    .gte('expense_date', currentStartDate)
    .lte('expense_date', currentEndDate)

  // 2. Cargar gastos del mes anterior
  const { data: prevExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('household_id', membership.household_id)
    .gte('expense_date', prevStartDate)
    .lte('expense_date', prevEndDate)

  // 3. Cargar presupuestos mensuales
  const { data: currentBudgets } = await supabase
    .from('budgets')
    .select('id, amount, category_id, categories(name, color, icon)')
    .eq('household_id', membership.household_id)
    .eq('month', currentMonthStr)

  // 4. Cargar miembros del mismo hogar para cálculo de aportaciones acumuladas
  const { data: householdMembers } = await supabase
    .from('household_members')
    .select('user_id, profiles(display_name, email)')
    .eq('household_id', membership.household_id)

  const membersList = householdMembers || []
  const memberNames = membersList.map(m => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return prof?.display_name || prof?.email?.split('@')[0] || 'Miembro'
  })

  // --- CÁLCULO DE KPIs ---
  // A. Total Gastado
  const currentTotalSpent =
    currentExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
  const prevTotalSpent =
    prevExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

  // B. Promedio Diario
  const daysPassed = now.getDate()
  const dailyAverage = calculateDailyAverage(currentTotalSpent, daysPassed)

  // C. Comparativa
  const diffAbsolute = currentTotalSpent - prevTotalSpent
  const diffPercentage = calculatePercentageChange(currentTotalSpent, prevTotalSpent)

  // D. Total Presupuestado
  const totalBudgeted =
    currentBudgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

  // E. Suma de gastos por categoría
  const categorySpentMap: Record<string, number> = {}
  currentExpenses?.forEach((exp) => {
    const catId = exp.category_id
    const amt = Number(exp.amount)
    categorySpentMap[catId] = (categorySpentMap[catId] || 0) + amt
  })

  // --- PREPARAR DATOS PARA GRÁFICOS ---
  // Donut chart: gastos por categoría
  const categoryAgg: Record<
    string,
    { name: string; value: number; color: string }
  > = {}
  currentExpenses?.forEach((exp) => {
    const cat = exp.categories as any
    const catId = exp.category_id
    const amt = Number(exp.amount)
    if (catId) {
      if (!categoryAgg[catId]) {
        categoryAgg[catId] = {
          name: cat?.name || 'Otros',
          value: 0,
          color: cat?.color || '#64748b',
        }
      }
      categoryAgg[catId].value += amt
    }
  })
  const pieChartData = Object.values(categoryAgg)
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      value: parseFloat(d.value.toFixed(2)),
    }))

  // Area chart: evolución diaria acumulada
  const dailyMap: Record<number, number> = {}
  for (let d = 1; d <= currentLastDay; d++) {
    dailyMap[d] = 0
  }
  currentExpenses?.forEach((exp) => {
    const dateVal = new Date(exp.expense_date)
    const day = dateVal.getDate()
    dailyMap[day] = (dailyMap[day] || 0) + Number(exp.amount)
  })

  let lineCumulative = 0
  const lineChartData = Object.keys(dailyMap).map((dayKey) => {
    const day = parseInt(dayKey)
    lineCumulative += dailyMap[day]
    return {
      day: `${day}`,
      Gasto: parseFloat(lineCumulative.toFixed(2)),
    }
  })

  // Gráfico de barras: Presupuesto vs Real
  const categoriesMap = new Map<string, { id: string; name: string; color: string }>()
  currentBudgets?.forEach(b => {
    const cat = b.categories as any
    if (b.category_id && cat) {
      categoriesMap.set(b.category_id, { id: b.category_id, name: cat.name, color: cat.color })
    }
  })
  currentExpenses?.forEach(exp => {
    const cat = exp.categories as any
    if (exp.category_id && cat) {
      categoriesMap.set(exp.category_id, { id: exp.category_id, name: cat.name, color: cat.color })
    }
  })

  const barChartData = Array.from(categoriesMap.values()).map(cat => {
    const budget = currentBudgets?.find(b => b.category_id === cat.id)?.amount || 0
    const spent = categorySpentMap[cat.id] || 0
    return {
      name: cat.name,
      Presupuesto: Number(budget),
      Gastado: Number(spent),
      color: cat.color,
    }
  })

  // Stacked Area: Evolución acumulada diaria por cada miembro
  const runningTotal: Record<string, number> = {}
  memberNames.forEach(name => {
    runningTotal[name] = 0
  })

  const stackedChartData = []
  for (let d = 1; d <= currentLastDay; d++) {
    const dayExpenses = currentExpenses?.filter(exp => {
      const dateVal = new Date(exp.expense_date)
      return dateVal.getDate() === d
    }) || []

    dayExpenses.forEach(exp => {
      const matchedMember = membersList.find(m => m.user_id === exp.created_by)
      const prof = matchedMember ? (Array.isArray(matchedMember.profiles) ? matchedMember.profiles[0] : matchedMember.profiles) : null
      const name = prof?.display_name || prof?.email?.split('@')[0] || 'Miembro'
      runningTotal[name] = (runningTotal[name] || 0) + Number(exp.amount)
    })

    const dataPoint: Record<string, any> = { day: `${d}` }
    memberNames.forEach(name => {
      dataPoint[name] = parseFloat((runningTotal[name] || 0).toFixed(2))
    })
    stackedChartData.push(dataPoint)
  }

  // Presupuestos en alerta (>80%) o superados
  const budgetsAlert = currentBudgets
    ?.map((b) => {
      const cat = b.categories as any
      const spent = categorySpentMap[b.category_id] || 0
      const limit = Number(b.amount)
      const percent = limit > 0 ? (spent / limit) * 100 : 0
      return {
        id: b.id,
        categoryName: cat?.name || 'Categoría',
        color: cat?.color || '#64748b',
        icon: cat?.icon || 'Tag',
        spent,
        limit,
        percent,
      }
    })
    .filter((b) => b.percent >= 80)
    .sort((a, b) => b.percent - a.percent)

  // Últimos 5 gastos del mes
  const latestExpenses = currentExpenses
    ? [...currentExpenses]
        .sort(
          (a, b) =>
            new Date(b.expense_date).getTime() -
            new Date(a.expense_date).getTime()
        )
        .slice(0, 5)
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Resumen Financiero
          </h1>
          <p className="text-muted-foreground">
            Control de gastos familiares mensual y estado de tus presupuestos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ExpenseDialog
            householdId={membership.household_id}
            categories={categories || []}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Gasto
              </Button>
            }
          />
        </div>
      </div>

      {/* Tarjetas de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Gastado */}
        <Card className="border-slate-200/50 shadow-xs relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gasto del Mes
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
                  <span className="text-muted-foreground">Igual</span>
                </>
              )}
              <span className="text-muted-foreground">vs. mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Promedio Diario */}
        <Card className="border-slate-200/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Promedio Diario
            </span>
            <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(dailyAverage)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculado sobre {daysPassed} días transcurridos.
            </p>
          </CardContent>
        </Card>

        {/* Límite de Presupuesto */}
        <Card className="border-slate-200/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Presupuestos Establecidos
            </span>
            <PiggyBank className="h-4.5 w-4.5 text-muted-foreground" />
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
              <span>del total asignado consumido.</span>
            </div>
          </CardContent>
        </Card>

        {/* Categorías Activas */}
        <Card className="border-slate-200/50 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categorías en Uso
            </span>
            <Layers className="h-4.5 w-4.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pieChartData.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De las categorías de tu hogar familiar.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos del dashboard */}
      <DashboardCharts
        pieData={pieChartData}
        lineData={lineChartData}
        barData={barChartData}
        stackedData={stackedChartData}
        memberNames={memberNames}
      />

      {/* Sección inferior de alertas y últimos gastos */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Presupuestos en Alerta */}
        <Card className="border-slate-200/50 shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Presupuestos en Alerta
            </CardTitle>
            <CardDescription>
              Categorías que han superado el 80% de su presupuesto mensual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!budgetsAlert || budgetsAlert.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
                No hay presupuestos en estado de alerta este mes. ¡Buen trabajo!
              </div>
            ) : (
              budgetsAlert.map((b) => {
                const LucideIconComp = (Icons as any)[b.icon] as LucideIcon
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
                      <span>{formatCurrency(b.spent)} gastados</span>
                      <span>Límite: {formatCurrency(b.limit)}</span>
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
              Gestionar presupuestos
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Últimos 5 Gastos Registrados */}
        <Card className="border-slate-200/50 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Últimas Transacciones</CardTitle>
            <CardDescription>
              Los 5 gastos registrados más recientes de este mes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground">
                No hay transacciones registradas este mes.
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
                            <span>{creator?.display_name}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-bold text-sm text-foreground">
                          {formatCurrency(exp.amount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(exp.expense_date).toLocaleDateString('es-ES', {
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
                  Ver todos los gastos
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
