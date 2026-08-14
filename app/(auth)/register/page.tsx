'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { signUpAction } from '@/app/actions/auth'
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
import { DynamicThreeScene } from '@/components/landing/dynamic-three-scene'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, ArrowRight, ShieldCheck, User, Mail, Lock } from 'lucide-react'
import { motion } from 'framer-motion'

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState)

  useEffect(() => {
    document.title = 'Crear cuenta gratis | Control Dotz'
  }, [])

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-radial from-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-950">
      {/* Orbe de luz interactivo del ratón */}
      <MouseGlow />

      {/* Escena 3D interactiva de finanzas (Solo Cerditos) */}
      <DynamicThreeScene />

      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Control Dotz
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea tu cuenta familiar y empieza a ahorrar
          </p>
        </div>

        <Card className="border-slate-200/40 shadow-2xl dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] overflow-hidden p-1">
          <CardHeader className="space-y-1.5 pt-6 px-6">
            <CardTitle className="text-2xl font-extrabold tracking-tight font-heading">Crear una cuenta</CardTitle>
            <CardDescription className="font-medium text-muted-foreground">
              Introduce tus datos para registrar tu cuenta de acceso familiar.
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

              {/* Alertas de éxito */}
              {state?.success && (
                <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertTitle>Registro exitoso</AlertTitle>
                  <AlertDescription>{state.success}</AlertDescription>
                </Alert>
              )}

              {!state?.success && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName" className="font-semibold text-xs text-foreground">Nombre o Alias</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        name="displayName"
                        type="text"
                        placeholder="Ej. Daniel"
                        className="pl-10 bg-slate-500/5 hover:bg-slate-500/10 focus:bg-background border-slate-200/80 dark:border-slate-800/80 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl h-10 text-foreground font-medium"
                      />
                    </div>
                  </div>

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
                    <Label htmlFor="password" className="font-semibold text-xs text-foreground">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="pl-10 bg-slate-500/5 hover:bg-slate-500/10 focus:bg-background border-slate-200/80 dark:border-slate-800/80 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl h-10 text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="font-semibold text-xs text-foreground">Confirmar contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className="pl-10 bg-slate-500/5 hover:bg-slate-500/10 focus:bg-background border-slate-200/80 dark:border-slate-800/80 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl h-10 text-foreground"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
              {!state?.success && (
                <Button type="submit" className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 rounded-xl h-10 transition-all duration-200 active:scale-[0.98]" disabled={pending}>
                  {pending ? 'Registrando cuenta...' : 'Crear cuenta'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              <div className="text-center text-sm text-muted-foreground w-full font-medium">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  href="/login"
                  className="font-bold text-primary hover:underline"
                >
                  Inicia sesión
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
