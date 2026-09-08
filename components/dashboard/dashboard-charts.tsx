'use client'

import { useState, useEffect, useMemo } from 'react'
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
import {
  LayoutDashboard,
  Users2,
  Landmark,
  TrendingUp,
  BarChart3,
  PieChartIcon,
  Calendar,
  Globe,
  Home,
  User,
  Check,
} from 'lucide-react'

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

interface MemberInfo {
  id: string
  name: string
}

interface ExpenseItem {
  id: string
  amount: number | string
  expense_date: string
  created_by: string | null
  is_personal: boolean
  category_id?: string
  description?: string
}

interface DashboardChartsProps {
  pieData: PieData[]
  lineData: LineData[]
  barData: BarData[]
  stackedData: any[]
  memberNames: string[]
  membersIncomeAndSpent?: MemberIncomeAndSpent[]
  allExpenses?: ExpenseItem[]
  mappedMembers?: MemberInfo[]
  currentUserId?: string
}

export function DashboardCharts({
  pieData,
  lineData,
  barData,
  stackedData,
  memberNames,
  membersIncomeAndSpent = [],
  allExpenses = [],
  mappedMembers = [],
  currentUserId,
}: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  type TimeframeMode = 'acumulado' | 'diario' | 'mensual' | 'anual'
  type ScopeMode = 'all' | 'shared' | 'personal'

  const [timeframe, setTimeframe] = useState<TimeframeMode>('acumulado')
  const [scopeFilter, setScopeFilter] = useState<ScopeMode>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Opción de lista unificada de miembros para el filtro multiselección
  const memberOptions = useMemo(() => {
    const list: { id: string; name: string }[] = []
    if (mappedMembers && mappedMembers.length > 0) {
      mappedMembers.forEach(m => list.push({ id: m.id, name: m.name }))
    } else if (memberNames && memberNames.length > 0) {
      memberNames.filter(n => n !== 'Compartido').forEach(n => list.push({ id: n, name: n }))
    }
    list.push({ id: 'shared', name: 'Compartido' })
    return list
  }, [mappedMembers, memberNames])

  // Lista de miembros activos con su color asignado
  const activeMembersList = useMemo(() => {
    const active = selectedUserIds.length === 0
      ? memberOptions
      : memberOptions.filter(opt => selectedUserIds.includes(opt.id))

    return active.map((m, idx) => {
      const globalIdx = memberOptions.findIndex(o => o.id === m.id)
      const color = MEMBER_COLORS[(globalIdx >= 0 ? globalIdx : idx) % MEMBER_COLORS.length]
      return {
        ...m,
        color,
      }
    })
  }, [memberOptions, selectedUserIds])

  const toggleUserSelection = (userId: string) => {
    if (userId === 'all') {
      setSelectedUserIds([])
      return
    }
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId))
    } else {
      setSelectedUserIds([...selectedUserIds, userId])
    }
  }

  // Filtrado de la lista allExpenses según Ámbito y Multiselección de Miembros
  const filteredExpenses = useMemo(() => {
    if (!allExpenses || allExpenses.length === 0) return []

    return allExpenses.filter(exp => {
      // 1. Ámbito (Hogar, Personal, Todos)
      if (scopeFilter === 'shared' && exp.is_personal) return false
      if (scopeFilter === 'personal' && !exp.is_personal) return false

      // 2. Multiselección de Usuarios (si hay usuarios activos seleccionados)
      if (selectedUserIds.length > 0) {
        const creator = exp.created_by || 'shared'
        if (!selectedUserIds.includes(creator)) return false
      }

      return true
    })
  }, [allExpenses, scopeFilter, selectedUserIds])

  // Generar dataset según el marco temporal activo con desglose por cada miembro
  const chartDataResult = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() // 0..11
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()

    const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

    if (timeframe === 'acumulado' || timeframe === 'diario') {
      // Mapa por id de miembro y por día
      const memberDayMap: Record<string, Record<number, number>> = {}
      activeMembersList.forEach(m => {
        memberDayMap[m.id] = {}
        for (let d = 1; d <= lastDayOfMonth; d++) {
          memberDayMap[m.id][d] = 0
        }
      })

      if (allExpenses && allExpenses.length > 0) {
        filteredExpenses.forEach(exp => {
          const dateObj = new Date(exp.expense_date)
          if (dateObj.getFullYear() === year && dateObj.getMonth() === month) {
            const dayNum = dateObj.getDate()
            const creatorId = exp.created_by || 'shared'
            if (memberDayMap[creatorId] !== undefined) {
              memberDayMap[creatorId][dayNum] = (memberDayMap[creatorId][dayNum] || 0) + Number(exp.amount)
            }
          }
        })
      } else if (scopeFilter === 'all' && selectedUserIds.length === 0) {
        // Fallback básico si no hay allExpenses
        const fallbackMember = activeMembersList[0]?.name || 'Total'
        let prev = 0
        const res = []
        for (let d = 1; d <= lastDayOfMonth; d++) {
          const item = lineData.find(l => parseInt(l.day) === d)
          const cumVal = item ? item.Gasto : prev
          const dayVal = Math.max(0, cumVal - prev)
          prev = cumVal
          const val = timeframe === 'acumulado' ? cumVal : dayVal
          res.push({
            label: `${d}`,
            [fallbackMember]: parseFloat(val.toFixed(2)),
            Total: parseFloat(val.toFixed(2))
          })
        }
        return res
      }

      const memberRunningCum: Record<string, number> = {}
      activeMembersList.forEach(m => { memberRunningCum[m.id] = 0 })

      const res = []
      for (let d = 1; d <= lastDayOfMonth; d++) {
        const point: Record<string, any> = { label: `${d}` }
        let dayTotalSpent = 0

        activeMembersList.forEach(m => {
          const dayAmount = memberDayMap[m.id]?.[d] || 0
          memberRunningCum[m.id] += dayAmount

          const val = timeframe === 'acumulado' ? memberRunningCum[m.id] : dayAmount
          point[m.name] = parseFloat(val.toFixed(2))
          dayTotalSpent += val
        })

        point.Total = parseFloat(dayTotalSpent.toFixed(2))
        res.push(point)
      }
      return res
    } else if (timeframe === 'mensual') {
      const memberMonthMap: Record<string, Record<number, number>> = {}
      activeMembersList.forEach(m => {
        memberMonthMap[m.id] = {}
        for (let mIdx = 0; mIdx < 12; mIdx++) {
          memberMonthMap[m.id][mIdx] = 0
        }
      })

      filteredExpenses.forEach(exp => {
        const dateObj = new Date(exp.expense_date)
        if (dateObj.getFullYear() === year) {
          const mIdx = dateObj.getMonth()
          const creatorId = exp.created_by || 'shared'
          if (memberMonthMap[creatorId] !== undefined) {
            memberMonthMap[creatorId][mIdx] = (memberMonthMap[creatorId][mIdx] || 0) + Number(exp.amount)
          }
        }
      })

      return MONTH_LABELS.map((name, mIdx) => {
        const point: Record<string, any> = { label: name }
        let monthTotal = 0
        activeMembersList.forEach(m => {
          const val = memberMonthMap[m.id]?.[mIdx] || 0
          point[m.name] = parseFloat(val.toFixed(2))
          monthTotal += val
        })
        point.Total = parseFloat(monthTotal.toFixed(2))
        return point
      })
    } else {
      // Anual
      const yearsSet = new Set<string>()
      yearsSet.add(year.toString())
      filteredExpenses.forEach(exp => {
        const yStr = new Date(exp.expense_date).getFullYear().toString()
        if (yStr && !isNaN(Number(yStr))) yearsSet.add(yStr)
      })

      const sortedYears = Array.from(yearsSet).sort()

      const memberYearMap: Record<string, Record<string, number>> = {}
      activeMembersList.forEach(m => {
        memberYearMap[m.id] = {}
        sortedYears.forEach(y => { memberYearMap[m.id][y] = 0 })
      })

      filteredExpenses.forEach(exp => {
        const yStr = new Date(exp.expense_date).getFullYear().toString()
        const creatorId = exp.created_by || 'shared'
        if (memberYearMap[creatorId] && memberYearMap[creatorId][yStr] !== undefined) {
          memberYearMap[creatorId][yStr] = (memberYearMap[creatorId][yStr] || 0) + Number(exp.amount)
        }
      })

      return sortedYears.map(yStr => {
        const point: Record<string, any> = { label: yStr }
        let yearTotal = 0
        activeMembersList.forEach(m => {
          const val = memberYearMap[m.id]?.[yStr] || 0
          point[m.name] = parseFloat(val.toFixed(2))
          yearTotal += val
        })
        point.Total = parseFloat(yearTotal.toFixed(2))
        return point
      })
    }
  }, [timeframe, filteredExpenses, allExpenses, lineData, scopeFilter, selectedUserIds, activeMembersList])

  // Micro-métricas de resumen
  const totalInView = useMemo(() => {
    if (chartDataResult.length === 0) return 0
    if (timeframe === 'acumulado') {
      return chartDataResult[chartDataResult.length - 1]?.Total || 0
    }
    return chartDataResult.reduce((sum, item) => sum + (item.Total || 0), 0)
  }, [chartDataResult, timeframe])

  const avgInView = useMemo(() => {
    if (chartDataResult.length === 0) return 0
    return totalInView / chartDataResult.length
  }, [totalInView, chartDataResult])

  const maxInView = useMemo(() => {
    if (chartDataResult.length === 0) return 0
    return Math.max(...chartDataResult.map(i => i.Total || 0))
  }, [chartDataResult])

  // Tooltip dinámico para la gráfica desglosada por miembros
  const CustomStackedDynamicTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      let titleLabel = ''
      if (timeframe === 'acumulado') titleLabel = `Día ${data.label} (Acumulado)`
      else if (timeframe === 'diario') titleLabel = `Día ${data.label}`
      else if (timeframe === 'mensual') titleLabel = `Mes: ${data.label}`
      else titleLabel = `Año ${data.label}`

      const totalVal = data.Total !== undefined ? data.Total : payload.reduce((sum: number, p: any) => sum + Number(p.value || 0), 0)

      return (
        <div className="bg-popover border border-border p-3 rounded-xl shadow-md text-xs text-popover-foreground space-y-2 min-w-48">
          <div className="font-bold border-b pb-1.5 text-foreground flex justify-between items-center">
            <span>{titleLabel}</span>
            <span className="text-primary font-extrabold">{formatCurrency(totalVal)}</span>
          </div>
          <div className="space-y-1 pt-0.5">
            {payload.map((item: any) => {
              if (item.value === undefined || item.value === null) return null
              return (
                <div key={item.name} className="flex justify-between items-center gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-foreground">{item.name}:</span>
                  </span>
                  <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

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
              <CardHeader className="space-y-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {timeframe === 'acumulado' && <TrendingUp className="h-5 w-5 text-primary" />}
                      {timeframe === 'diario' && <Calendar className="h-5 w-5 text-indigo-500" />}
                      {timeframe === 'mensual' && <BarChart3 className="h-5 w-5 text-emerald-500" />}
                      {timeframe === 'anual' && <Landmark className="h-5 w-5 text-amber-500" />}
                      {timeframe === 'acumulado' && 'Evolución de Gastos (Acumulado)'}
                      {timeframe === 'diario' && 'Gastos Diarios (Mes Actual)'}
                      {timeframe === 'mensual' && 'Gastos Mensuales (Año Actual)'}
                      {timeframe === 'anual' && 'Gastos Anuales (Histórico)'}
                    </CardTitle>
                    <CardDescription>
                      {timeframe === 'acumulado' && 'Historial acumulado del período seleccionado.'}
                      {timeframe === 'diario' && 'Desglose de importe gastado día por día.'}
                      {timeframe === 'mensual' && 'Evolución total gastada en cada mes del año.'}
                      {timeframe === 'anual' && 'Consolidado anual de gastos registrados.'}
                    </CardDescription>
                  </div>

                  {/* Selector de Marco Temporal */}
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shrink-0">
                    {[
                      { id: 'acumulado', label: 'Acumulado', icon: TrendingUp },
                      { id: 'diario', label: 'Diario', icon: Calendar },
                      { id: 'mensual', label: 'Mensual', icon: BarChart3 },
                      { id: 'anual', label: 'Anual', icon: Landmark },
                    ].map((tf) => {
                      const Icon = tf.icon
                      const isActive = timeframe === tf.id
                      return (
                        <button
                          key={tf.id}
                          onClick={() => setTimeframe(tf.id as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-background text-foreground shadow-xs border border-border/60'
                              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                          }`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : ''}`} />
                          {tf.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Filtros Secundarios: Ámbito y Multiselección de Usuarios */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                  {/* Selector de Ámbito */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    {[
                      { id: 'all', label: 'Todos', icon: Globe },
                      { id: 'shared', label: 'Hogar', icon: Home },
                      { id: 'personal', label: 'Personal', icon: User },
                    ].map((sc) => {
                      const Icon = sc.icon
                      const isActive = scopeFilter === sc.id
                      return (
                        <button
                          key={sc.id}
                          onClick={() => setScopeFilter(sc.id as any)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {sc.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Multiselección de Miembros */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground mr-0.5 flex items-center gap-1">
                      <Users2 className="h-3.5 w-3.5 text-primary" /> Miembros:
                    </span>

                    <button
                      onClick={() => toggleUserSelection('all')}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                        selectedUserIds.length === 0
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'bg-muted/30 border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Todos
                    </button>

                    {memberOptions.map((mem) => {
                      const isSelected = selectedUserIds.includes(mem.id)
                      const activeMem = activeMembersList.find(a => a.id === mem.id)
                      const memColor = activeMem?.color || '#64748b'

                      return (
                        <button
                          key={mem.id}
                          onClick={() => toggleUserSelection(mem.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold shadow-2xs'
                              : 'bg-muted/30 border-transparent text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: memColor }} />
                          {isSelected && <Check className="h-3 w-3 text-emerald-500 shrink-0" />}
                          {mem.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Micro Estadísticas de la Vista */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Período</span>
                    <span className="text-sm font-extrabold text-foreground">{formatCurrency(totalInView)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Promedio</span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(avgInView)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Pico Máximo</span>
                    <span className="text-sm font-bold text-primary">{formatCurrency(maxInView)}</span>
                  </div>
                </div>

                <div className="h-75">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    {timeframe === 'acumulado' ? (
                      <AreaChart
                        data={chartDataResult}
                        margin={{ top: 10, right: 10, left: -8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                          dataKey="label"
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
                        <Tooltip content={<CustomStackedDynamicTooltip />} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                        {activeMembersList.map((mem) => (
                          <Area
                            key={mem.id}
                            type="monotone"
                            dataKey={mem.name}
                            name={mem.name}
                            stackId="1"
                            stroke={mem.color}
                            fill={mem.color}
                            fillOpacity={0.35}
                          />
                        ))}
                      </AreaChart>
                    ) : (
                      <BarChart
                        data={chartDataResult}
                        margin={{ top: 10, right: 10, left: -8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                        <XAxis
                          dataKey="label"
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
                        <Tooltip content={<CustomStackedDynamicTooltip />} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                        {activeMembersList.map((mem, idx) => (
                          <Bar
                            key={mem.id}
                            dataKey={mem.name}
                            name={mem.name}
                            stackId="1"
                            fill={mem.color}
                            radius={idx === activeMembersList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
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
