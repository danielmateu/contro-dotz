'use client'

import { useTransition, useState } from 'react'
import { removeMemberAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, LogOut } from 'lucide-react'

interface MemberActionsProps {
  memberId: string
  householdId: string
  isSelf: boolean
  memberName: string
}

export function MemberActions({
  memberId,
  householdId,
  isSelf,
  memberName,
}: MemberActionsProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleAction = () => {
    startTransition(async () => {
      await removeMemberAction(memberId, householdId)
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          isSelf ? (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8"
              aria-label="Salir del hogar"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Salir del Hogar
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
              aria-label={`Eliminar a ${memberName}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSelf ? '¿Salir del hogar?' : '¿Eliminar miembro?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSelf
              ? '¿Estás seguro de que quieres salir de este hogar? Perderás acceso a todos los gastos y presupuestos compartidos.'
              : `¿Estás seguro de que quieres eliminar a ${memberName} del hogar? Ya no podrá consultar ni registrar gastos.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleAction()
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isPending
              ? 'Procesando...'
              : isSelf
                ? 'Sí, salir'
                : 'Sí, eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
