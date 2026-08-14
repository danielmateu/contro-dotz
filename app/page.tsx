import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Control Dotz - Control de Gastos Familiares',
  description: 'La aplicación colaborativa y premium para gestionar los gastos del hogar, presupuestos mensuales y liquidar deudas familiares con facilidad y escáner de tickets con IA.',
}
import { MouseGlow } from '@/components/landing/mouse-glow'
import { InteractiveShowcase } from '@/components/landing/interactive-showcase'
import { FeaturesGrid } from '@/components/landing/features-grid'
import {
  ArrowRight,
  ShieldCheck,
  Lock,
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
        <InteractiveShowcase />

        {/* Feature Cards Grid */}
        <FeaturesGrid />
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
