'use client'

import { useActionState, useState } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Save, Receipt, X } from 'lucide-react'
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
    receipt_path?: string | null
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
  const [deleteReceipt, setDeleteReceipt] = useState(false)

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

      <form action={formAction} encType="multipart/form-data">
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
            <Select name="category_id" defaultValue={initialData?.category_id || ''} items={categories.map((cat) => ({ value: cat.id, label: cat.name }))}>
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
            <Select name="payment_method" defaultValue={initialData?.payment_method || 'Tarjeta'} items={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}>
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

          {/* Ticket de compra */}
          <div className="space-y-1">
            <Label className="text-xs">Ticket de compra (opcional)</Label>
            
            {initialData?.receipt_path && !deleteReceipt ? (
              <div className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded-lg border border-primary/20">
                <Receipt className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate flex-1 font-medium text-muted-foreground">Ticket guardado</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={async () => {
                    try {
                      const supabase = createClient()
                      const { data } = await supabase.storage
                        .from('receipts')
                        .createSignedUrl(initialData.receipt_path!, 300)
                      if (data?.signedUrl) {
                        window.open(data.signedUrl, '_blank')
                      } else {
                        alert('No se pudo obtener el enlace del ticket.')
                      }
                    } catch (err) {
                      console.error(err)
                      alert('Error al abrir el ticket.')
                    }
                  }}
                >
                  Ver
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteReceipt(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <input type="hidden" name="delete_receipt" value="false" />
              </div>
            ) : (
              <>
                <Input
                  id="receipt"
                  name="receipt"
                  type="file"
                  accept="image/*"
                  className="bg-muted/50 focus:bg-background h-9 text-xs"
                />
                {deleteReceipt && (
                  <input type="hidden" name="delete_receipt" value="true" />
                )}
              </>
            )}
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
