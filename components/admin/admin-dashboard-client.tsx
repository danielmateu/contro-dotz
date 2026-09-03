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
  Search,
  LayoutGrid,
  LayoutList,
  Tag,
  Filter,
  Inbox,
  GripVertical,
} from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'
import { updateFeedbackStatusAction, FeedbackStatus } from '@/app/actions/feedback'
import { toast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const statusBadges: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  in_progress: { label: 'En Curso', icon: AlertCircle, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  completed: { label: 'Completado', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Descartado', icon: XCircle, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
}

const categoryColors: Record<string, string> = {
  BUG: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  FEATURE: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  OTHER: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  SUGGESTION: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
}

export function AdminDashboardClient() {
  const { t, locale } = useI18n()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Estados de control para el módulo de Sugerencias y Feedback
  const [feedbackViewMode, setFeedbackViewMode] = useState<'list' | 'kanban'>('list')
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | FeedbackStatus>('all')
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<string>('all')
  const [feedbackSearch, setFeedbackSearch] = useState<string>('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<FeedbackStatus | null>(null)

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
      {metrics.recentFeedback && metrics.recentFeedback.length > 0 && (() => {
        const allFeedback = metrics.recentFeedback || []

        const counts = {
          all: allFeedback.length,
          pending: allFeedback.filter((fb) => (fb.status || 'pending') === 'pending').length,
          in_progress: allFeedback.filter((fb) => fb.status === 'in_progress').length,
          completed: allFeedback.filter((fb) => fb.status === 'completed').length,
          rejected: allFeedback.filter((fb) => fb.status === 'rejected').length,
        }

        const categories = Array.from(
          new Set(allFeedback.map((fb) => fb.category).filter(Boolean))
        )

        const filteredFeedback = allFeedback.filter((fb) => {
          const currentStatus = fb.status || 'pending'
          if (feedbackStatusFilter !== 'all' && currentStatus !== feedbackStatusFilter) return false
          if (feedbackCategoryFilter !== 'all' && fb.category !== feedbackCategoryFilter) return false
          if (feedbackSearch.trim()) {
            const q = feedbackSearch.toLowerCase()
            const matchTitle = fb.title.toLowerCase().includes(q)
            const matchDesc = fb.description.toLowerCase().includes(q)
            const matchEmail = fb.user_email ? fb.user_email.toLowerCase().includes(q) : false
            const matchCategory = fb.category ? fb.category.toLowerCase().includes(q) : false
            if (!matchTitle && !matchDesc && !matchEmail && !matchCategory) return false
          }
          return true
        })

        const kanbanStatuses: FeedbackStatus[] = ['pending', 'in_progress', 'completed', 'rejected']

        return (
          <Card className="border-border bg-card text-card-foreground rounded-3xl overflow-hidden shadow-2xs">
            {/* Top Bar Header */}
            <CardHeader className="border-b border-border/60 p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-extrabold font-heading flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <MessageSquare className="h-4.5 w-4.5" />
                    </div>
                    Sugerencias y Feedback de Usuarios
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground">
                    Gestión en tiempo real de tickets, solicitudes y reportes de la comunidad
                  </CardDescription>
                </div>

                {/* View Mode Selector: Lista vs Kanban */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-border/60 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setFeedbackViewMode('list')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      feedbackViewMode === 'list'
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    <span>Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackViewMode('kanban')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      feedbackViewMode === 'kanban'
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Tablero Kanban</span>
                  </button>
                </div>
              </div>

              {/* Filters Control Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
                {/* Status Tabs Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setFeedbackStatusFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border",
                      feedbackStatusFilter === 'all'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    <span>Todos</span>
                    <span className={cn(
                      "px-1.5 py-0.2 text-[10px] rounded-full font-bold",
                      feedbackStatusFilter === 'all' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {counts.all}
                    </span>
                  </button>

                  {(['pending', 'in_progress', 'completed', 'rejected'] as FeedbackStatus[]).map((stKey) => {
                    const cfg = statusBadges[stKey]
                    const IconComp = cfg.icon
                    const isSelected = feedbackStatusFilter === stKey
                    const count = counts[stKey]

                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => setFeedbackStatusFilter(stKey)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border",
                          isSelected
                            ? `${cfg.color} border-current font-bold shadow-2xs`
                            : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        <span>{cfg.label}</span>
                        <span className="px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-background/50 border border-current/20">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Right side: Search & Category filter */}
                <div className="flex items-center gap-2">
                  {/* Search input */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar por título, texto o mail..."
                      value={feedbackSearch}
                      onChange={(e) => setFeedbackSearch(e.target.value)}
                      className="pl-9 h-8 text-xs bg-muted/30 focus:bg-background border-border/80 rounded-xl"
                    />
                    {feedbackSearch && (
                      <button
                        type="button"
                        onClick={() => setFeedbackSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl font-semibold gap-1.5 border-border/80 cursor-pointer">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{feedbackCategoryFilter === 'all' ? 'Categorías' : feedbackCategoryFilter}</span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground rounded-xl w-44 p-1 shadow-md">
                        <DropdownMenuItem
                          onClick={() => setFeedbackCategoryFilter('all')}
                          className="text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5"
                        >
                          Todas las categorías
                        </DropdownMenuItem>
                        {categories.map((cat) => (
                          <DropdownMenuItem
                            key={cat}
                            onClick={() => setFeedbackCategoryFilter(cat)}
                            className="text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5 flex items-center justify-between"
                          >
                            <span>{cat}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* LIST VIEW MODE */}
              {feedbackViewMode === 'list' && (
                <div>
                  {filteredFeedback.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                        <Inbox className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No se encontraron sugerencias</p>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        No hay tickets que coincidan con los filtros seleccionados o la búsqueda actual.
                      </p>
                      {(feedbackStatusFilter !== 'all' || feedbackCategoryFilter !== 'all' || feedbackSearch) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFeedbackStatusFilter('all')
                            setFeedbackCategoryFilter('all')
                            setFeedbackSearch('')
                          }}
                          className="text-xs text-primary font-bold hover:underline cursor-pointer"
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredFeedback.map((fb) => {
                        const currentStatus = fb.status || 'pending'
                        const statusConfig = statusBadges[currentStatus] || statusBadges.pending
                        const StatusIcon = statusConfig.icon
                        const categoryColor = categoryColors[fb.category?.toUpperCase()] || categoryColors.OTHER

                        return (
                          <div
                            key={fb.id}
                            className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/30 transition-all space-y-3 shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn("text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider", categoryColor)}>
                                  {fb.category}
                                </span>
                                <h3 className="text-sm font-bold text-foreground">{fb.title}</h3>
                              </div>

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
                                        className={`h-7 px-2.5 rounded-lg border text-xs font-semibold gap-1.5 transition-all cursor-pointer ${statusConfig.color}`}
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
                                          className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
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
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono pt-1">
                                <Users className="h-3 w-3 text-muted-foreground/70" />
                                <span>Enviado por:</span>
                                <span className="text-foreground font-semibold">{fb.user_email}</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* KANBAN BOARD VIEW MODE */}
              {feedbackViewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                  {kanbanStatuses.map((stKey) => {
                    const cfg = statusBadges[stKey]
                    const IconComp = cfg.icon
                    const isOver = dragOverCol === stKey

                    // Filter items for this column
                    const columnItems = filteredFeedback.filter(
                      (fb) => (fb.status || 'pending') === stKey
                    )

                    return (
                      <div
                        key={stKey}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                          if (dragOverCol !== stKey) setDragOverCol(stKey)
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDragOverCol(null)
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          setDragOverCol(null)
                          setDraggedId(null)
                          const fbId = e.dataTransfer.getData('text/plain')
                          if (fbId) {
                            handleStatusChange(fbId, stKey)
                          }
                        }}
                        className={cn(
                          "rounded-2xl border p-3 space-y-3 min-h-[340px] flex flex-col transition-all duration-200",
                          isOver
                            ? "border-violet-500/80 ring-2 ring-violet-500/20 bg-violet-500/5 dark:bg-violet-950/20 shadow-lg scale-[1.01]"
                            : "border-border/80 bg-slate-500/5 dark:bg-slate-900/30"
                        )}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-border/40 backdrop-blur-xs">
                          <div className="flex items-center gap-2">
                            <span className={cn("p-1.5 rounded-lg border", cfg.color)}>
                              <IconComp className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-bold text-foreground font-heading">
                              {cfg.label}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {columnItems.length}
                          </span>
                        </div>

                        {/* Column Content */}
                        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-1">
                          {columnItems.length === 0 ? (
                            <div className={cn(
                              "py-12 text-center text-xs font-medium rounded-xl border border-dashed transition-all",
                              isOver ? "border-violet-500/50 text-violet-600 dark:text-violet-400 bg-violet-500/10 font-bold" : "border-border/60 text-muted-foreground/50"
                            )}>
                              {isOver ? '¡Soltar ticket aquí!' : 'Sin tickets en esta columna'}
                            </div>
                          ) : (
                            columnItems.map((fb) => {
                              const categoryColor = categoryColors[fb.category?.toUpperCase()] || categoryColors.OTHER
                              const isBeingDragged = draggedId === fb.id

                              return (
                                <div
                                  key={fb.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', fb.id)
                                    e.dataTransfer.effectAllowed = 'move'
                                    setDraggedId(fb.id)
                                  }}
                                  onDragEnd={() => {
                                    setDraggedId(null)
                                    setDragOverCol(null)
                                  }}
                                  className={cn(
                                    "p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all space-y-2.5 shadow-2xs group cursor-grab active:cursor-grabbing select-none",
                                    isBeingDragged && "opacity-40 scale-95 border-dashed border-violet-500 ring-2 ring-violet-500/30"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                                      <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider", categoryColor)}>
                                        {fb.category}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-medium">
                                      {new Date(fb.created_at).toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                      })}
                                    </span>
                                  </div>

                                  <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-tight">
                                    {fb.title}
                                  </h4>

                                  <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                                    {fb.description}
                                  </p>

                                  <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                                    {fb.user_email ? (
                                      <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[130px]">
                                        {fb.user_email.split('@')[0]}
                                      </span>
                                    ) : <span />}

                                    {/* Mover ticket a otro estado */}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger
                                        render={
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={updatingId === fb.id}
                                            className="h-6 px-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground rounded-lg cursor-pointer gap-1"
                                          >
                                            <span>Mover</span>
                                            <ChevronDown className="h-2.5 w-2.5" />
                                          </Button>
                                        }
                                      />
                                      <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground rounded-xl w-36 p-1 shadow-md">
                                        {kanbanStatuses.map((targetSt) => {
                                          if (targetSt === stKey) return null
                                          const targetCfg = statusBadges[targetSt]
                                          const TargetIcon = targetCfg.icon
                                          return (
                                            <DropdownMenuItem
                                              key={targetSt}
                                              onClick={() => handleStatusChange(fb.id, targetSt)}
                                              className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                                            >
                                              <TargetIcon className="h-3 w-3 text-muted-foreground" />
                                              <span>{targetCfg.label}</span>
                                            </DropdownMenuItem>
                                          )
                                        })}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}
