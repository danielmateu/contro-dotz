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

interface DashboardChartsProps {
  pieData: PieData[]
  lineData: LineData[]
  barData: BarData[]
  stackedData: any[]
  memberNames: string[]
}

export function DashboardCharts({
  pieData,
  lineData,
  barData,
  stackedData,
  memberNames,
}: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="w-full space-y-6">
        <div className="h-10 w-[350px] bg-muted/30 animate-pulse rounded-xl" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-[380px] md:col-span-2 bg-muted/10 animate-pulse rounded-2xl" />
          <div className="h-[380px] bg-muted/10 animate-pulse rounded-2xl" />
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
        <div className="bg-popover border border-border p-3 rounded-xl shadow-md text-xs text-popover-foreground space-y-1">
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

  return (
    <Tabs defaultValue="overview" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3 max-w-112.5 p-1 rounded-xl bg-transparent">
        <TabsTrigger value="overview" className="flex items-center gap-1.5 rounded-lg ">
          {/* <LayoutDashboard className="h-3.5 w-3.5" /> */}
          Vista General
        </TabsTrigger>
        <TabsTrigger value="budgets" className="flex items-center gap-1.5 rounded-lg ">
          {/* <Landmark className="h-3.5 w-3.5" /> */}
          Presupuesto vs Real
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center gap-1.5 rounded-lg ">
          {/* <Users2 className="h-3.5 w-3.5" /> */}
          Por Miembro
        </TabsTrigger>
      </TabsList>

      {/* PESTAÑA 1: VISTA GENERAL (PIE + SIMPLE AREA) */}
      <TabsContent value="overview" className="outline-none">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Evolución diaria (Simple Area con Degradados) */}
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
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart
                  data={lineData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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

          {/* Distribución por Categoría (Pie Chart con Gaps y Bordes Redondeados) */}
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
                <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                  Registra gastos para visualizar la distribución.
                </div>
              ) : (
                <>
                  <div className="h-[220px] w-full">
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

                  {/* Leyenda manual compacta */}
                  <div className="w-full grid grid-cols-2 gap-2 mt-2 max-h-[70px] overflow-y-auto pr-1">
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
      </TabsContent>

      {/* PESTAÑA 2: COMPARATIVA DE PRESUPUESTOS (SIMPLE BAR CHART) */}
      <TabsContent value="budgets" className="outline-none">
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
          <CardContent className="h-[350px]">
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
      </TabsContent>

      {/* PESTAÑA 3: CUMULATIVO POR MIEMBRO (STACKED AREA CHART) */}
      <TabsContent value="members" className="outline-none">
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users2 className="h-5 w-5 text-emerald-500" />
              Aportación de Gastos por Miembro
            </CardTitle>
            <CardDescription>
              Evolución acumulada de los gastos del mes dividida por la aportación individual de cada miembro.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
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
      </TabsContent>
    </Tabs>
  )
}
