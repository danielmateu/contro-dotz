'use client'

import { useActionState, useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { updatePasswordAction } from '@/app/actions/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MouseGlow } from '@/components/landing/mouse-glow'
import { HeroPiggyBackground } from '@/components/landing/hero-piggy-background'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, ArrowRight, ShieldCheck, Lock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MorphIcon } from 'morphicons/react'
// @ts-ignore
import { __iconNode as LockData } from 'lucide-react/dist/esm/icons/lock.mjs'
// @ts-ignore
import { __iconNode as KeyRoundData } from 'lucide-react/dist/esm/icons/key-round.mjs'
// @ts-ignore
import { __iconNode as EyeData } from 'lucide-react/dist/esm/icons/eye.mjs'
// @ts-ignore
import { __iconNode as EyeOffData } from 'lucide-react/dist/esm/icons/eye-off.mjs'

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center bg-slate-900 text-slate-400">
          <div className="text-sm animate-pulse font-medium">Cargando...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isSubmitHovered, setIsSubmitHovered] = useState(false)

  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState
  )

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword)

  // Efecto para validar el token hash o comprobar la sesión activa
  useEffect(() => {
    const verifyToken = async (hash: string) => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: hash,
          type: 'recovery',
        })
        if (error) {
          console.error('Error verificando OTP:', error)
          setVerifyError('El enlace de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.')
          setVerified(false)
        } else {
          setVerified(true)
        }
      } catch (err) {
        console.error('Error en la verificación:', err)
        setVerifyError('Ocurrió un error inesperado al validar el enlace.')
      } finally {
        setVerifying(false)
      }
    }

    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setVerified(true)
        } else {
          // Si no hay token ni sesión, redirigir al login
          router.replace('/login')
        }
      } catch (err) {
        console.error('Error verificando sesión:', err)
        router.replace('/login')
      } finally {
        setVerifying(false)
      }
    }

    if (token_hash) {
      verifyToken(token_hash)
    } else {
      checkSession()
    }
  }, [token_hash, type, supabase, router])

  // Título de la página
  useEffect(() => {
    document.title = 'Restablecer contraseña | Control Dotz'
  }, [])

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-radial from-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:to-slate-950">
      {/* Orbe de luz interactivo del ratón */}
      <MouseGlow />

      {/* Fondo flotante ligero de cerditos, monedas y tarjetas */}
      <HeroPiggyBackground />

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
            Restablecer contraseña
          </p>
        </div>

        <Card className="border-slate-200/40 shadow-2xl dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[24px] overflow-hidden p-1">
          {verifying ? (
            /* Estado: Verificando enlace */
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="text-sm font-semibold text-foreground">
                Verificando tu enlace de seguridad...
              </div>
              <div className="text-xs text-muted-foreground">
                Esto tomará solo unos segundos.
              </div>
            </div>
          ) : verifyError ? (
            /* Estado: Error de Verificación */
            <>
              <CardHeader className="space-y-1.5 pt-6 px-6">
                <CardTitle className="text-2xl font-extrabold tracking-tight text-destructive font-heading">
                  Enlace inválido o expirado
                </CardTitle>
                <CardDescription className="font-medium text-muted-foreground">
                  El token de recuperación no pudo ser verificado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-4">
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Enlace caducado</AlertTitle>
                  <AlertDescription>{verifyError}</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
                <Link
                  href="/forgot-password"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    "w-full font-semibold rounded-xl h-10 transition-all duration-200 active:scale-[0.98] flex items-center justify-center"
                  )}
                >
                  Solicitar nuevo enlace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <div className="text-center text-sm font-medium">
                  <Link href="/login" className="text-primary hover:underline font-bold">
                    Volver al inicio de sesión
                  </Link>
                </div>
              </CardFooter>
            </>
          ) : state?.success ? (
            /* Estado: Éxito en cambio de contraseña */
            <>
              <CardHeader className="space-y-1.5 pt-6 px-6">
                <CardTitle className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-heading">
                  Contraseña restablecida
                </CardTitle>
                <CardDescription className="font-medium text-muted-foreground">
                  Tu cuenta ha sido actualizada con tu nueva contraseña.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-4">
                <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <AlertTitle>¡Éxito!</AlertTitle>
                  <AlertDescription>{state.success}</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    "w-full bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 rounded-xl h-10 transition-all duration-200 active:scale-[0.98] flex items-center justify-center border-0"
                  )}
                >
                  Ir al panel de control
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardFooter>
            </>
          ) : (
            /* Estado: Formulario para ingresar nueva contraseña */
            <form action={formAction}>
              <CardHeader className="space-y-1.5 pt-6 px-6">
                <CardTitle className="text-2xl font-extrabold tracking-tight font-heading">
                  Nueva contraseña
                </CardTitle>
                <CardDescription className="font-medium text-muted-foreground">
                  Elige una contraseña segura de al menos 6 caracteres para tu cuenta.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-4">
                {/* Alerta de error si el form action falla */}
                {state?.error && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}

                {/* Campo: Nueva Contraseña */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-semibold text-xs text-foreground">
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="pl-10 pr-10 bg-slate-500/5 hover:bg-slate-500/10 focus:bg-background border-slate-200/80 dark:border-slate-800/80 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl h-10 text-foreground font-medium"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-hidden cursor-pointer"
                      aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                    >
                      <MorphIcon
                        icon={showPassword ? EyeOffData : EyeData}
                        spring="snappy"
                        className="h-4 w-4"
                      />
                    </button>
                  </div>
                </div>

                {/* Campo: Confirmar Contraseña */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="font-semibold text-xs text-foreground">
                    Confirmar nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repite tu contraseña"
                      required
                      className="pl-10 pr-10 bg-slate-500/5 hover:bg-slate-500/10 focus:bg-background border-slate-200/80 dark:border-slate-800/80 focus:ring-2 focus:ring-primary/20 transition-all rounded-xl h-10 text-foreground font-medium"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-hidden cursor-pointer"
                      aria-label={showConfirmPassword ? 'Ocultar clave' : 'Mostrar clave'}
                    >
                      <MorphIcon
                        icon={showConfirmPassword ? EyeOffData : EyeData}
                        spring="snappy"
                        className="h-4 w-4"
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 px-6 pb-6 pt-2">
                <div className="relative w-full group">
                  <div className="absolute -inset-0.5 bg-linear-to-r from-violet-600 via-indigo-500 to-purple-600 rounded-xl opacity-75 blur-xs group-hover:opacity-100 transition duration-300" />
                  <Button
                    type="submit"
                    disabled={pending}
                    onMouseEnter={() => setIsSubmitHovered(true)}
                    onMouseLeave={() => setIsSubmitHovered(false)}
                    className="relative w-full h-11 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl rounded-xl transition-all duration-200 active:scale-[0.98] border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MorphIcon
                      icon={isSubmitHovered ? KeyRoundData : LockData}
                      spring="snappy"
                      className="w-4.5 h-4.5 text-violet-200"
                    />
                    <span>{pending ? 'Actualizando contraseña...' : 'Restablecer contraseña'}</span>
                  </Button>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
