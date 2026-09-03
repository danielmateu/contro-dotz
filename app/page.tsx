import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Control Dotz - Control de Gastos Familiares',
  description: 'La aplicación colaborativa y premium para gestionar los gastos del hogar, presupuestos mensuales y liquidar deudas familiares con facilidad y escáner de tickets con IA.',
}
import { MouseGlow } from '@/components/landing/mouse-glow'
import { DynamicThreeScene } from '@/components/landing/dynamic-three-scene'
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

      {/* Escena 3D interactiva de finanzas (Solo Cerditos) */}
      <DynamicThreeScene />

      {/* Background glow structures */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Orbs de degradado difuminados estilo premium */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-3xl pointer-events-none animate-pulse duration-5000"></div>
      <div className="absolute top-[40%] right-[-10%] w-96 h-96 rounded-full bg-primary/10 dark:bg-primary/20 blur-3xl pointer-events-none animate-pulse duration-7000"></div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-slate-200/20 dark:border-slate-800/30 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="hidden  sm:flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
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
              <Link href="/register" className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'rounded-xl shadow-xs' })}>
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto space-y-8">

        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight font-heading max-w-4xl leading-[1.05] text-transparent bg-clip-text bg-linear-to-r from-slate-900 via-primary to-slate-800 dark:from-white dark:via-violet-400 dark:to-indigo-300">
          Controla tus gastos diarios en familia con total claridad
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed font-medium">
          Una aplicación colaborativa, rápida y con diseño premium para registrar gastos en el hogar, supervisar presupuestos mensuales y potenciar el ahorro familiar de forma segura.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center justify-center"
            >
              {/* Resplandor de fondo */}
              <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 via-indigo-600 to-cyan-500 rounded-2xl opacity-75 blur-md group-hover:opacity-100 transition duration-300" />
              {/* Botón Principal */}
              <span className="relative px-8 py-4 bg-slate-900 dark:bg-slate-950 border border-violet-500/30 rounded-2xl flex items-center gap-3 text-white font-bold text-base shadow-2xl transition-all duration-200 group-hover:scale-[1.01] active:scale-95">
                <LayoutDashboard className="w-5 h-5 text-violet-300" />
                Ir a mi Dashboard
                <ArrowRight className="w-5 h-5 text-violet-400 group-hover:translate-x-1.5 transition-transform duration-200" />
              </span>
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center"
              >
                {/* Resplandor de fondo */}
                <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 via-indigo-500 to-purple-600 rounded-2xl opacity-75 blur-md group-hover:opacity-100 transition duration-300" />
                {/* Botón Principal */}
                <span className="relative px-8 py-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl flex items-center gap-3 text-white font-bold text-base shadow-2xl transition-all duration-200 group-hover:scale-[1.01] active:scale-95">
                  <Rocket className="w-5 h-5 text-indigo-200" />
                  Crear cuenta
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
                </span>
              </Link>

              <Link
                href="/login"
                className="px-7 py-4 rounded-2xl font-semibold text-base border border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 transition-all duration-200 hover:scale-[1.01] active:scale-95 shadow-xs"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>

        {/* Micro-Badges de Confianza */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/80 font-medium pt-1">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" /> 100% Gratis para tu hogar
          </span>
          <span className="hidden sm:inline text-muted-foreground/30">•</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Sin necesidad de tarjeta de crédito
          </span>
        </div>

        {/* Mock UI Showcase de la aplicación */}
        <InteractiveShowcase />

        {/* Feature Cards Grid */}
        <FeaturesGrid />

        {/* CTA Final Section */}
        <CTASection isAuthenticated={isAuthenticated} />
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
