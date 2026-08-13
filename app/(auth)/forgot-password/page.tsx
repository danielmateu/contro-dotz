'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { resetPasswordRequestAction } from '@/app/actions/auth'
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
import { AlertCircle, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react'

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    resetPasswordRequestAction,
    initialState
  )

  useEffect(() => {
    document.title = 'Recuperar contraseña | Control Dotz'
  }, [])

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-radial from-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-950">
      {/* Orbe de luz interactivo del ratón */}
      <MouseGlow />

      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground font-heading">
            Control Dotz
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recupera el acceso a tu cuenta
          </p>
        </div>

        <Card className="border-slate-200/50 shadow-xl shadow-slate-100/50 dark:border-slate-800/50 dark:shadow-none bg-background/80 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              Introduce tu correo electrónico y te enviaremos las instrucciones de recuperación.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {/* Alertas de error */}
              {state?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              {/* Alertas de éxito */}
              {state?.success && (
                <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertTitle>Correo enviado</AlertTitle>
                  <AlertDescription>{state.success}</AlertDescription>
                </Alert>
              )}

              {!state?.success && (
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    required
                    autoComplete="email"
                    className="bg-muted/50 focus:bg-background"
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              {!state?.success && (
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              <div className="text-center text-sm text-muted-foreground w-full">
                ¿Recordaste tu contraseña?{' '}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Inicia sesión
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
