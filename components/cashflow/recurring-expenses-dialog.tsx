'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createRecurringExpenseAction, deleteRecurringExpenseAction, RecurringExpense } from '@/app/actions/cashflow'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAYMENT_METHODS } from '@/lib/validations'
import { formatCurrency } from '@/lib/format'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  CalendarCheck,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Building2,
  Tag,
  CreditCard,
  Calendar,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  color?: string
}

interface RecurringExpensesDialogProps {
  householdId: string
  categories: Category[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function RecurringExpensesDialog({
  householdId,
  categories,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: RecurringExpensesDialogProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const isOpen = isControlled ? externalOpen : internalOpen
  const setIsOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [isPending, startTransition] = useTransition()

  // Form State
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState('Domiciliación')
  const [notes, setNotes] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setAmount('')
    setCategoryId(categories[0]?.id || '')
    setDayOfMonth('1')
    setPaymentMethod('Domiciliación')
    setNotes('')
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTimeout(resetForm, 300)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('amount', amount)
    formData.append('category_id', categoryId || categories[0]?.id || '')
    formData.append('day_of_month', dayOfMonth)
    formData.append('payment_method', paymentMethod)
    formData.append('notes', notes)

    startTransition(async () => {
      const res = await createRecurringExpenseAction(householdId, {}, formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg(res.success)
        setTimeout(() => {
          handleOpenChange(false)
          router.refresh()
        }, 800)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger as any} />
      ) : (
        <DialogTrigger
          render={
            <Button size="sm" className="font-bold gap-1.5 shadow-sm rounded-xl">
              <Plus className="w-4 h-4" />
              <span>{t('cashflow.addRecurringBill')}</span>
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-md rounded-3xl bg-card border-border shadow-2xl p-4 sm:p-6">
        <DialogHeader className="space-y-1 text-left border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold font-heading">
                {t('cashflow.newRecurringBill')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t('cashflow.recurringBillDesc')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <Alert variant="destructive" className="rounded-2xl text-xs">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-bold">Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {successMsg && (
            <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs rounded-2xl">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <AlertTitle className="font-bold">Éxito</AlertTitle>
              <AlertDescription>{successMsg}</AlertDescription>
            </Alert>
          )}

          {/* Nombre / Concepto */}
          <div className="space-y-1">
            <Label htmlFor="rec-name" className="text-xs font-bold">
              {t('cashflow.billName')}
            </Label>
            <Input
              id="rec-name"
              placeholder={t('cashflow.billNamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-muted/50 focus:bg-background text-sm rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Importe (€) */}
            <div className="space-y-1">
              <Label htmlFor="rec-amount" className="text-xs font-bold">
                {t('expenses.amount')} (€)
              </Label>
              <Input
                id="rec-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="bg-muted/50 focus:bg-background text-base font-bold rounded-xl text-emerald-600 dark:text-emerald-400"
              />
            </div>

            {/* Día del mes en que vence */}
            <div className="space-y-1">
              <Label htmlFor="rec-day" className="text-xs font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" /> {t('cashflow.dueDate')}
              </Label>
              <Input
                id="rec-day"
                type="number"
                min="1"
                max="31"
                placeholder={t('cashflow.dueDayPlaceholder')}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                required
                className="bg-muted/50 focus:bg-background text-sm font-bold rounded-xl"
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <Label className="text-xs font-bold">{t('expenses.category')}</Label>
            <Select
              value={categoryId || categories[0]?.id || ''}
              onValueChange={(val) => setCategoryId(val || '')}
              items={categories.map((c) => ({ value: c.id, label: c.name }))}
            >
              <SelectTrigger className="w-full bg-muted/50 h-9 rounded-xl text-xs font-semibold">
                <SelectValue placeholder={t('cashflow.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método de pago */}
          <div className="space-y-1">
            <Label className="text-xs font-bold">{t('cashflow.paymentMethod')}</Label>
            <Select
              value={paymentMethod}
              onValueChange={(val) => setPaymentMethod(val || 'Domiciliación')}
              items={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))}
            >
              <SelectTrigger className="w-full bg-muted/50 h-9 rounded-xl text-xs font-semibold">
                <SelectValue placeholder={t('cashflow.selectPaymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl text-xs font-bold"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 shadow-md gap-1.5"
            >
              {isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4" />
                  {t('cashflow.registerRecurringBill')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
