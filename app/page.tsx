import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      {/* Orbs de degradado difuminados estilo premium */}
      <div className="absolute top-[10%] left-[-10%] w-[380px] h-[380px] rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-3xl pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute top-[40%] right-[-10%] w-[380px] h-[380px] rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl pointer-events-none animate-pulse duration-7000"></div>

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
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping"></span>
          Moneda principal: Euros (€) • Zona Horaria: Europe/Madrid
        </div>

        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight font-heading max-w-4xl leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-primary to-slate-800 dark:from-white dark:via-violet-400 dark:to-indigo-300">
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
        <div className="w-full max-w-3xl mx-auto mt-16 p-1.5 border border-slate-200/40 bg-slate-200/20 dark:border-slate-800/80 dark:bg-slate-900/50 rounded-3xl shadow-2xl backdrop-blur-md transform hover:scale-[1.01] transition-all duration-300">
          <div className="bg-background rounded-[20px] p-6 text-left border border-slate-200/50 dark:border-slate-900 shadow-inner">
            {/* Header del Mockup */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                <span className="text-[11px] font-mono text-muted-foreground ml-3 select-none">control-dotz.app/dashboard</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Familia Dotz
              </div>
            </div>

            {/* Grid del Mockup */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* KPI Card de Gasto */}
              <div className="p-4 border border-slate-200/50 dark:border-slate-800/50 bg-slate-500/5 rounded-2xl relative overflow-hidden">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Gasto mensual (agosto)</span>
                <div className="text-2xl font-extrabold mt-1.5 text-foreground font-heading">1.450,20 €</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10">▲ +12.4%</span>
                  <span>vs. mes anterior</span>
                </div>
              </div>

              {/* Progress Card de Presupuestos */}
              <div className="p-4 border border-slate-200/50 dark:border-slate-800/50 bg-slate-500/5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Presupuesto Alimentación</span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">82%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Gastado: 410,00 €</span>
                  <span>Límite: 500,00 €</span>
                </div>
              </div>
            </div>

            {/* Transacciones Recientes del Mockup */}
            <div className="mt-4 border border-slate-200/50 dark:border-slate-800/50 bg-slate-500/5 rounded-2xl p-4 space-y-3.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Gastos Recientes</div>
              
              <div className="flex items-center justify-between text-xs hover:bg-muted/10 p-1 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Compra Semanal Mercadona</div>
                    <div className="text-[10px] text-muted-foreground">Hoy • Tarjeta</div>
                  </div>
                </div>
                <span className="font-extrabold text-foreground text-sm">-68,50 €</span>
              </div>

              <div className="flex items-center justify-between text-xs hover:bg-muted/10 p-1 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">Combustible Coche</div>
                    <div className="text-[10px] text-muted-foreground">Ayer • Efectivo</div>
                  </div>
                </div>
                <span className="font-extrabold text-foreground text-sm">-45,00 €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-3 gap-6 pt-16 text-left w-full">
          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-4 shadow-sm">
              <Users2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Hogar Compartido
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Invita a los miembros de tu familia. Todos registran en el mismo hogar con roles de acceso seguros y sincronización inmediata.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Análisis Mensual
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualiza tus gastos con gráficos circulares y de barras. Conoce exactamente en qué categorías se va el ahorro familiar.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/40 hover:bg-background/80 backdrop-blur-sm rounded-2xl dark:border-slate-800/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300">
            <div className="h-11 w-11 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
              <PiggyBank className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg mb-1.5 font-heading">
              Límites y Alertas
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Establece presupuestos por categorías y recibe avisos de color interactivos cuando se consuma el 80% o se supere el 100%.
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
