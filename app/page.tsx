import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Control Dotz - Control de Gastos Familiares',
  description: 'La aplicación colaborativa y premium para gestionar los gastos del hogar, presupuestos mensuales y liquidar deudas familiares con facilidad y escáner de tickets con IA.',
}
import { MouseGlow } from '@/components/landing/mouse-glow'
import { HeroPiggyBackground } from '@/components/landing/hero-piggy-background'
import { InteractiveShowcase } from '@/components/landing/interactive-showcase'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { CTASection } from '@/components/landing/cta-section'
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Rocket,
  LayoutDashboard,
} from 'lucide-react'

export default async function LandingPage() {
  let isAuthenticated = false

  try {
    const supabase = await createClient()

    // Comprobar si el usuario tiene sesión activa
    const {
      data: { user },
    } = await supabase.auth.getUser()

    isAuthenticated = !!user
  } catch (error) {
    console.error('Error comprobando sesión en LandingPage:', error)
  }

  return (
    <div className="min-h-screen bg-radial from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between overflow-x-hidden relative">
      {/* Orbe de luz interactivo del ratón */}
      <MouseGlow />

      {/* Fondo ilustrativo ligero con animación flotante CSS */}
      <HeroPiggyBackground />

      {/* Background glow structures */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Orbs de degradado difuminados estilo premium */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-3xl pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/30 backdrop-blur-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight font-heading truncate">
            Control Dotz
          </span>
        </div>

        <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAuthenticated ? (
            <Link href="/dashboard" aria-label="Ir al Dashboard principal" className={buttonVariants({ size: 'sm', className: 'rounded-xl text-xs sm:text-sm px-3 sm:px-4' })}>
              Ir al Dashboard
              <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" aria-label="Iniciar sesión en la aplicación" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'rounded-xl text-xs sm:text-sm px-2.5 sm:px-3 text-slate-800 dark:text-slate-100 font-semibold' })}>
                Iniciar sesión
              </Link>
              <Link href="/register" aria-label="Registrar una nueva cuenta" className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'rounded-xl shadow-xs text-xs sm:text-sm px-3 sm:px-4' })}>
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12 sm:py-20 w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 overflow-hidden">

        <h1 className="text-3xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-heading max-w-4xl leading-[1.1] sm:leading-[1.05] text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-primary to-slate-800 dark:from-white dark:via-violet-400 dark:to-indigo-300">
          Controla tus gastos diarios en familia con total claridad
        </h1>

        <p className="text-base sm:text-xl text-slate-700 dark:text-slate-200 max-w-3xl leading-relaxed font-medium px-2 sm:px-0">
          Una aplicación colaborativa para registrar gastos en el hogar, supervisar presupuestos mensuales y potenciar el ahorro familiar de forma segura.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-xs sm:max-w-none pt-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              aria-label="Ir a mi Dashboard"
              className="group relative inline-flex items-center justify-center w-full sm:w-auto"
            >
              {/* Resplandor de fondo */}
              <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 rounded-2xl opacity-75 blur-md group-hover:opacity-100 transition duration-300" />
              {/* Botón Principal */}
              <span className="relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-slate-900 dark:bg-slate-950 border border-violet-500/30 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-sm sm:text-base shadow-2xl transition-all duration-200 group-hover:scale-[1.01] active:scale-95">
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                Ir a mi Dashboard
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:translate-x-1.5 transition-transform duration-200" />
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                aria-label="Crear una cuenta gratis"
                className="group relative inline-flex items-center justify-center w-full sm:w-auto"
              >
                {/* Resplandor de fondo */}
                <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 via-indigo-500 to-purple-600 rounded-2xl opacity-75 blur-md group-hover:opacity-100 transition duration-300" />
                {/* Botón Principal */}
                <span className="relative w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-sm sm:text-base shadow-2xl transition-all duration-200 group-hover:scale-[1.01] active:scale-95">
                  <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  Crear cuenta
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:translate-x-1.5 transition-transform duration-200" />
                </span>
              </Link>

              <Link
                href="/login"
                aria-label="Iniciar sesión"
                className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base border border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 transition-all duration-200 hover:scale-[1.01] active:scale-95 shadow-xs flex items-center justify-center"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>

        {/* Micro-Badges de Confianza */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs text-slate-800 dark:text-slate-100 font-bold pt-1">
          <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" /> 100% Gratis para tu hogar
          </span>
          <span className="hidden sm:inline text-muted-foreground/40">•</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 shrink-0 text-primary" /> Sin necesidad de tarjeta de crédito
          </span>
        </div>

        {/* Encabezado accesible para tecnología asistiva */}
        <h2 className="sr-only">Demostración interactiva y características principales de Control Dotz</h2>

        {/* Mock UI Showcase de la aplicación */}
        <InteractiveShowcase />

        {/* Feature Cards Grid */}
        <FeaturesGrid />

        {/* CTA Final Section */}
        <CTASection isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer */}
      <footer aria-label="Pie de página" className="relative z-10 w-full border-t border-slate-200/50 dark:border-slate-800/50 py-6 sm:py-8 text-center text-xs text-slate-700 dark:text-slate-300 font-medium mt-12 sm:mt-16 bg-background/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p>© 2026 Control Dotz. Todos los derechos reservados.</p>
          <p className="flex items-center justify-center gap-1.5 font-medium text-center">
            <Lock className="h-3.5 w-3.5 text-primary shrink-0" /> Seguridad bancaria garantizada mediante RLS de Supabase.
          </p>
        </div>
      </footer>
    </div>
  )
}
