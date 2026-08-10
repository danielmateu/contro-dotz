'use client'

import { useTransition } from 'react'
import {
  acceptInvitationAction,
  rejectInvitationAction,
} from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface InvitationActionsProps {
  invitationId: string
}

export function InvitationActions({ invitationId }: InvitationActionsProps) {
  const [isPendingAccept, startAcceptTransition] = useTransition()
  const [isPendingReject, startRejectTransition] = useTransition()

  const handleAccept = () => {
    startAcceptTransition(async () => {
      await acceptInvitationAction(invitationId)
    })
  }

  const handleReject = () => {
    startRejectTransition(async () => {
      await rejectInvitationAction(invitationId)
    })
  }

  const isLoading = isPendingAccept || isPendingReject

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="default"
        onClick={handleAccept}
        disabled={isLoading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Check className="mr-1.5 h-3.5 w-3.5" />
        {isPendingAccept ? 'Aceptando...' : 'Aceptar'}
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={handleReject}
        disabled={isLoading}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="mr-1.5 h-3.5 w-3.5" />
        {isPendingReject ? 'Rechazando...' : 'Rechazar'}
      </Button>
    </div>
  )
}
