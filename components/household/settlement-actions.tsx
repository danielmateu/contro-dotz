'use client'

import { useTransition, useState } from 'react'
import { deleteSettlementAction } from '@/app/actions/settlement'
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
import { Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

interface SettlementActionsProps {
  settlementId: string
  householdId: string
}

export function SettlementActions({
  settlementId,
  householdId,
}: SettlementActionsProps) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      await deleteSettlementAction(settlementId, householdId)
      setOpen(false)
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
            disabled={isPending}
            aria-label={t('household.deletePaymentTitle')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('household.deletePaymentTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('household.deletePaymentDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {isPending ? t('household.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
