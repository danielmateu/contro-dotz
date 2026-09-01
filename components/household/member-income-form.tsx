'use client'

import { useState, useTransition } from 'react'
import { updateMemberIncomeAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Landmark, PiggyBank, Loader2 } from 'lucide-react'

interface MemberIncomeFormProps {
  initialIncome: number
  initialContribution?: number
  householdId: string
}

export function MemberIncomeForm({
  initialIncome,
  initialContribution = 0,
  householdId,
}: MemberIncomeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [income, setIncome] = useState(initialIncome > 0 ? initialIncome.toString() : '')
  const [contribution, setContribution] = useState(
    initialContribution > 0 ? initialContribution.toString() : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedIncome = income.trim().replace(',', '.')
    const numericIncome = parseFloat(normalizedIncome)

    const normalizedContribution = contribution.trim().replace(',', '.')
    const numericContribution = parseFloat(normalizedContribution)
    
    if (income.trim() !== '' && (isNaN(numericIncome) || numericIncome < 0)) {
      setError('Introduce un importe de ingresos válido y mayor o igual a 0.')
      return
    }

    if (contribution.trim() !== '' && (isNaN(numericContribution) || numericContribution < 0)) {
      setError('Introduce un importe de aportación válido y mayor o igual a 0.')
      return
    }

    const incomeToSend = income.trim() === '' ? 0 : numericIncome
    const contributionToSend = contribution.trim() === '' ? 0 : numericContribution

    startTransition(async () => {
      const res = await updateMemberIncomeAction(householdId, incomeToSend, contributionToSend)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess('Tus ingresos y aportación mensual han sido actualizados con éxito.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Ingreso Neto */}
        <div className="space-y-2">
          <Label htmlFor="income">Tus ingresos mensuales netos (€)</Label>
          <div className="relative">
            <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="income"
              name="income"
              type="text"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Ej. 2011"
              disabled={isPending}
              className="pl-9 bg-muted/50 focus:bg-background"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Sueldo o ingresos netos totales de tu nómina.
          </p>
        </div>

        {/* Aportación al Hogar */}
        <div className="space-y-2">
          <Label htmlFor="contribution">Tu aportación mensual al hogar (€)</Label>
          <div className="relative">
            <PiggyBank className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
            <Input
              id="contribution"
              name="contribution"
              type="text"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              placeholder="Ej. 600"
              disabled={isPending}
              className="pl-9 bg-muted/50 focus:bg-background font-semibold"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cantidad que destinas al fondo común del hogar.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          'Actualizar Ingresos y Aportación'
        )}
      </Button>
    </form>
  )
}
