'use client'

import { useActionState } from 'react'
import { createHouseholdAction } from '@/app/actions/household'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Plus } from 'lucide-react'

const initialState = {
  error: '',
}

export function CreateHouseholdForm() {
  const [state, formAction, pending] = useActionState(
    createHouseholdAction,
    initialState
  )

  return (
    <Card className="border-slate-200/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Crear un Hogar</CardTitle>
        <CardDescription>
          Crea un nuevo grupo familiar para empezar a gestionar tus gastos compartidos.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Hogar / Familia</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ej. Familia Mateu, Piso Compartido"
              required
              className="bg-muted/50 focus:bg-background"
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            <Plus className="mr-2 h-4 w-4" />
            {pending ? 'Creando...' : 'Crear Hogar'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
