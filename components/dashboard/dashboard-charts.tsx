'use client'

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
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'

interface PieData {
  name: string
  value: number
  color: string
}

interface LineData {
  day: string
  Gasto: number
}

interface DashboardChartsProps {
  pieData: PieData[]
  lineData: LineData[]
}

export function DashboardCharts({ pieData, lineData }: DashboardChartsProps) {
  // Custom tooltip para el gráfico circular
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border p-2.5 rounded-lg shadow-md text-xs text-popover-foreground">
          <span className="font-semibold">{data.name}:</span>{' '}
          <span className="font-bold">{formatCurrency(data.value)}</span>
        </div>
      )
    }
    return null
  }

  // Custom tooltip para el gráfico de evolución
  const CustomAreaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-2.5 rounded-lg shadow-md text-xs text-popover-foreground">
          <span className="font-semibold">Día {payload[0].payload.day}:</span>{' '}
          <span className="font-bold text-primary">{formatCurrency(payload[0].value)}</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Evolución diaria (ocupa 2 columnas en pantallas grandes) */}
      <Card className="border-slate-200/50 shadow-md md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Evolución de Gastos</CardTitle>
          <CardDescription>
            Gasto diario acumulado durante el transcurso del mes actual.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart
              data={lineData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gastoGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="Gasto"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gastoGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribución por Categoría */}
      <Card className="border-slate-200/50 shadow-md md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Distribución por Categoría</CardTitle>
          <CardDescription>
            Reparto de los gastos familiares del mes actual.
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
                      paddingAngle={3}
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
  )
}
