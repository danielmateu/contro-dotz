'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { createSettlementAction } from '@/app/actions/settlement'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Coins } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

interface Member {
  id: string
  user_id: string
  role: string
  profiles?: {
    display_name: string | null
    email: string
  } | null
}

interface SettleDebtDialogProps {
  householdId: string
  membersList: Member[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  defaultPayerId?: string
  defaultReceiverId?: string
  defaultAmount?: string
}

export function SettleDebtDialog({
  householdId,
  membersList,
  isOpen,
  onOpenChange,
  defaultPayerId = '',
  defaultReceiverId = '',
  defaultAmount = '',
}: SettleDebtDialogProps) {
  const { t } = useI18n()
  const [payerId, setPayerId] = useState(defaultPayerId)
  const [receiverId, setReceiverId] = useState(defaultReceiverId)
  const [amount, setAmount] = useState(defaultAmount)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Resetear estados cuando abre o cambian los valores por defecto
  useEffect(() => {
    if (isOpen) {
      setPayerId(defaultPayerId)
      setReceiverId(defaultReceiverId)
      setAmount(defaultAmount)
      setError('')
    }
  }, [isOpen, defaultPayerId, defaultReceiverId, defaultAmount])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!payerId) {
      setError(t('household.selectDebtorErr'))
      return
    }
    if (!receiverId) {
      setError(t('household.selectCreditorErr'))
      return
    }
    if (payerId === receiverId) {
      setError(t('household.samePersonErr'))
      return
    }
    if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
      setError(t('household.positiveAmountErr'))
      return
    }

    const formData = new FormData()
    formData.append('payer_id', payerId)
    formData.append('receiver_id', receiverId)
    formData.append('amount', amount)

    startTransition(async () => {
      const res = await createSettlementAction(householdId, null, formData)
      if (res && res.error) {
        setError(res.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              {t('household.settleDebtTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('household.settleDebtDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('expenses.validationErrorTitle')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="payer">{t('household.payerMember')}</Label>
              <Select value={payerId} onValueChange={(val) => setPayerId(val || '')} disabled={isPending} items={membersList.map((m) => ({ value: m.user_id, label: m.profiles?.display_name || m.profiles?.email.split('@')[0] || t('household.roleMember') }))}>
                <SelectTrigger id="payer" className="bg-muted/50 focus:bg-background">
                  <SelectValue placeholder={t('household.selectPayerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {membersList.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profiles?.display_name || m.profiles?.email.split('@')[0] || t('household.roleMember')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="receiver">{t('household.receiverMember')}</Label>
              <Select value={receiverId} onValueChange={(val) => setReceiverId(val || '')} disabled={isPending} items={membersList.map((m) => ({ value: m.user_id, label: m.profiles?.display_name || m.profiles?.email.split('@')[0] || t('household.roleMember') }))}>
                <SelectTrigger id="receiver" className="bg-muted/50 focus:bg-background">
                  <SelectValue placeholder={t('household.selectReceiverPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {membersList.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.profiles?.display_name || m.profiles?.email.split('@')[0] || t('household.roleMember')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">{t('expenses.amount')} (€)</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
                required
                className="bg-muted/50 focus:bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isPending ? t('household.recording') : t('household.registerPayment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
