'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Save } from 'lucide-react'
import { PAYMENT_METHODS } from '@/lib/validations'

interface Category {
  id: string
  name: string
}

interface ExpenseFormProps {
  categories: Category[]
  action: (prevState: any, formData: FormData) => Promise<any>
  initialData?: {
    id: string
    amount: number
    category_id: string
    description: string
    expense_date: string
    payment_method: string
    notes?: string | null
  }
}

type FormState = {
  error?: string
}

const initialState: FormState = {}

export function ExpenseForm({
  categories,
  action,
  initialData,
}: ExpenseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  // Obtener fecha por defecto en formato YYYY-MM-DD
  const defaultDate = initialData?.expense_date
    ? new Date(initialData.expense_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  return (
    <Card className="border-slate-200/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">
          {initialData ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
        </CardTitle>
        <CardDescription>
          {initialData
            ? 'Modifica los detalles del gasto seleccionado.'
            : 'Añade un nuevo gasto para tu hogar familiar.'}
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error de validación</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
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
              defaultValue={initialData?.amount?.toString().replace('.', ',')}
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
            <Select name="category_id" defaultValue={initialData?.category_id || ''}>
              <SelectTrigger id="category_id" className="w-full bg-muted/50 h-9">
                <SelectValue placeholder="-- Selecciona una categoría --" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Concepto / Descripción */}
          <div className="space-y-1">
            <Label htmlFor="description">Concepto / Descripción</Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="Ej. Compra semanal Mercadona, Combustible coche"
              defaultValue={initialData?.description}
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
            <Select name="payment_method" defaultValue={initialData?.payment_method || 'Tarjeta'}>
              <SelectTrigger id="payment_method" className="w-full bg-muted/50 h-9">
                <SelectValue placeholder="-- Selecciona método de pago --" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Detalles adicionales..."
              defaultValue={initialData?.notes || ''}
              className="bg-muted/50 focus:bg-background min-h-[80px]"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            {pending ? 'Guardando...' : 'Guardar Gasto'}
          </Button>

          <Link
            href="/expenses"
            className={buttonVariants({ variant: 'outline', className: 'w-full sm:w-auto' })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
