'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import {
  Sparkles,
  Send,
  Mail,
  Bell,
  Trash2,
  Rocket,
  Zap,
  Wrench,
  Megaphone,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import {
  getAdminAppUpdatesAction,
  createAppUpdateAction,
  deleteAppUpdateAction,
  AppUpdate,
} from '@/app/actions/app-updates'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; className: string }
> = {
  feature: {
    label: 'Nueva Función',
    icon: Rocket,
    className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  },
  improvement: {
    label: 'Mejora',
    icon: Zap,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  fix: {
    label: 'Corrección',
    icon: Wrench,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  announcement: {
    label: 'Anuncio',
    icon: Megaphone,
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
}

const DESCRIPTION_TEMPLATES: Record<string, string> = {
  feature: `✨ ¿Qué hay de nuevo?
Hemos añadido [Nombre de la función], que te permite [explicar beneficio principal].

🔑 Novedades clave:
• [Punto 1]: [Detalle]
• [Punto 2]: [Detalle]

💡 ¿Cómo probarlo?
Accede a la sección de [Sección] desde el menú principal.`,

  improvement: `⚡ Optimización y Mejoras
Hemos realizado mejoras de rendimiento y usabilidad en la aplicación.

📌 Principales mejoras:
• [Mejora 1]: Mayor velocidad al navegar por [Pantalla].
• [Mejora 2]: Ajustes de diseño visual y responsive.`,

  fix: `🛠️ Corrección de Errores
Esta actualización incluye correcciones para solucionar incidencias reportadas.

🔧 Incidencias resueltas:
• [Solución 1]: Corregido problema al [Acción].
• [Solución 2]: Ajustes de estabilidad en [Módulo].`,

  announcement: `📢 Aviso Importante
[Detalle o motivo del aviso importante para la comunidad]

ℹ️ Información clave:
• [Punto clave 1]
• [Punto clave 2]`,
}

function parseSemver(vString?: string | null) {
  if (!vString) return { major: 1, minor: 0, patch: 0 }
  const clean = vString.replace(/^v/i, '').trim()
  const parts = clean.split('.').map((p) => parseInt(p, 10))
  const major = isNaN(parts[0]) ? 1 : parts[0]
  const minor = isNaN(parts[1]) ? 0 : parts[1]
  const patch = isNaN(parts[2]) ? 0 : parts[2]
  return { major, minor, patch }
}

function getSuggestedVersions(latestVersionStr?: string | null) {
  if (!latestVersionStr) {
    return {
      patch: 'v1.0.1',
      minor: 'v1.0.0',
      major: 'v2.0.0',
    }
  }
  const { major, minor, patch } = parseSemver(latestVersionStr)
  return {
    patch: `v${major}.${minor}.${patch + 1}`,
    minor: `v${major}.${minor + 1}.0`,
    major: `v${major + 1}.0.0`,
  }
}

export function AdminAppUpdatesTab() {
  const [updates, setUpdates] = useState<AppUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [version, setVersion] = useState('')
  const [category, setCategory] = useState<'feature' | 'improvement' | 'fix' | 'announcement'>('feature')
  const [content, setContent] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [sendPush, setSendPush] = useState(false)

  const [suggestedVersions, setSuggestedVersions] = useState({
    patch: 'v1.0.1',
    minor: 'v1.0.0',
    major: 'v2.0.0',
  })

  const fetchUpdates = async () => {
    setLoading(true)
    const res = await getAdminAppUpdatesAction()
    if (res.updates) {
      setUpdates(res.updates)
      const latestWithVersion = res.updates.find((u) => u.version)?.version
      const suggestions = getSuggestedVersions(latestWithVersion)
      setSuggestedVersions(suggestions)

      if (!version) {
        setVersion(suggestions.minor)
      }
      if (!content) {
        setContent(DESCRIPTION_TEMPLATES.feature)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUpdates()
  }, [])

  const handleCategorySelect = (cat: 'feature' | 'improvement' | 'fix' | 'announcement') => {
    setCategory(cat)
    if (cat === 'feature') {
      setVersion(suggestedVersions.minor)
    } else if (cat === 'fix' || cat === 'improvement') {
      setVersion(suggestedVersions.patch)
    }

    // Si el contenido está vacío o coincide con alguna plantilla existente, cambiar automáticamente la plantilla
    const isDefaultTemplate = Object.values(DESCRIPTION_TEMPLATES).includes(content) || !content.trim()
    if (isDefaultTemplate) {
      setContent(DESCRIPTION_TEMPLATES[cat] || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.add({
        title: 'Formulario incompleto',
        description: 'Debes proporcionar al menos un título y el contenido de la actualización.',
        type: 'error',
      })
      return
    }

    setSubmitting(true)

    const res = await createAppUpdateAction({
      title,
      version: version.trim() || undefined,
      category,
      content,
      isPublished: true,
      sendEmail,
      sendPush,
    })

    setSubmitting(false)

    if (res.error) {
      toast.add({
        title: 'Error al publicar actualización',
        description: res.error,
        type: 'error',
      })
    } else {
      let desc = 'La novedad ya está visible en la app.'
      if (res.emailStats && res.emailStats.sent > 0) {
        desc += ` Se enviaron ${res.emailStats.sent} correos.`
      }
      if (res.pushStats && res.pushStats.sent > 0) {
        desc += ` Se enviaron ${res.pushStats.sent} notificaciones push.`
      }

      toast.add({
        title: '¡Actualización publicada con éxito!',
        description: desc,
        type: 'success',
      })

      // Reset form
      setTitle('')
      setVersion('')
      setContent('')
      setCategory('feature')
      setSendEmail(false)
      setSendPush(false)

      fetchUpdates()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta novedad?')) return

    setDeletingId(id)
    const res = await deleteAppUpdateAction(id)
    setDeletingId(null)

    if (res.error) {
      toast.add({
        title: 'Error al eliminar',
        description: res.error,
        type: 'error',
      })
    } else {
      toast.add({
        title: 'Novedad eliminada',
        description: 'Se ha eliminado la actualización de la lista.',
        type: 'success',
      })
      fetchUpdates()
    }
  }

  return (
    <div className="space-y-8">
      {/* Formulario de Creación de Novedades */}
      <Card className="border-border bg-card text-card-foreground rounded-3xl overflow-hidden shadow-2xs">
        <CardHeader className="border-b border-border/60 p-6 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-background">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold font-heading">Publicar Nueva Novedad o Actualización</CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground">
                Crea un aviso para mostrar en la app y notificar opcionalmente por email o Web Push.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Título */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground">Título de la Actualización *</label>
                <Input
                  type="text"
                  placeholder="Ej: Nuevo módulo de Proyección de Tesorería a 12 meses"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl bg-muted/40 text-sm"
                  required
                />
              </div>

              {/* Versión */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Versión (Opcional)</label>
                <Input
                  type="text"
                  placeholder="Ej: v1.5.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="rounded-xl bg-muted/40 text-sm font-mono"
                />

                {/* Sugerencias SemVer */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-semibold">Sugerir:</span>
                  <button
                    type="button"
                    onClick={() => setVersion(suggestedVersions.patch)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer border border-amber-200 dark:border-amber-800"
                    title="Incremento de corrección/parche"
                  >
                    {suggestedVersions.patch} (Parche)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVersion(suggestedVersions.minor)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
                    title="Incremento de nueva funcionalidad"
                  >
                    {suggestedVersions.minor} (Función)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVersion(suggestedVersions.major)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer border border-purple-200 dark:border-purple-800"
                    title="Incremento mayor / gran versión"
                  >
                    {suggestedVersions.major} (Mayor)
                  </button>
                </div>
              </div>
            </div>

            {/* Categoría Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Categoría *</label>
              <div className="flex flex-wrap gap-2">
                {(['feature', 'improvement', 'fix', 'announcement'] as const).map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat]
                  const Icon = cfg.icon
                  const isSelected = category === cat

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? `${cfg.className} border-current shadow-xs`
                          : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Contenido / Descripción */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-foreground">Descripción / Detalles *</label>

                {/* Shortcuts de Plantilla */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-semibold">Plantilla:</span>
                  <button
                    type="button"
                    onClick={() => setContent(DESCRIPTION_TEMPLATES.feature)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
                    title="Cargar plantilla de Nueva Función"
                  >
                    🚀 Función
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent(DESCRIPTION_TEMPLATES.improvement)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
                    title="Cargar plantilla de Mejora"
                  >
                    ⚡ Mejora
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent(DESCRIPTION_TEMPLATES.fix)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer border border-amber-200 dark:border-amber-800"
                    title="Cargar plantilla de Corrección"
                  >
                    🛠️ Fix
                  </button>
                  <button
                    type="button"
                    onClick={() => setContent(DESCRIPTION_TEMPLATES.announcement)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer border border-purple-200 dark:border-purple-800"
                    title="Cargar plantilla de Anuncio"
                  >
                    📢 Anuncio
                  </button>
                </div>
              </div>

              <Textarea
                placeholder="Describe los aspectos clave de la actualización, ventajas y cómo probar la nueva funcionalidad..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="rounded-xl bg-muted/40 text-sm min-h-[140px] leading-relaxed"
                required
              />

              {/* Fragmentos de texto rápido */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-muted-foreground font-semibold">Añadir rápido:</span>
                <button
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev}\n• ` : '• '))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted hover:bg-accent text-foreground transition-all cursor-pointer border border-border"
                >
                  + Viñeta (•)
                </button>
                <button
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev}\n\n🔑 Novedades clave:\n• ` : '🔑 Novedades clave:\n• '))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted hover:bg-accent text-foreground transition-all cursor-pointer border border-border"
                >
                  + Novedades clave
                </button>
                <button
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev}\n\n💡 ¿Cómo probarlo?\nAccede a ` : '💡 ¿Cómo probarlo?\nAccede a '))}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted hover:bg-accent text-foreground transition-all cursor-pointer border border-border"
                >
                  + ¿Cómo probarlo?
                </button>
              </div>
            </div>

            {/* Toggles de Canales de Envío */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
              <span className="text-xs font-extrabold text-foreground uppercase tracking-wider block">
                Canales de Difusión
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email (Resend) */}
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">Enviar por Email (Resend)</span>
                      <span className="text-[10px] text-muted-foreground block">Notifica por correo a todos los usuarios</span>
                    </div>
                  </div>
                </label>

                {/* Web Push */}
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={(e) => setSendPush(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-purple-500" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">Notificación Web Push</span>
                      <span className="text-[10px] text-muted-foreground block">Envía un aviso al navegador/dispositivo</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 px-6 shadow-md cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Publicar Actualización</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Actualizaciones Publicadas */}
      <Card className="border-border bg-card text-card-foreground rounded-3xl overflow-hidden shadow-2xs">
        <CardHeader className="border-b border-border/60 p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold font-heading">Historial de Novedades Publicadas</CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground">
              Total de publicaciones: {updates.length}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUpdates}
            className="rounded-xl gap-2 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Lista
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <RefreshCw className="h-6 w-6 animate-spin mb-2 text-primary" />
              <p className="text-xs">Cargando novedades...</p>
            </div>
          ) : updates.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-medium">Aún no se ha publicado ninguna actualización.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((up) => {
                const cfg = CATEGORY_CONFIG[up.category] || CATEGORY_CONFIG.feature
                const IconComponent = cfg.icon

                let formattedDate = ''
                try {
                  formattedDate = format(new Date(up.published_at), "d 'de' MMMM, yyyy HH:mm", {
                    locale: es,
                  })
                } catch {
                  formattedDate = up.published_at
                }

                return (
                  <div
                    key={up.id}
                    className="p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/20 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`gap-1 px-2.5 py-0.5 text-xs font-medium border ${cfg.className}`}>
                          <IconComponent className="h-3 w-3" />
                          {cfg.label}
                        </Badge>

                        {up.version && (
                          <Badge variant="secondary" className="text-xs font-mono font-semibold bg-muted text-muted-foreground">
                            {up.version}
                          </Badge>
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium ml-auto sm:ml-0">
                          <Calendar className="h-3 w-3" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-foreground">{up.title}</h4>
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                        {up.content}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(up.id)}
                      disabled={deletingId === up.id}
                      className="text-destructive hover:bg-destructive/10 h-8 px-3 rounded-xl shrink-0 self-end sm:self-start cursor-pointer"
                      title="Eliminar actualización"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
