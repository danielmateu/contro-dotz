import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Control Dotz - Control de Gastos Familiares',
  description: 'La aplicación colaborativa y premium para gestionar los gastos del hogar, presupuestos mensuales y liquidar deudas familiares con facilidad y escáner de tickets con IA.',
}
import { MouseGlow } from '@/components/landing/mouse-glow'
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PiggyBank,
  Users2,
  Lock,
  Tag,
  CreditCard,
  MessageSquare,
  ShoppingBasket,
  Mail,
  Sparkles,
  Check,
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()

  // Comprobar si el usuario tiene sesión activa
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthenticated = !!user

  return (
    <div className="min-h-screen bg-radial from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between overflow-x-hidden relative">
      {/* Orbe de luz interactivo del ratón */}
      <MouseGlow />

      {/* Background glow structures */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Orbs de degradado difuminados estilo premium */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-3xl pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute top-[40%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl pointer-events-none animate-pulse duration-7000"></div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/30 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight font-heading">
            Control Dotz
          </span>
        </div>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard" className={buttonVariants({ size: 'sm', className: 'rounded-xl' })}>
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'rounded-xl' })}>
                Iniciar sesión
              </Link>
              <Link href="/register" className={buttonVariants({ size: 'sm', className: 'rounded-xl shadow-xs' })}>
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto space-y-8">
        {/* <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping"></span>
          Moneda principal: Euros (€) • Zona Horaria: Europe/Madrid
        </div> */}

        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight font-heading max-w-4xl leading-[1.05] text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-primary to-slate-800 dark:from-white dark:via-violet-400 dark:to-indigo-300">
          Controla tus gastos diarios en familia con total claridad
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed font-medium">
          Una aplicación colaborativa, rápida y con diseño premium para registrar gastos en el hogar, supervisar presupuestos mensuales y potenciar el ahorro familiar de forma segura.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          {isAuthenticated ? (
            <Link href="/dashboard" className={cn(buttonVariants({ size: 'lg' }), "px-8 py-6 rounded-xl text-base shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all duration-200")}>
              Ir a mi Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), "px-8 py-6 rounded-xl text-base shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all duration-200")}>
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), "px-8 py-6 rounded-xl text-base hover:bg-muted/50 hover:scale-[1.02] active:scale-95 transition-all duration-200")}>
                Iniciar sesión
              </Link>
            </>
          )}
        </div>

        {/* Mock UI Showcase de la aplicación */}
        <div className="w-full max-w-5xl mx-auto mt-16 p-2 border border-slate-200/40 bg-slate-200/20 dark:border-slate-800/80 dark:bg-slate-900/50 rounded-3xl shadow-2xl backdrop-blur-md transform hover:scale-[1.005] transition-all duration-305">
          <div className="bg-background rounded-[22px] p-6 text-left border border-slate-200/50 dark:border-slate-950 shadow-inner">
            {/* Header del Mockup */}
            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-900 pb-4 mb-5">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-[11px] font-mono text-muted-foreground ml-3 select-none">control-dotz.app/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  <div className="h-5.5 w-5.5 rounded-full border border-background bg-violet-600 text-white text-[8px] font-bold flex items-center justify-center select-none shadow-xs">MA</div>
                  <div className="h-5.5 w-5.5 rounded-full border border-background bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center select-none shadow-xs">PA</div>
                  <div className="h-5.5 w-5.5 rounded-full border border-background bg-slate-950 text-violet-400 text-[8px] font-bold flex items-center justify-center select-none shadow-xs" title="Gemini AI">🤖</div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-bold select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Dotzi House
                </div>
              </div>
            </div>

            {/* Grid del Mockup */}
            <div className="grid gap-5 md:grid-cols-3">
              {/* Columna 1: KPIs y Presupuestos */}
              <div className="space-y-4">
                {/* KPI Card */}
                <div className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Gasto mensual (agosto)</span>
                  <div className="text-2xl font-extrabold mt-1 text-foreground font-heading">1.450,20 €</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10">▲ +12.4%</span>
                    <span>vs. mes anterior</span>
                  </div>
                  
                  {/* Proyección predictiva Badge */}
                  <div className="mt-3.5 text-[9.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded-lg inline-flex items-center gap-1 select-none animate-pulse">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Proyectado al cierre: ~1.680 €
                  </div>
                </div>

                {/* Presupuesto Progress */}
                <div className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Límites Mensuales</span>
                  </div>
                  {/* Categoría A */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground text-[11px]">🛒 Alimentación</span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">82%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  {/* Categoría B */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-foreground text-[11px]">🍕 Ocio / Cenas</span>
                      <span className="text-[10px] font-bold text-rose-500">105%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-[9px] text-rose-500 font-bold">⚠️ ¡Presupuesto superado!</p>
                  </div>
                </div>
              </div>

              {/* Columna 2: Chat en Tiempo Real */}
              <div className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl flex flex-col h-[290px] justify-between">
                <div className="flex items-center justify-between border-b pb-2 border-slate-105 dark:border-slate-900">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Chat Familiar
                  </span>
                  <span className="text-[8.5px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider select-none">En vivo</span>
                </div>

                {/* Contenedor de burbujas */}
                <div className="flex-1 overflow-y-auto space-y-3.5 py-2.5 pr-0.5 scrollbar-none text-[11px]">
                  {/* Mensaje de usuario */}
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[8.5px] text-muted-foreground font-bold">Mateu</span>
                    <div className="bg-muted/70 text-foreground px-3 py-1.5 rounded-2xl rounded-tl-none max-w-[90%]">
                      Chicos, acabo de pagar la cena familiar 🍕
                    </div>
                  </div>

                  {/* Mensaje automático de sistema */}
                  <div className="flex flex-col items-start gap-0.5 w-full">
                    <span className="text-[8.5px] text-muted-foreground font-bold flex items-center gap-1">📢 Bot de Sistema</span>
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[10.5px] px-3 py-1.5 rounded-xl text-muted-foreground leading-normal w-full">
                      📢 **Gasto registrado**: **25,00€** en *Alimentación* para "Cena familiar"
                    </div>
                  </div>

                  {/* Mensaje de Gemini */}
                  <div className="flex flex-col items-end gap-0.5 w-full">
                    <span className="text-[8.5px] text-primary font-bold flex items-center gap-1">🤖 Gemini Assistant</span>
                    <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-2xl rounded-tr-none max-w-[90%] leading-normal text-[10.5px]">
                      ¡Alimentación está al **82%**! Os quedan **90,00€** este mes. 👍
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna 3: Lista de la Compra Compartida */}
              <div className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl flex flex-col h-[290px] justify-between">
                <div className="border-b pb-2 border-slate-105 dark:border-slate-900">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Lista de la Compra</span>
                </div>

                {/* Lista de artículos */}
                <div className="flex-1 space-y-3 py-2 text-xs overflow-y-auto scrollbar-none">
                  {/* Artículo pendiente */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-slate-100 dark:border-slate-900/60 shadow-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-4 w-4 rounded-md border border-border flex items-center justify-center shrink-0"></div>
                      <div className="truncate">
                        <p className="font-semibold text-foreground leading-tight text-[11px] truncate">Tomates cherry</p>
                        <p className="text-[8.5px] text-muted-foreground">2 packs • por Papi</p>
                      </div>
                    </div>
                    <button className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shrink-0">
                      Gasto
                    </button>
                  </div>

                  {/* Artículo comprado */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-background/55 border border-dashed border-border opacity-70">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-4 w-4 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 font-bold" />
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-muted-foreground line-through leading-tight text-[11px] truncate">Detergente lavadora</p>
                        <p className="text-[8.5px] text-muted-foreground/80">1 bote • por Mamá</p>
                      </div>
                    </div>
                    <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-muted-foreground px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                      Comprado
                    </span>
                  </div>

                  {/* Mensaje de info */}
                  <p className="text-[9px] text-muted-foreground text-center italic leading-normal pt-4 select-none">
                    "Tacha los artículos que faltan en casa y regístralos como gastos con un solo clic."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-16 text-left w-full">
          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-4 shadow-sm">
              <Users2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Hogar Compartido
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Invita a tu familia al hogar. Registrad gastos y liquidaciones de deudas de forma conjunta con sincronización en tiempo real.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Escáner de Tickets con IA
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sube tus tickets de compra y deja que la IA de Gemini extraiga automáticamente el importe, la fecha y clasifique la categoría del gasto.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
              <PiggyBank className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Presupuestos y Límites
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Establece límites mensuales por categoría y recibe alertas de presupuesto automáticas directamente en el chat familiar al superar el 80%.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Chat Familiar y Gemini Bot
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Comunícate con tu familia y habla con @gemini en el chat para obtener análisis rápidos y resúmenes de vuestras finanzas al instante.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-4 shadow-sm">
              <ShoppingBasket className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Lista de Compra Inteligente
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Añade artículos faltantes en tiempo real y regístralos como gastos financieros en el hogar con un solo clic una vez comprados.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Proyección e Informes
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gráficos de proyección de gastos a final de mes y envío manual o programado de reportes detallados en HTML a toda la familia.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/50 dark:border-slate-800/50 py-8 text-center text-xs text-muted-foreground mt-16 bg-background/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Control Dotz. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5 font-medium">
            <Lock className="h-3.5 w-3.5 text-primary" /> Seguridad bancaria garantizada mediante RLS de Supabase.
          </p>
        </div>
      </footer>
    </div>
  )
}
