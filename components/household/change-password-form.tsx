'use client'

import { useActionState, useState } from 'react'
import { updatePasswordAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { MorphIcon } from 'morphicons/react'
// @ts-ignore
import { __iconNode as EyeData } from 'lucide-react/dist/esm/icons/eye.mjs'
// @ts-ignore
import { __iconNode as EyeOffData } from 'lucide-react/dist/esm/icons/eye-off.mjs'

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialState
  )

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      {/* Nueva contraseña */}
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            required
            className="pl-9 pr-10 bg-muted/50 focus:bg-background rounded-xl"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-hidden"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <MorphIcon
              icon={showPassword ? EyeOffData : EyeData}
              spring="snappy"
              className="h-4 w-4"
            />
          </button>
        </div>
      </div>

      {/* Confirmar contraseña */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repite la contraseña"
            required
            className="pl-9 pr-10 bg-muted/50 focus:bg-background rounded-xl"
          />
          <button
            type="button"
            onClick={toggleConfirmPasswordVisibility}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground focus:outline-hidden"
            aria-label={
              showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
          >
            <MorphIcon
              icon={showConfirmPassword ? EyeOffData : EyeData}
              spring="snappy"
              className="h-4 w-4"
            />
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto mt-2 rounded-xl"
      >
        {pending ? 'Actualizando...' : 'Cambiar Contraseña'}
      </Button>
    </form>
  )
}
