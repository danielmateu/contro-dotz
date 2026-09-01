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
import { AlertCircle, Check, Save, Sparkles, Receipt, X } from 'lucide-react'
import { MorphIcon } from 'morphicons/react'
import { createClient } from '@/lib/supabase/client'
// @ts-ignore
import { __iconNode as SparklesData } from 'lucide-react/dist/esm/icons/sparkles.mjs'
// @ts-ignore
import { __iconNode as ClockData } from 'lucide-react/dist/esm/icons/clock.mjs'
// @ts-ignore
import { __iconNode as CheckData } from 'lucide-react/dist/esm/icons/check.mjs'
// @ts-ignore
import { __iconNode as AlertCircleData } from 'lucide-react/dist/esm/icons/circle-alert.mjs'
// @ts-ignore
import { __iconNode as PlusData } from 'lucide-react/dist/esm/icons/plus.mjs'
// @ts-ignore
import { __iconNode as SaveData } from 'lucide-react/dist/esm/icons/save.mjs'
import { PAYMENT_METHODS } from '@/lib/validations'
import { predictCategory } from '@/lib/category-predictor'

interface Category {
  id: string
  name: string
}

interface Member {
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
    receipt_path?: string | null
    created_by?: string | null
    is_personal?: boolean
  } // Requerido para editar
  members?: Member[]
  currentUserId?: string
  isOwner?: boolean
  trigger?: React.ReactElement
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
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
  members = [],
  currentUserId = '',
  isOwner = false,
  trigger,
  className,
  size,
}: ExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [triggerHovered, setTriggerHovered] = useState(false)
  const [saveHovered, setSaveHovered] = useState(false)

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
  const [createdBy, setCreatedBy] = useState('')
  const [isPersonal, setIsPersonal] = useState(false)
  const [suggestedCategory, setSuggestedCategory] = useState<any | null>(null)

  useEffect(() => {
    const predicted = predictCategory(description, categories)
    if (predicted && predicted.id !== categoryId) {
      setSuggestedCategory(predicted)
    } else {
      setSuggestedCategory(null)
    }
  }, [description, categoryId, categories])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteReceipt, setDeleteReceipt] = useState(false)
  const [showOptionalFields, setShowOptionalFields] = useState(false)

  // Estados de escaneo IA
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [scanSuccess, setScanSuccess] = useState(false)

  // Decidir qué acción de servidor usar y enlazar sus argumentos
  const action = expense
    ? updateExpenseAction.bind(null, expense.id)
    : createExpenseAction.bind(null, householdId!)

  const [formState, setFormState] = useState<FormState>(initialState)
  const [isSavingExpense, setIsSavingExpense] = useState(false)

  // Sincronizar estados cuando el modal se abre o cambia el gasto
  useEffect(() => {
    if (open) {
      setAmount(expense?.amount?.toString().replace('.', ',') || '')
      setCategoryId(expense?.category_id || '')
      setDescription(expense?.description || '')
      setExpenseDate(defaultDate)
      setPaymentMethod(expense?.payment_method || 'Tarjeta')
      setNotes(expense?.notes || '')
      setIsPersonal(expense?.is_personal ?? false)
      setScanError('')
      setScanSuccess(false)
      setFormState({})
      setSelectedFile(null)
      setDeleteReceipt(false)
      setShowOptionalFields(!!expense?.notes || !!expense?.receipt_path)
      
      const initialCreatedBy = expense?.created_by === null 
        ? 'shared' 
        : (expense?.created_by || currentUserId || '')
      setCreatedBy(initialCreatedBy)
    }
  }, [open, expense, defaultDate, currentUserId])

  // Cerrar el modal cuando la acción se ejecuta con éxito
  useEffect(() => {
    if (formState?.success) {
      const timer = setTimeout(() => {
        setOpen(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formState])

  const handleViewReceipt = async () => {
    if (!expense?.receipt_path) return
    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('receipts')
        .createSignedUrl(expense.receipt_path, 300)
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      } else {
        alert('No se pudo obtener el enlace del ticket.')
      }
    } catch (err) {
      console.error(err)
      alert('Error al abrir el ticket.')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('is_personal', isPersonal ? 'true' : 'false')
    if (selectedFile) {
      formData.append('receipt', selectedFile)
    }
    if (deleteReceipt) {
      formData.append('delete_receipt', 'true')
    }
    setIsSavingExpense(true)
    const startTime = Date.now()

    try {
      // Llamar la acción de servidor pasándole el estado previo como requiere su firma
      const res = await action(formState, formData)

      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 850 - elapsed)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining))
      }

      setFormState(res || {})
    } catch (err) {
      console.error('Error saving expense:', err)
      setFormState({ error: 'Error al guardar el gasto. Inténtalo de nuevo.' })
    } finally {
      setIsSavingExpense(false)
    }
  }

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
    setScanSuccess(false)
    setSelectedFile(file)
    setDeleteReceipt(false)

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
          setScanSuccess(true)
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

  const defaultTriggerButton = (
    <Button
      size={size}
      className={className}
      onMouseEnter={() => setTriggerHovered(true)}
      onMouseLeave={() => setTriggerHovered(false)}
    >
      <MorphIcon
        icon={triggerHovered ? SparklesData : PlusData}
        spring="snappy"
        className="mr-2 h-4 w-4"
      />
      {expense ? 'Editar Gasto' : 'Registrar Gasto'}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || defaultTriggerButton} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
          </DialogTitle>
          <DialogDescription className="hidden sm:block">
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
              disabled={isScanning || isSavingExpense}
            />
            <Button
              type="button"
              variant="outline"
              className={`w-full border-dashed flex items-center justify-center gap-2 py-6 text-sm transition-all duration-300 ${scanSuccess
                ? 'border-emerald-500 bg-emerald-50/30 text-emerald-600 dark:bg-emerald-950/10'
                : scanError
                  ? 'border-rose-500 bg-rose-50/30 text-rose-600 dark:bg-rose-950/10'
                  : 'border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              onClick={() => document.getElementById('receipt-upload')?.click()}
              disabled={isScanning || isSavingExpense}
            >
              <MorphIcon
                icon={isScanning ? ClockData : scanSuccess ? CheckData : scanError ? AlertCircleData : SparklesData}
                spring="snappy"
                className={`h-4 w-4 ${isScanning
                  ? 'text-emerald-500 animate-spin'
                  : scanSuccess
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : scanError
                      ? 'text-rose-500'
                      : 'text-emerald-500 animate-pulse'
                  }`}
              />
              {isScanning
                ? 'Analizando ticket con IA...'
                : scanSuccess
                  ? '¡Ticket analizado con éxito!'
                  : scanError
                    ? 'Error al escanear. Reintentar'
                    : 'Rellenar subiendo ticket (IA)'}
            </Button>
            {scanError && (
              <Alert variant="destructive" className="mt-2 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{scanError}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2 text-left">
            {formState?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de validación</AlertTitle>
                <AlertDescription>{formState.error}</AlertDescription>
              </Alert>
            )}

            {formState?.success && (
              <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
                <Check className="h-4 w-4 text-emerald-500" />
                <AlertTitle>Éxito</AlertTitle>
                <AlertDescription>{formState.success}</AlertDescription>
              </Alert>
            )}

            {/* Importe y Categoría */}
            <div className="grid grid-cols-2 gap-3">
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
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Utiliza coma/punto (máx. 2 dec.).
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
                    <SelectValue placeholder="Seleccionar" />
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
              {suggestedCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId(suggestedCategory.id)
                    setSuggestedCategory(null)
                  }}
                  className="mt-1 text-[11px] text-primary hover:underline flex items-center gap-1.5 animate-pulse text-left"
                >
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span>¿Categoría <strong>{suggestedCategory.name}</strong>? Haz clic para aplicar.</span>
                </button>
              )}
            </div>

            {/* Fecha y Método de pago */}
            <div className="grid grid-cols-2 gap-3">
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
                    <SelectValue placeholder="Seleccionar" />
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
            </div>

            {/* Pagado por (solo para propietarios) */}
            {isOwner && members && members.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="created_by">Pagado por</Label>
                <Select
                  name="created_by"
                  value={createdBy}
                  onValueChange={(val) => setCreatedBy(val || '')}
                  disabled={isScanning}
                  items={[
                    ...members.map((m) => ({ value: m.id, label: m.name })),
                    { value: 'shared', label: 'A medias / Compartido (Todos)' },
                  ]}
                >
                  <SelectTrigger id="created_by" className="w-full bg-muted/50 h-9">
                    <SelectValue placeholder="Seleccionar miembro" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="shared">A medias / Compartido (Todos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ámbito del gasto: Compartido del Hogar vs Personal */}
            <div className="space-y-1">
              <Label className="text-xs">Ámbito del Gasto</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPersonal(false)}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                    !isPersonal
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-semibold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>🏡 Del Hogar (Compartido)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPersonal(true)}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                    isPersonal
                      ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 font-semibold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>👤 Gasto Personal</span>
                </button>
              </div>
            </div>

            {showOptionalFields ? (
              <>
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
                    className="bg-muted/50 focus:bg-background min-h-16"
                  />
                </div>

                {/* Ticket de compra */}
                <div className="space-y-1">
                  <Label className="text-xs">Ticket de compra (opcional)</Label>

                  {selectedFile ? (
                    <div className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded-lg border border-emerald-500/20">
                      <Receipt className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate flex-1 font-medium">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : expense?.receipt_path && !deleteReceipt ? (
                    <div className="flex items-center gap-2 text-xs bg-muted/40 p-2 rounded-lg border border-primary/20">
                      <Receipt className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate flex-1 font-medium text-muted-foreground">Ticket guardado</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[10px]"
                        onClick={handleViewReceipt}
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
                    </div>
                  ) : (
                    <Input
                      id="receipt-manual"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setSelectedFile(file)
                      }}
                      disabled={isScanning}
                      className="bg-muted/50 focus:bg-background h-9 text-xs"
                    />
                  )}
                </div>

                {/* Botón para colapsar */}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-1 h-auto flex items-center justify-center gap-1"
                  onClick={() => setShowOptionalFields(false)}
                >
                  - Ocultar campos opcionales
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground hover:text-foreground py-2.5 h-auto border border-dashed border-muted/80 hover:border-muted-foreground/30 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300"
                onClick={() => setShowOptionalFields(true)}
              >
                + Añadir notas o ticket (opcional)
              </Button>
            )}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose render={<Button variant="outline" type="button" disabled={isScanning || isSavingExpense}>Cancelar</Button>} />
            <Button
              type="submit"
              disabled={isScanning || isSavingExpense}
              onMouseEnter={() => setSaveHovered(true)}
              onMouseLeave={() => setSaveHovered(false)}
            >
              <MorphIcon
                icon={isSavingExpense ? ClockData : saveHovered ? CheckData : SaveData}
                spring="snappy"
                className={`mr-2 h-4 w-4 ${isSavingExpense ? 'animate-spin' : ''}`}
              />
              {isSavingExpense ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
