'use client'

import { useActionState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signInAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MouseGlow } from '@/components/landing/mouse-glow'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

const initialState = {
  error: '',
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center bg-slate-900 text-slate-400">
          <div className="text-sm animate-pulse font-medium">Cargando...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState)
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  useEffect(() => {
    document.title = 'Iniciar sesión | Control Dotz'
  }, [])

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-radial from-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-950">
      {/* Orbe de luz interactivo del ratón */}
      <MouseGlow />

      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Control Dotz<span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Gestiona tus gastos familiares de forma inteligente
          </p>
        </div>

        <Card className="border-slate-200/40 shadow-2xl dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] overflow-hidden p-1">
          <CardHeader className="space-y-1.5 pt-6 px-6">
            <CardTitle className="text-2xl font-extrabold tracking-tight font-heading">Iniciar sesión</CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              Introduce tus credenciales para acceder a tu panel familiar.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4 px-6 pb-4">
              {/* Alertas de error */}
              {state?.error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              {errorParam && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sesión inválida</AlertTitle>
                  <AlertDescription>{errorParam}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold text-xs text-foreground">Correo electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    required
                    autoComplete="email"
                    className="pl-10 bg-slate-500/5 hover:bg-slate-500/10 focus:bg-background border-slate-200/80 dark:border-slate-800/80 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl h-10 text-foreground font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold text-xs text-foreground">Contraseña</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    ¿La has olvidado?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="pl-10 bg-slate-500/5 hover:bg-slate-500/10 focus:bg-background border-slate-200/80 dark:border-slate-800/80 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl h-10 text-foreground"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
              <Button type="submit" className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-xl h-10 transition-all duration-200 active:scale-[0.98]" disabled={pending}>
                {pending ? 'Iniciando sesión...' : 'Entrar en mi cuenta'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="text-center text-sm text-muted-foreground w-full font-medium">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/register"
                  className="font-bold text-primary hover:underline"
                >
                  Regístrate ahora!
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
