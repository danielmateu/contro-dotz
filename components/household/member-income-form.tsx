'use client'

import { useState, useTransition } from 'react'
import { updateMemberIncomeAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Landmark, Loader2 } from 'lucide-react'

interface MemberIncomeFormProps {
  initialIncome: number
  householdId: string
}

export function MemberIncomeForm({
  initialIncome,
  householdId,
}: MemberIncomeFormProps) {
  const [isPending, startTransition] = useTransition()
  // Reemplazar punto por coma para comodidad del usuario español si fuera necesario, o simplemente cadena
  const [income, setIncome] = useState(initialIncome > 0 ? initialIncome.toString() : '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const normalized = income.trim().replace(',', '.')
    const numericIncome = parseFloat(normalized)
    
    if (income.trim() !== '' && (isNaN(numericIncome) || numericIncome < 0)) {
      setError('Introduce un importe de ingresos válido y mayor o igual a 0.')
      return
    }

    const valueToSend = income.trim() === '' ? 0 : numericIncome

    startTransition(async () => {
      const res = await updateMemberIncomeAction(householdId, valueToSend)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess('Tus ingresos mensuales han sido actualizados con éxito.')
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
            placeholder="Ej. 1850"
            disabled={isPending}
            className="pl-9 bg-muted/50 focus:bg-background"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Tus ingresos se guardan por hogar y se utilizan para calcular la distribución equitativa y proporcional de los gastos familiares.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          'Actualizar Ingresos'
        )}
      </Button>
    </form>
  )
}
