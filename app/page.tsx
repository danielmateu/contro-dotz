import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PiggyBank,
  Users2,
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
      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg tracking-tight font-heading">
            Control Dotz
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard" className={buttonVariants({ size: 'sm' })}>
              Ir al Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Iniciar sesión
              </Link>
              <Link href="/register" className={buttonVariants({ size: 'sm' })}>
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-4xl mx-auto space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Moneda principal: Euros (€) • Zona Horaria: Europe/Madrid
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-heading max-w-3xl leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-primary to-slate-800 dark:from-slate-100 dark:via-primary dark:to-slate-300">
          Controla tus gastos diarios en familia con total claridad
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Una aplicación sencilla, rápida y colaborativa diseñada para que las
          familias registren gastos, sigan presupuestos mensuales y analicen el ahorro familiar de forma segura.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <Link href="/dashboard" className={cn(buttonVariants({ size: 'lg' }), "px-8 shadow-lg shadow-primary/20")}>
              Ir a mi Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), "px-8 shadow-lg shadow-primary/20")}>
                Crear mi cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), "px-8")}>
                Iniciar sesión
              </Link>
            </>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-3 gap-6 pt-12 text-left w-full">
          <div className="p-6 border border-slate-200/50 bg-background/50 backdrop-blur-sm rounded-2xl dark:border-slate-800/50">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Users2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base mb-1.5 font-heading">
              Hogar Compartido
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Invita a los miembros de tu familia. Todos registran en el mismo hogar con roles de acceso seguros.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/50 backdrop-blur-sm rounded-2xl dark:border-slate-800/50">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base mb-1.5 font-heading">
              Análisis Mensual
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualiza tus gastos con gráficos circulares y de barras. Conoce exactamente a dónde va cada euro.
            </p>
          </div>

          <div className="p-6 border border-slate-200/50 bg-background/50 backdrop-blur-sm rounded-2xl dark:border-slate-800/50">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <PiggyBank className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base mb-1.5 font-heading">
              Presupuestos por Límites
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Establece topes de gasto por categorías. Recibe avisos visuales al superar el 80% y 100%.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/50 dark:border-slate-800/50 py-6 text-center text-xs text-muted-foreground mt-12 bg-background/30 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Control Dotz. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            <Lock className="h-3 w-3" /> Seguridad bancaria garantizada mediante RLS de Supabase.
          </p>
        </div>
      </footer>
    </div>
  )
}
