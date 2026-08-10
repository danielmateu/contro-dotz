'use client'

import { useActionState, useState, useEffect } from 'react'
import { createExpenseAction, updateExpenseAction } from '@/app/actions/expense'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Check, Save } from 'lucide-react'
import { PAYMENT_METHODS } from '@/lib/validations'

interface Category {
  id: string
  name: string
}

interface ExpenseDialogProps {
  householdId?: string // Requerido para crear
  categories: Category[]
  expense?: {
    id: string
    amount: number
    category_id: string
    description: string
    expense_date: string
    payment_method: string
    notes?: string | null
  } // Requerido para editar
  trigger: React.ReactElement
}

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export function ExpenseDialog({
  householdId,
  categories,
  expense,
  trigger,
}: ExpenseDialogProps) {
  const [open, setOpen] = useState(false)

  // Decidir qué acción de servidor usar y enlazar sus argumentos
  const action = expense
    ? updateExpenseAction.bind(null, expense.id)
    : createExpenseAction.bind(null, householdId!)

  const [state, formAction, pending] = useActionState(action, initialState)

  // Cerrar el modal cuando la acción se ejecuta con éxito
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setOpen(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state])

  // Obtener fecha formateada por defecto en formato YYYY-MM-DD
  const defaultDate = expense?.expense_date
    ? new Date(expense.expense_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
          </DialogTitle>
          <DialogDescription>
            {expense
              ? 'Modifica los detalles del gasto seleccionado.'
              : 'Añade un nuevo gasto para tu hogar familiar.'}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <div className="space-y-4 py-2 text-left">
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de validación</AlertTitle>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            {state?.success && (
              <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                <Check className="h-4 w-4 text-emerald-500" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            )}

            {/* Importe */}
            <div className="space-y-1">
              <Label htmlFor="amount">Importe (€)</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={expense?.amount?.toString().replace('.', ',')}
                required
                className="bg-muted/50 focus:bg-background text-lg font-semibold"
              />
              <p className="text-[10px] text-muted-foreground">
                Utiliza una coma o punto para separar los decimales (máx. 2 decimales).
              </p>
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <Label htmlFor="category_id">Categoría</Label>
              <select
                id="category_id"
                name="category_id"
                required
                defaultValue={expense?.category_id || ''}
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              >
                <option value="" disabled>
                  -- Selecciona una categoría --
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Concepto / Descripción */}
            <div className="space-y-1">
              <Label htmlFor="description">Concepto / Descripción</Label>
              <Input
                id="description"
                name="description"
                type="text"
                placeholder="Ej. Compra semanal Mercadona, Combustible coche"
                defaultValue={expense?.description}
                required
                className="bg-muted/50 focus:bg-background"
              />
            </div>

            {/* Fecha del gasto */}
            <div className="space-y-1">
              <Label htmlFor="expense_date">Fecha</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                defaultValue={defaultDate}
                required
                className="bg-muted/50 focus:bg-background"
              />
            </div>

            {/* Método de pago */}
            <div className="space-y-1">
              <Label htmlFor="payment_method">Método de pago</Label>
              <select
                id="payment_method"
                name="payment_method"
                required
                defaultValue={expense?.payment_method || 'Tarjeta'}
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div className="space-y-1">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Detalles adicionales..."
                defaultValue={expense?.notes || ''}
                className="bg-muted/50 focus:bg-background min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose render={<Button variant="outline" type="button">Cancelar</Button>} />
            <Button type="submit" disabled={pending}>
              <Save className="mr-2 h-4 w-4" />
              {pending ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
