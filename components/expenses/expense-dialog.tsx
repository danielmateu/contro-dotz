'use client'

import { useActionState, useState, useEffect, useTransition } from 'react'
import { createExpenseAction, updateExpenseAction } from '@/app/actions/expense'
import { scanReceiptAction } from '@/app/actions/gemini'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Check, Save, Sparkles } from 'lucide-react'
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

  // Obtener fecha formateada por defecto en formato YYYY-MM-DD
  const defaultDate = expense?.expense_date
    ? new Date(expense.expense_date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  // Estados controlados para permitir autocompletado por IA
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(defaultDate)
  const [paymentMethod, setPaymentMethod] = useState('Tarjeta')
  const [notes, setNotes] = useState('')

  // Estados de escaneo IA
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')

  // Decidir qué acción de servidor usar y enlazar sus argumentos
  const action = expense
    ? updateExpenseAction.bind(null, expense.id)
    : createExpenseAction.bind(null, householdId!)

  const [state, formAction, pending] = useActionState(action, initialState)

  // Sincronizar estados cuando el modal se abre o cambia el gasto
  useEffect(() => {
    if (open) {
      setAmount(expense?.amount?.toString().replace('.', ',') || '')
      setCategoryId(expense?.category_id || '')
      setDescription(expense?.description || '')
      setExpenseDate(defaultDate)
      setPaymentMethod(expense?.payment_method || 'Tarjeta')
      setNotes(expense?.notes || '')
      setScanError('')
    }
  }, [open, expense, defaultDate])

  // Cerrar el modal cuando la acción se ejecuta con éxito
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setOpen(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state])

  // Handler para subir e iniciar el análisis del ticket
  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setScanError('Por favor, selecciona una imagen de ticket válida.')
      return
    }

    // Validar tamaño máximo (4MB)
    if (file.size > 4 * 1024 * 1024) {
      setScanError('La imagen del ticket supera el tamaño máximo permitido de 4MB.')
      return
    }

    setIsScanning(true)
    setScanError('')

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1]
        // Empaquetar todo en un FormData para evitar que el serializador RSC de Next.js
        // analice la cadena larga de base64 como una estructura de datos anidada.
        const scanFormData = new FormData()
        scanFormData.append('base64Data', base64String)
        scanFormData.append('mimeType', file.type)
        scanFormData.append('categories', JSON.stringify(categories.map(c => ({ id: c.id, name: c.name }))))

        const res = await scanReceiptAction(scanFormData)

        if (res.error) {
          setScanError(res.error)
        } else {
          if (res.amount) {
            setAmount(res.amount.replace('.', ','))
          }
          if (res.description) {
            setDescription(res.description)
          }
          if (res.expense_date) {
            setExpenseDate(res.expense_date)
          }
          if (res.category_id) {
            setCategoryId(res.category_id)
          }
        }
      } catch (err) {
        console.error('Receipt Scan Client Error:', err)
        setScanError('Error al analizar la imagen del ticket. Inténtalo de nuevo.')
      } finally {
        setIsScanning(false)
        e.target.value = '' // Limpiar input para permitir re-subir
      }
    }
    reader.readAsDataURL(file)
  }

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

        {/* Lector de Tickets con IA (solo para nuevos gastos) */}
        {!expense && (
          <div className="pt-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="receipt-upload"
              onChange={handleReceiptScan}
              disabled={isScanning || pending}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-2 py-6 text-sm"
              onClick={() => document.getElementById('receipt-upload')?.click()}
              disabled={isScanning || pending}
            >
              <Sparkles className={`h-4 w-4 text-emerald-500 ${isScanning ? 'animate-spin' : 'animate-pulse'}`} />
              {isScanning ? 'Analizando ticket con IA...' : '📸 Rellenar subiendo ticket (IA)'}
            </Button>
            {scanError && (
              <Alert variant="destructive" className="mt-2 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{scanError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isScanning}
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
              <Select
                name="category_id"
                value={categoryId}
                onValueChange={(val) => setCategoryId(val || '')}
                disabled={isScanning}
                items={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
              >
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isScanning}
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
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                disabled={isScanning}
                required
                className="bg-muted/50 focus:bg-background"
              />
            </div>

            {/* Método de pago */}
            <div className="space-y-1">
              <Label htmlFor="payment_method">Método de pago</Label>
              <Select
                name="payment_method"
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val || 'Tarjeta')}
                disabled={isScanning}
                items={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
              >
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isScanning}
                className="bg-muted/50 focus:bg-background min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose render={<Button variant="outline" type="button" disabled={isScanning || pending}>Cancelar</Button>} />
            <Button type="submit" disabled={isScanning || pending}>
              <Save className="mr-2 h-4 w-4" />
              {pending ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
