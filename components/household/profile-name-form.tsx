'use client'

import { useActionState } from 'react'
import { updateProfileNameAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, User } from 'lucide-react'

interface ProfileNameFormProps {
  initialName: string
}

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export function ProfileNameForm({ initialName }: ProfileNameFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileNameAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="displayName">Nombre para mostrar</Label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="displayName"
            name="displayName"
            type="text"
            defaultValue={initialName}
            required
            className="pl-9 bg-muted/50 focus:bg-background"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Este nombre será visible para los demás miembros de tu hogar en los gastos.
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Guardando cambios...' : 'Guardar Cambios'}
      </Button>
    </form>
  )
}
