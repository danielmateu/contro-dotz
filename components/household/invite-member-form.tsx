'use client'

import { useActionState, startTransition } from 'react'
import { inviteUserAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, MailPlus } from 'lucide-react'

interface InviteMemberFormProps {
  householdId: string
}

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export function InviteMemberForm({ householdId }: InviteMemberFormProps) {
  // Enlazar el householdId como primer argumento de la acción
  const inviteActionWithId = inviteUserAction.bind(null, householdId)
  const [state, formAction, pending] = useActionState(
    inviteActionWithId,
    initialState
  )

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-tight text-foreground font-heading">
        Invitar a un nuevo miembro
      </h3>

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
            <AlertTitle>Invitación enviada</AlertTitle>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-1">
            <Label htmlFor="email">Correo electrónico del invitado</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nombre@correo.com"
              required
              className="bg-muted/50 focus:bg-background"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="role">Rol familiar</Label>
            <Select name="role" defaultValue="member" items={[{ value: 'member', label: 'Miembro (member)' }, { value: 'owner', label: 'Propietario (owner)' }]}>
              <SelectTrigger id="role" className="w-full bg-muted/50 h-9">
                <SelectValue placeholder="-- Selecciona rol --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Miembro (member)</SelectItem>
                <SelectItem value="owner">Propietario (owner)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          <MailPlus className="mr-2 h-4 w-4" />
          {pending ? 'Enviando invitación...' : 'Enviar Invitación'}
        </Button>
      </form>
    </div>
  )
}
