'use client'

import { useEffect, useState } from 'react'
import { AdminMetrics, getAdminMetricsAction } from '@/app/actions/admin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'
import { updateFeedbackStatusAction, FeedbackStatus } from '@/app/actions/feedback'
import { toast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n/i18n-context'

const statusBadges: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  in_progress: { label: 'En Curso', icon: AlertCircle, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  completed: { label: 'Completado', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Descartado', icon: XCircle, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
}

export function AdminDashboardClient() {
  const { t, locale } = useI18n()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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

  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    if (!metrics) return

    // Actualización optimista de estado
    setUpdatingId(feedbackId)
    setMetrics((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        recentFeedback: prev.recentFeedback.map((fb) =>
          fb.id === feedbackId ? { ...fb, status: newStatus } : fb
        ),
      }
    })

    const res = await updateFeedbackStatusAction(feedbackId, newStatus)
    setUpdatingId(null)

    if (res.error) {
      toast.add({
        title: 'Error al cambiar estado',
        description: res.error,
        type: 'error',
      })
      fetchMetrics() // Revertir en caso de falla
    } else {
      toast.add({
        title: 'Estado de sugerencia actualizado',
        description: `La sugerencia ahora está marcada como ${statusBadges[newStatus]?.label || newStatus}.`,
        type: 'success',
      })
    }
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
      {/* Top Header Card */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-violet-500/20 bg-linear-to-r from-violet-500/10 via-indigo-500/5 to-background dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-slate-900/60 backdrop-blur-xl shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400 text-xs font-bold uppercase tracking-wider">
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
          className="rounded-xl bg-background/80 hover:bg-background backdrop-blur-sm border-border font-semibold gap-2 self-start sm:self-auto shadow-2xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-2xs hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Usuarios Totales
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-2xs hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Hogares Activos
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
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
        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-2xs hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Gastos Registrados
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-heading">
              {metrics.totalExpenses}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium truncate">
              Volumen: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(metrics.totalAmountTracked)}</span>
            </p>
          </CardContent>
        </Card>

        {/* AI Bot Usage */}
        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-2xs hover:border-primary/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Uso de Gemini AI
            </CardTitle>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
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
        <Card className="border-border bg-card text-card-foreground rounded-2xl overflow-hidden shadow-2xs">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Últimos Usuarios Registrados
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  Cuentas más recientes en la plataforma
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {metrics.recentUsers.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {u.display_name || u.email.split('@')[0]}
                      </span>
                      {u.is_super_admin && (
                        <span className="text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{u.email}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {new Date(u.created_at).toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', {
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
        <Card className="border-border bg-card text-card-foreground rounded-2xl overflow-hidden shadow-2xs">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
                  <Home className="h-5 w-5 text-indigo-500" />
                  Últimos Hogares Creados
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  Nuevos grupos familiares en el sistema
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {metrics.recentHouseholds.map((h) => (
                <div key={h.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground">{h.name}</span>
                    <p className="text-xs text-muted-foreground font-mono truncate max-w-50">
                      ID: {h.id}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {new Date(h.created_at).toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', {
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

      {/* Recent Feedback Submissions Section */}
      {metrics.recentFeedback && metrics.recentFeedback.length > 0 && (
        <Card className="border-border bg-card text-card-foreground rounded-2xl overflow-hidden shadow-2xs">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-violet-500" />
                  Sugerencias y Feedback de Usuarios
                </CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  Gestión de estado y resolución de peticiones in-app
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {metrics.recentFeedback.map((fb) => {
                const currentStatus = fb.status || 'pending'
                const statusConfig = statusBadges[currentStatus] || statusBadges.pending
                const StatusIcon = statusConfig.icon

                return (
                  <div key={fb.id} className="p-4 space-y-2 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 uppercase tracking-wider">
                          {fb.category}
                        </span>
                        <span className="text-sm font-bold text-foreground">{fb.title}</span>
                      </div>

                      {/* Dropdown Selector de Estado para el SuperAdmin */}
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {new Date(fb.created_at).toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={updatingId === fb.id}
                                className={`h-7 px-2.5 rounded-lg border text-xs font-semibold gap-1.5 transition-all ${statusConfig.color}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                <span>{statusConfig.label}</span>
                                <ChevronDown className="h-3 w-3 opacity-60" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground rounded-xl w-40 p-1 shadow-md">
                            {(Object.keys(statusBadges) as FeedbackStatus[]).map((stKey) => {
                              const cfg = statusBadges[stKey]
                              const IconComp = cfg.icon
                              return (
                                <DropdownMenuItem
                                  key={stKey}
                                  onClick={() => handleStatusChange(fb.id, stKey)}
                                  className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                >
                                  <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{cfg.label}</span>
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-border/80">
                      {fb.description}
                    </p>
                    {fb.user_email && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Enviado por: <span className="text-foreground font-semibold">{fb.user_email}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
