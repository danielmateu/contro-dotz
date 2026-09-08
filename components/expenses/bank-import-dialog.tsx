'use client'

import React, { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  parseBankStatementAction,
  bulkCreateExpensesAction,
  ParsedBankExpense,
  BulkCreateExpensePayload,
} from '@/app/actions/bank-import'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  FileSpreadsheet,
  UploadCloud,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Coins,
  FileText,
  Building2,
  Calendar,
  Tag,
  CreditCard,
  User,
  ArrowRight,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  color?: string
}

interface Member {
  id: string
  name: string
  avatar_url?: string | null
}

interface BankImportDialogProps {
  householdId: string
  categories: Category[]
  members: Member[]
  currentUserId: string
  isOwner: boolean
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BankImportDialog({
  householdId,
  categories,
  members,
  currentUserId,
  isOwner,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: BankImportDialogProps) {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const isOpen = isControlled ? externalOpen : internalOpen
  const setIsOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload')

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [defaultPayerId, setDefaultPayerId] = useState<string>(currentUserId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parsing Results & Edits
  const [parsedExpenses, setParsedExpenses] = useState<ParsedBankExpense[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [possibleDuplicatesCount, setPossibleDuplicatesCount] = useState<number>(0)
  const [importedCount, setImportedCount] = useState<number>(0)

  const resetState = () => {
    setStep('upload')
    setSelectedFile(null)
    setParsedExpenses([])
    setErrorMsg(null)
    setPossibleDuplicatesCount(0)
    setImportedCount(0)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTimeout(resetState, 300)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setErrorMsg(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setErrorMsg(null)
    }
  }

  // Paso 1: Parsear con IA
  const handleParseFile = async () => {
    if (!selectedFile) {
      setErrorMsg('Por favor, selecciona un archivo de extracto bancario.')
      return
    }

    setErrorMsg(null)
    const formData = new FormData()
    formData.append('file', selectedFile)

    startTransition(async () => {
      const res = await parseBankStatementAction(householdId, formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else if (res.expenses && res.expenses.length > 0) {
        setParsedExpenses(res.expenses)
        setPossibleDuplicatesCount(res.possibleDuplicatesCount || 0)
        setStep('review')
      } else {
        setErrorMsg('No se detectaron transacciones de gasto en este archivo.')
      }
    })
  }

  // Modificaciones en la tabla interactiva
  const handleToggleSelect = (tempId: string) => {
    setParsedExpenses((prev) =>
      prev.map((exp) => (exp.temp_id === tempId ? { ...exp, selected: !exp.selected } : exp))
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setParsedExpenses((prev) => prev.map((exp) => ({ ...exp, selected: checked })))
  }

  const handleDeselectDuplicates = () => {
    setParsedExpenses((prev) =>
      prev.map((exp) => ({ ...exp, selected: exp.is_duplicate ? false : exp.selected }))
    )
  }

  const handleUpdateRow = (tempId: string, field: keyof ParsedBankExpense, value: any) => {
    setParsedExpenses((prev) =>
      prev.map((exp) => {
        if (exp.temp_id !== tempId) return exp
        const updated = { ...exp, [field]: value }
        if (field === 'category_id') {
          const cat = categories.find((c) => c.id === value)
          updated.category_name = cat?.name || null
        }
        return updated
      })
    )
  }

  const handleRemoveRow = (tempId: string) => {
    setParsedExpenses((prev) => prev.filter((exp) => exp.temp_id !== tempId))
  }

  // Paso 2: Guardado masivo
  const handleConfirmImport = async () => {
    const selectedExpenses = parsedExpenses.filter((exp) => exp.selected)
    if (selectedExpenses.length === 0) {
      setErrorMsg('Selecciona al menos una transacción para importar.')
      return
    }

    // Validar que todas tengan categoría asignada (usar la primera si falta)
    const fallbackCategoryId = categories[0]?.id || ''
    const payload: BulkCreateExpensePayload[] = selectedExpenses.map((exp) => ({
      expense_date: exp.expense_date,
      description: exp.description,
      amount: exp.amount,
      category_id: exp.category_id || fallbackCategoryId,
      payment_method: exp.payment_method || 'Tarjeta',
      created_by: defaultPayerId === 'shared' ? null : defaultPayerId,
    }))

    setErrorMsg(null)
    startTransition(async () => {
      const res = await bulkCreateExpensesAction(householdId, payload)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setImportedCount(res.count || payload.length)
        setStep('success')
        router.refresh()
      }
    })
  }

  // Cálculos de totales
  const selectedCount = parsedExpenses.filter((e) => e.selected).length
  const selectedTotalSum = parsedExpenses
    .filter((e) => e.selected)
    .reduce((sum, e) => sum + e.amount, 0)
  const isAllSelected = parsedExpenses.length > 0 && parsedExpenses.every((e) => e.selected)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger as any} />}

      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-4xl p-4 sm:p-6 rounded-3xl bg-card border-border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-1 text-left border-b border-border/50 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-extrabold font-heading">
                Importación Masiva de Extractos
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sube extractos bancarios en CSV, Excel o TXT y la IA categorizará y detectará duplicados automáticamente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="my-2 shrink-0 rounded-2xl text-xs">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-bold">Aviso</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* PASO 1: CARGA DE ARCHIVO */}
        {step === 'upload' && (
          <div className="space-y-5 py-4 flex-1 overflow-y-auto min-h-0">
            {/* Zona Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 ${selectedFile
                ? 'border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/10'
                : 'border-border/80 hover:border-primary/60 bg-muted/30 hover:bg-muted/50'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.tsv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                className={`p-3.5 rounded-2xl ${selectedFile
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-primary/10 text-primary'
                  }`}
              >
                {selectedFile ? (
                  <FileText className="w-8 h-8 animate-pulse" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Listo para analizar con IA ✨
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive mt-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    Arrastra aquí tu extracto bancario o <span className="text-primary underline">examina tus archivos</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Soporta extractos de BBVA, CaixaBank, Santander, Revolut, ING, Sabadell, N26 (.csv, .xlsx, .txt)
                  </p>
                </div>
              )}
            </div>

            {/* Configuración adicional: Pagador por defecto */}
            <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="space-y-0.5">
                  <Label className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> Pagador asignado por defecto
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Todos los gastos del extracto se asociarán a este miembro (puedes cambiarlo individualmente).
                  </p>
                </div>

                <Select
                  value={defaultPayerId}
                  onValueChange={(val: string | null) => setDefaultPayerId(val || 'shared')}
                  items={[
                    { value: 'shared', label: 'Compartido (A medias)' },
                    ...members.map((m) => {
                      const isMe = m.id === currentUserId
                      const isUuid = m.name && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(m.name)
                      const label = isUuid ? (isMe ? 'Yo (Tú)' : 'Familiar') : m.name
                      return { value: m.id, label }
                    }),
                  ]}
                >
                  <SelectTrigger className="w-48 text-xs font-semibold rounded-xl bg-background">
                    <SelectValue placeholder="Seleccionar pagador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">💬 Compartido (A medias)</SelectItem>
                    {members.map((m) => {
                      const isMe = m.id === currentUserId
                      const isUuid = m.name && /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(m.name)
                      const label = isUuid ? (isMe ? 'Yo (Tú)' : 'Familiar') : m.name
                      return (
                        <SelectItem key={m.id} value={m.id}>
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-xl text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!selectedFile || isPending}
                onClick={handleParseFile}
                className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 shadow-md gap-2"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analizando con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analizar Extracto
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* PASO 2: REVISIÓN INTERACTIVA */}
        {step === 'review' && (
          <div className="space-y-3 py-2 flex-1 min-h-0 flex flex-col">
            {/* Banner de Estado & Filtros de Lote */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 p-3 rounded-2xl border border-border/50 shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs font-bold px-2.5 py-1">
                  {parsedExpenses.length} Gastos Detectados
                </Badge>

                {possibleDuplicatesCount > 0 && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold px-2.5 py-1 gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    {possibleDuplicatesCount} Posibles Duplicados
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {possibleDuplicatesCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectDuplicates}
                    className="text-[11px] h-7 px-2.5 rounded-lg text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-semibold"
                  >
                    Desmarcar Duplicados
                  </Button>
                )}

                <div className="flex items-center gap-1.5 text-xs font-semibold pl-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={(c) => handleSelectAll(!!c)}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer text-xs font-bold">
                    Seleccionar Todos
                  </Label>
                </div>
              </div>
            </div>

            {/* Tabla Editable de Transacciones */}
            <div className="flex-1 min-h-0 overflow-y-auto border border-border/60 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/60 sticky top-0 z-10 border-b border-border/60 font-bold text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center"></th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Categoría Sugerida</th>
                    <th className="p-3">Método</th>
                    <th className="p-3 text-right">Importe</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {parsedExpenses.map((exp) => (
                    <tr
                      key={exp.temp_id}
                      className={`transition-colors ${!exp.selected
                        ? 'opacity-40 bg-muted/20'
                        : exp.is_duplicate
                          ? 'bg-amber-500/10 dark:bg-amber-950/20 hover:bg-amber-500/15'
                          : 'hover:bg-muted/30'
                        }`}
                    >
                      {/* Checkbox selector */}
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={exp.selected}
                          onCheckedChange={() => handleToggleSelect(exp.temp_id)}
                        />
                      </td>

                      {/* Fecha */}
                      <td className="p-3 font-medium whitespace-nowrap min-w-28">
                        <Input
                          type="date"
                          value={exp.expense_date}
                          onChange={(e) => handleUpdateRow(exp.temp_id, 'expense_date', e.target.value)}
                          className="h-7 text-xs px-1.5 py-0 font-medium bg-background border-border/60 rounded-lg"
                        />
                      </td>

                      {/* Concepto + Aviso Duplicado */}
                      <td className="p-3 font-semibold min-w-44">
                        <div className="space-y-0.5">
                          <Input
                            type="text"
                            value={exp.description}
                            onChange={(e) => handleUpdateRow(exp.temp_id, 'description', e.target.value)}
                            className="h-7 text-xs px-2 font-semibold bg-background border-border/60 rounded-lg"
                          />
                          {exp.is_duplicate && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 italic flex items-center gap-1 font-normal">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {exp.duplicate_reason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="p-3 min-w-36">
                        <Select
                          value={exp.category_id || ''}
                          onValueChange={(val) => handleUpdateRow(exp.temp_id, 'category_id', val)}
                          items={categories.map((c) => ({ value: c.id, label: c.name }))}
                        >
                          <SelectTrigger className="h-7 text-xs px-2 font-semibold bg-background border-border/60 rounded-lg">
                            <SelectValue placeholder="Sin categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Método de Pago */}
                      <td className="p-3 min-w-24 text-muted-foreground">
                        <span className="text-[11px] font-medium bg-muted/60 px-2 py-0.5 rounded-md border border-border/40 inline-block">
                          {exp.payment_method}
                        </span>
                      </td>

                      {/* Importe (€) */}
                      <td className="p-3 text-right font-extrabold text-foreground min-w-28">
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={exp.amount}
                            onChange={(e) => handleUpdateRow(exp.temp_id, 'amount', parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs font-bold text-right w-20 px-1 py-0 bg-background border-border/60 rounded-lg text-emerald-600 dark:text-emerald-400"
                          />
                          <span className="text-xs">€</span>
                        </div>
                      </td>

                      {/* Acción Eliminar */}
                      <td className="p-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(exp.temp_id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pie de Página con Resumen y Guardado */}
            <DialogFooter className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                <span>
                  {selectedCount} de {parsedExpenses.length} seleccionados
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                  Total: {formatCurrency(selectedTotalSum)}
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('upload')}
                  className="rounded-xl text-xs font-bold"
                >
                  Atrás
                </Button>
                <Button
                  type="button"
                  disabled={selectedCount === 0 || isPending}
                  onClick={handleConfirmImport}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Importar {selectedCount} Gastos ({formatCurrency(selectedTotalSum)})
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}

        {/* PASO 3: ÉXITO */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="p-4 bg-emerald-500/15 text-emerald-500 rounded-full animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold font-heading text-foreground">
                ¡Extracto Importado con Éxito! 🎉
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Se han añadido <strong className="text-emerald-600 dark:text-emerald-400">{importedCount} gastos</strong> a las cuentas de tu hogar.
              </p>
            </div>

            <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>+{importedCount * 2} DotzCoins ganadas para tu Tamagotchi Dotzi 🐷</span>
            </div>

            <Button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl font-bold px-6 bg-primary hover:bg-primary/90 mt-2"
            >
              Entendido y Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
