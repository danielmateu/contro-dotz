'use client'

import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
  BarChart,
  Bar,
  Line,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/format'
import { LayoutDashboard, Users2, Landmark, TrendingUp, BarChart3, PieChartIcon } from 'lucide-react'

// Colores consistentes y alegres para las áreas apiladas de los miembros
const MEMBER_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ef4444', // Red
]

interface PieData {
  name: string
  value: number
  color: string
}

interface LineData {
  day: string
  Gasto: number
}

interface BarData {
  name: string
  Presupuesto: number
  Gastado: number
  color: string
}

interface MemberIncomeAndSpent {
  name: string
  income: number
  spent: number
}

interface DashboardChartsProps {
  pieData: PieData[]
  lineData: LineData[]
  barData: BarData[]
  stackedData: any[]
  memberNames: string[]
  membersIncomeAndSpent?: MemberIncomeAndSpent[]
}

export function DashboardCharts({
  pieData,
  lineData,
  barData,
  stackedData,
  memberNames,
  membersIncomeAndSpent = [],
}: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 1. Obtener día actual y calcular promedio diario para proyección
  const todayDate = new Date()
  const currentDay = todayDate.getDate()

  // Encontrar el gasto acumulado real al día de hoy
  const todayDataPoint = lineData.find((d) => parseInt(d.day) === currentDay)
  const todayCumulative = todayDataPoint
    ? todayDataPoint.Gasto
    : lineData[lineData.length - 1]?.Gasto || 0

  const avgDaily = currentDay > 0 ? todayCumulative / currentDay : 0

  const projectionData = lineData.map((d) => {
    const dayNum = parseInt(d.day)
    const isFuture = dayNum > currentDay

    return {
      day: d.day,
      'Gasto Real': isFuture ? null : d.Gasto,
      'Proyección': isFuture
        ? parseFloat((todayCumulative + avgDaily * (dayNum - currentDay)).toFixed(2))
        : d.Gasto,
    }
  })

  const finalProjected = projectionData[projectionData.length - 1]?.['Proyección'] || 0
  const totalBudget = barData.reduce((sum, item) => sum + item.Presupuesto, 0)
  const budgetDiff = totalBudget - finalProjected
  const isOverBudget = budgetDiff < 0

  // 5. Calcular estadísticas proporcionales
  const totalHouseholdIncome = membersIncomeAndSpent.reduce((sum, m) => sum + m.income, 0)
  const totalMemberSpent = membersIncomeAndSpent.reduce((sum, m) => sum + m.spent, 0)
  const totalSpentThisMonth = lineData[lineData.length - 1]?.Gasto || totalMemberSpent

  const proportionalAnalysis = membersIncomeAndSpent.map((m) => {
    const incomePercentage = totalHouseholdIncome > 0 ? (m.income / totalHouseholdIncome) * 100 : 0
    const proportionalShare = totalHouseholdIncome > 0 ? totalSpentThisMonth * (m.income / totalHouseholdIncome) : 0
    const diff = m.spent - proportionalShare
    return {
      ...m,
      incomePercentage,
      proportionalShare,
      diff,
    }
  })

  if (!isMounted) {
    return (
      <div className="w-full space-y-6">
        <div className="h-10 w-87.5 bg-muted/30 animate-pulse rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-95 md:col-span-2 bg-muted/10 animate-pulse rounded-2xl" />
          <div className="h-95 bg-muted/10 animate-pulse rounded-2xl" />
        </div>
      </div>
    )
  }

  // Tooltip personalizado para el gráfico circular
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border p-2.5 rounded-xl shadow-md text-xs text-popover-foreground">
          <span className="font-semibold">{data.name}:</span>{' '}
          <span className="font-bold">{formatCurrency(data.value)}</span>
        </div>
      )
    }
    return null
  }

  // Tooltip personalizado para el gráfico de evolución acumulada
  const CustomAreaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-2.5 rounded-xl shadow-md text-xs text-popover-foreground">
          <span className="font-semibold text-muted-foreground">Día {payload[0].payload.day}</span>
          <div className="mt-1 font-bold text-foreground">
            Total: <span className="text-primary">{formatCurrency(payload[0].value)}</span>
          </div>
        </div>
      )
    }
    return null
  }

  // Tooltip personalizado para el gráfico de comparación de presupuestos
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const budget = data.Presupuesto
      const spent = data.Gastado
      const diff = budget - spent
      const isExceeded = diff < 0

      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-md text-xs text-popover-foreground space-y-1">
          <p className="font-bold text-foreground border-b pb-1 mb-1">{data.name}</p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Presupuesto:</span>
            <span className="font-semibold">{formatCurrency(budget)}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Gastado:</span>
            <span className="font-semibold text-primary">{formatCurrency(spent)}</span>
          </p>
          <p className="flex justify-between gap-4 pt-1 border-t">
            <span className="text-muted-foreground">Diferencia:</span>
            <span className={`font-bold ${isExceeded ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isExceeded ? 'Excedido por ' : 'Sobrante: '}{formatCurrency(Math.abs(diff))}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  // Tooltip personalizado para el Stacked Area (miembros)
  const CustomStackedTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-md text-xs text-popover-foreground space-y-1.5">
          <p className="font-bold border-b pb-1 mb-1">Día {data.day}</p>
          {payload.map((item: any) => (
            <p key={item.name} className="flex justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-semibold">{formatCurrency(item.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Tooltip personalizado para el gráfico de proyección
  const CustomProjectionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-md text-xs text-popover-foreground space-y-1.5">
          <p className="font-bold border-b pb-1 mb-1 text-foreground">Día {data.day}</p>
          {data['Gasto Real'] !== null && (
            <p className="flex justify-between gap-4">
              <span className="text-muted-foreground">Gasto Real:</span>
              <span className="font-semibold text-primary">{formatCurrency(data['Gasto Real'])}</span>
            </p>
          )}
          <p className="flex justify-between gap-4">
            <span className="text-muted-foreground">Proyección:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(data['Proyección'])}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (!isMounted) {
    return (
      <div className="w-full h-100 flex items-center justify-center text-xs text-muted-foreground border border-slate-200/50 rounded-2xl bg-background/50 dark:border-slate-800/50">
        Cargando gráficos...
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 p-1 rounded-xl bg-transparent">
        <TabsTrigger value="overview" className="flex items-center gap-1.5 rounded-lg ">
          Vista General
        </TabsTrigger>
        <TabsTrigger value="budgets" className="flex items-center gap-1.5 rounded-lg ">
          Presupuesto vs Real
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center gap-1.5 rounded-lg ">
          Por Miembro
        </TabsTrigger>
        <TabsTrigger value="projection" className="flex items-center gap-1.5 rounded-lg ">
          Proyección
        </TabsTrigger>
      </TabsList>

      {/* PESTAÑA 1: VISTA GENERAL (PIE + SIMPLE AREA) */}
      <TabsContent value="overview" className="outline-none">
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-slate-200/50 shadow-md md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolución de Gastos (Acumulado)
                </CardTitle>
                <CardDescription>
                  Historial del gasto familiar diario acumulado durante el mes actual.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-87.5">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart
                    data={lineData}
                    margin={{ top: 10, right: 10, left: -8, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground font-medium"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground font-medium"
                      tickFormatter={(val) => `${val}€`}
                    />
                    <Tooltip content={<CustomAreaTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Gasto"
                      name="Total Gastado"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorGasto)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 shadow-md md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-emerald-500" />
                  Reparto de Gastos
                </CardTitle>
                <CardDescription>
                  Gastos por categoría este mes.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                {pieData.length === 0 ? (
                  <div className="w-55 h-55 flex items-center justify-center text-xs text-muted-foreground">
                    Registra gastos para visualizar la distribución.
                  </div>
                ) : (
                  <>
                    <div className="w-55 h-55">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            cornerRadius={8}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-2 mt-2 max-h-17.5 overflow-y-auto pr-1">
                      {pieData.slice(0, 6).map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground truncate"
                        >
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="truncate font-medium">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      <TabsContent value="budgets" className="outline-none">
        {activeTab === 'budgets' && (
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Presupuestos vs Gastos por Categoría
              </CardTitle>
              <CardDescription>
                Comparación visual de los presupuestos asignados frente al importe real consumido por categoría.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-87.5">
              {barData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  No hay presupuestos ni gastos registrados este mes.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart
                    data={barData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground font-medium"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground font-medium"
                      tickFormatter={(val) => `${val}€`}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend verticalAlign="top" height={36} className="text-xs" />
                    <Bar
                      dataKey="Presupuesto"
                      name="Presupuesto"
                      fill="#a855f7"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Gastado"
                      name="Gastado Real"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="members" className="outline-none">
        {activeTab === 'members' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Gráfico de Aportación */}
            <Card className="border-slate-200/50 shadow-md lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-emerald-500" />
                  Aportación de Gastos por Miembro
                </CardTitle>
                <CardDescription>
                  Evolución acumulada de los gastos del mes dividida por la aportación individual de cada miembro.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-87.5">
                {memberNames.length === 0 || stackedData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                    No hay aportaciones de miembros registradas este mes.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart
                      data={stackedData}
                      margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        className="text-[10px] fill-muted-foreground font-medium"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        className="text-[10px] fill-muted-foreground font-medium"
                        tickFormatter={(val) => `${val}€`}
                      />
                      <Tooltip content={<CustomStackedTooltip />} />
                      <Legend verticalAlign="top" height={36} />
                      {memberNames.map((name, index) => (
                        <Area
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stackId="1"
                          stroke={MEMBER_COLORS[index % MEMBER_COLORS.length]}
                          fill={MEMBER_COLORS[index % MEMBER_COLORS.length]}
                          fillOpacity={0.4}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Reparto Proporcional */}
            <Card className="border-slate-200/50 shadow-md lg:col-span-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-indigo-500" />
                  Reparto Proporcional
                </CardTitle>
                <CardDescription>
                  Comparación del esfuerzo financiero basado en los ingresos de cada uno.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                {totalHouseholdIncome === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground gap-3 h-full">
                    <div className="p-3 bg-muted/40 rounded-full">
                      <Landmark className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <p className="max-w-55">
                      No hay ingresos configurados en este hogar.
                    </p>
                    <p className="text-[11px] max-w-60 text-muted-foreground/80">
                      Configura tus ingresos mensuales netos en la sección de <strong>Ajustes</strong> para activar el análisis proporcional.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Ingresos del Hogar:</span>
                      <span className="font-semibold text-foreground text-sm">{formatCurrency(totalHouseholdIncome)}</span>
                    </div>

                    <div className="space-y-4 max-h-70 overflow-y-auto pr-1">
                      {proportionalAnalysis.map((m) => {
                        const contributionPercentage = totalMemberSpent > 0 ? (m.spent / totalMemberSpent) * 100 : 0
                        return (
                          <div key={m.name} className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-800/30 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-sm text-foreground">{m.name}</span>
                                <p className="text-[10px] text-muted-foreground">
                                  Ingreso: {formatCurrency(m.income)} ({m.incomePercentage.toFixed(0)}%)
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs font-bold ${m.diff > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : m.diff < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-muted-foreground'
                                  }`}>
                                  {m.diff > 0 ? '+' : ''}{formatCurrency(m.diff)}
                                </span>
                                <p className="text-[9px] text-muted-foreground">
                                  {m.diff > 0 ? 'Aportó de más' : m.diff < 0 ? 'Aportó de menos' : 'Equilibrado'}
                                </p>
                              </div>
                            </div>

                            {/* Progresos comparativos */}
                            <div className="space-y-1">
                              {/* Barra de Ingreso */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[9px] text-muted-foreground/80">
                                  <span>Peso de ingresos:</span>
                                  <span>{m.incomePercentage.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                    style={{ width: `${m.incomePercentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Barra de Gasto Real */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[9px] text-muted-foreground/80">
                                  <span>Gasto real aportado:</span>
                                  <span>{contributionPercentage.toFixed(0)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${contributionPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      {/* PESTAÑA 4: PROYECCIÓN PREDICTIVA (AREA + LINE PROJECTION) */}
      <TabsContent value="projection" className="outline-none">
        {activeTab === 'projection' && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-slate-200/50 shadow-md md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Proyección de Gastos del Mes
                </CardTitle>
                <CardDescription>
                  Proyección del gasto final estimado basándose en el ritmo diario acumulado hasta hoy.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-87.5">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart
                    data={projectionData}
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorGastoReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground font-medium"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      className="text-[10px] fill-muted-foreground font-medium"
                      tickFormatter={(val) => `${val}€`}
                    />
                    <Tooltip content={<CustomProjectionTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="Gasto Real"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorGastoReal)"
                      name="Gasto Real Acumulado"
                    />
                    <Line
                      type="monotone"
                      dataKey="Proyección"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Proyección Estimada"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Análisis Predictivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Promedio de gasto diario</span>
                  <p className="text-2xl font-extrabold text-foreground">
                    {formatCurrency(avgDaily)}
                    <span className="text-xs font-normal text-muted-foreground"> / día</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Gasto real acumulado (Día {currentDay})</span>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(todayCumulative)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Gasto final proyectado</span>
                  <p className="text-3xl font-extrabold text-primary">
                    {formatCurrency(finalProjected)}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60">
                  {totalBudget > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Presupuesto total del mes:</span>
                        <span className="text-foreground font-semibold">{formatCurrency(totalBudget)}</span>
                      </div>

                      <div className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${isOverBudget
                        ? 'bg-rose-50/50 border-rose-500/20 text-rose-700 dark:bg-rose-950/10 dark:border-rose-500/10 dark:text-rose-400'
                        : 'bg-emerald-50/50 border-emerald-500/20 text-emerald-700 dark:bg-emerald-950/10 dark:border-emerald-500/10 dark:text-emerald-400'
                        }`}>
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {isOverBudget ? '⚠️ Alerta de Desviación' : '✅ Proyección Saludable'}
                        </span>
                        <span className="text-xs leading-relaxed">
                          {isOverBudget
                            ? `A este ritmo, superaréis el presupuesto mensual por ${formatCurrency(Math.abs(budgetDiff))}. Considera reducir gastos no esenciales.`
                            : `¡Excelente control! A este ritmo, terminaréis el mes ahorrando ${formatCurrency(budgetDiff)} respecto al presupuesto.`
                          }
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Establece presupuestos en la pestaña de presupuestos para comparar con la proyección.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
