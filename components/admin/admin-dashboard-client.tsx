'use client'

import { useEffect, useState } from 'react'
import { AdminMetrics, getAdminMetricsAction } from '@/app/actions/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Users,
  Home,
  Receipt,
  Euro,
  Bot,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Lock,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'

export function AdminDashboardClient() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    const res = await getAdminMetricsAction()
    if (res.error) {
      setError(res.error)
    } else if (res.data) {
      setMetrics(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    document.title = 'SuperAdmin Dashboard | Control Dotz'
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Cargando métricas globales del sistema...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Acceso Restringido</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-xl">
            Volver al Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-violet-900/40 via-indigo-900/40 to-slate-900/60 p-6 rounded-3xl border border-violet-500/20 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Panel de SuperAdministrador</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Métricas del Sistema Contro-Dotz
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Monitorización en tiempo real de actividad, usuarios, hogares e interacciones IA.
          </p>
        </div>

        <Button
          onClick={fetchMetrics}
          disabled={loading}
          variant="outline"
          className="rounded-xl bg-background/50 hover:bg-background backdrop-blur-sm border-slate-700 font-semibold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Usuarios Totales
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {metrics.totalUsers}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <Activity className="h-3 w-3 text-emerald-500" /> Cuentas registradas
            </p>
          </CardContent>
        </Card>

        {/* Total Households */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hogares Activos
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Home className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {metrics.totalHouseholds}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Grupos familiares creados
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses Count */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gastos Registrados
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {metrics.totalExpenses}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
              Volumen: <span className="text-emerald-400 font-bold">{formatCurrency(metrics.totalAmountTracked)}</span>
            </p>
          </CardContent>
        </Card>

        {/* AI Bot Usage */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Uso de Gemini AI
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {metrics.totalAiResponses}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              Respuestas del asistente inteligente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row: Recent Users & Recent Households */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users Table */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-800/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Últimos Usuarios Registrados
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Cuentas más recientes en la plataforma
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800/60">
              {metrics.recentUsers.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {u.display_name || u.email.split('@')[0]}
                      </span>
                      {u.is_super_admin && (
                        <span className="text-[10px] bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {new Date(u.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Households Table */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-800/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
                  <Home className="h-5 w-5 text-indigo-500" />
                  Últimos Hogares Creados
                </CardTitle>
                <CardDescription className="text-xs font-medium">
                  Nuevos grupos familiares en el sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800/60">
              {metrics.recentHouseholds.map((h) => (
                <div key={h.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground">{h.name}</span>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      ID: {h.id}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {new Date(h.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
