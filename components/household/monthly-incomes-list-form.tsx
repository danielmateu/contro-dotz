'use client'

import { useState, useTransition, useRef } from 'react'
import { saveMonthlyIncomeAction, deleteMonthlyIncomeAction, getPayrollUrlAction, updateMonthlyIncomePayrollAction } from '@/app/actions/household'
import { scanPayrollAction } from '@/app/actions/gemini'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, CheckCircle2, Calendar, Landmark, Loader2, Trash2, FileText, Upload, Pencil, Sparkles, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'

import { useI18n } from '@/lib/i18n/i18n-context'

interface MonthlyIncome {
  id: string
  month: string
  amount: number
  contribution?: number
  payroll_path?: string | null
}

interface MonthlyIncomesListFormProps {
  initialIncomes: MonthlyIncome[]
  householdId: string
  userId: string
}

export function MonthlyIncomesListForm({
  initialIncomes,
  householdId,
  userId,
}: MonthlyIncomesListFormProps) {
  const { t, locale } = useI18n()
  const [isPending, startTransition] = useTransition()

  // Obtener fecha actual para establecer valores por defecto
  const today = new Date()
  const currentMonthValue = (today.getMonth() + 1).toString().padStart(2, '0') // "01"-"12"
  const currentYearValue = today.getFullYear().toString() // "2026"

  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue)
  const [selectedYear, setSelectedYear] = useState(currentYearValue)
  const [amount, setAmount] = useState('')
  const [contribution, setContribution] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [uploadingIncomeId, setUploadingIncomeId] = useState<string | null>(null)
  const [targetIncomeForUpload, setTargetIncomeForUpload] = useState<MonthlyIncome | null>(null)
  const [isScanningPayroll, setIsScanningPayroll] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Confirmación de eliminación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null)

  // Edición de registro existente
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<MonthlyIncome | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editContribution, setEditContribution] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const rowFileInputRef = useRef<HTMLInputElement>(null)
  const scanFileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Definición de listado dinámico de meses traducidos
  const monthsList = Array.from({ length: 12 }, (_, i) => {
    const val = (i + 1).toString().padStart(2, '0')
    const d = new Date(2026, i, 1)
    const name = d.toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-US' : 'es-ES', { month: 'long' })
    return { value: val, label: name.charAt(0).toUpperCase() + name.slice(1) }
  })

  // Rango de años: anterior, actual y próximo
  const currentYearNum = today.getFullYear()
  const yearsList = [
    { value: (currentYearNum - 1).toString(), label: (currentYearNum - 1).toString() },
    { value: currentYearNum.toString(), label: currentYearNum.toString() },
    { value: (currentYearNum + 1).toString(), label: (currentYearNum + 1).toString() },
  ]

  // Ordenar ingresos por mes descendente para mostrarlos en el listado
  const sortedIncomes = [...initialIncomes].sort((a, b) => b.month.localeCompare(a.month))

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Recomponer la fecha en formato YYYY-MM
    const monthStr = `${selectedYear}-${selectedMonth}`

    const normalizedAmount = amount.trim().replace(',', '.')
    const numericAmount = parseFloat(normalizedAmount)

    const normalizedContrib = contribution.trim().replace(',', '.')
    const numericContrib = contribution.trim() === '' ? 0 : parseFloat(normalizedContrib)

    if (isNaN(numericAmount) || numericAmount < 0) {
      setError(t('household.validAmountErr'))
      return
    }

    if (isNaN(numericContrib) || numericContrib < 0) {
      setError(t('household.validContribErr'))
      return
    }

    // Validar archivo si existe
    if (file) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        setError(t('household.invalidFileTypeErr'))
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(t('household.maxSizeErr'))
        return
      }
    }

    startTransition(async () => {
      let filePath: string | null = null

      // Subir archivo a Supabase Storage si se ha seleccionado uno
      if (file) {
        try {
          const fileExt = file.name.split('.').pop()
          filePath = `${householdId}/${userId}/${monthStr}-${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('payrolls')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            })

          if (uploadError) {
            throw uploadError
          }
        } catch (err: any) {
          console.error('Error al subir documento de nómina:', err)
          setError(t('household.uploadPayrollErr'))
          return
        }
      }

      const res = await saveMonthlyIncomeAction(householdId, monthStr, numericAmount, numericContrib, filePath)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(t('household.savePayrollSuccess'))
        setAmount('')
        setContribution('')
        // Restablecer a mes y año actuales por defecto
        setSelectedMonth(currentMonthValue)
        setSelectedYear(currentYearValue)
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    })
  }

  const handleDeleteClick = (incomeId: string) => {
    setIncomeToDelete(incomeId)
    setIsConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (!incomeToDelete) return

    setError(null)
    setSuccess(null)
    setIsConfirmOpen(false)

    const id = incomeToDelete
    setIncomeToDelete(null)

    startTransition(async () => {
      const res = await deleteMonthlyIncomeAction(id)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(t('household.deletePayrollSuccess'))
      }
    })
  }

  const handleEditClick = (inc: MonthlyIncome) => {
    setEditingIncome(inc)
    setEditAmount(inc.amount ? inc.amount.toString() : '')
    setEditContribution(inc.contribution ? inc.contribution.toString() : '')
    setIsEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingIncome) return
    setError(null)
    setSuccess(null)

    const normalizedAmount = editAmount.trim().replace(',', '.')
    const numericAmount = parseFloat(normalizedAmount)

    const normalizedContrib = editContribution.trim().replace(',', '.')
    const numericContrib = editContribution.trim() === '' ? 0 : parseFloat(normalizedContrib)

    if (isNaN(numericAmount) || numericAmount < 0) {
      setError(t('household.validAmountErr'))
      return
    }

    if (isNaN(numericContrib) || numericContrib < 0) {
      setError(t('household.validContribErr'))
      return
    }

    setIsEditOpen(false)

    startTransition(async () => {
      const res = await saveMonthlyIncomeAction(
        householdId,
        editingIncome.month,
        numericAmount,
        numericContrib,
        editingIncome.payroll_path
      )
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(t('household.savePayrollSuccess'))
      }
      setEditingIncome(null)
    })
  }

  const handleDownloadPayroll = async (path: string) => {
    setDownloadingId(path)
    setError(null)
    try {
      const res = await getPayrollUrlAction(path)
      if (res?.error) {
        setError(res.error)
      } else if (res?.url) {
        window.open(res.url, '_blank')
      }
    } catch (err) {
      setError(t('household.openPayrollErr'))
    } finally {
      setDownloadingId(null)
    }
  }

  const triggerAttachPayroll = (income: MonthlyIncome) => {
    setTargetIncomeForUpload(income)
    if (rowFileInputRef.current) {
      rowFileInputRef.current.value = ''
      rowFileInputRef.current.click()
    }
  }

  const handleRowFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile || !targetIncomeForUpload) return

    setError(null)
    setSuccess(null)

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError(t('household.invalidFileTypeErr'))
      setTargetIncomeForUpload(null)
      return
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError(t('household.maxSizeErr'))
      setTargetIncomeForUpload(null)
      return
    }

    const incomeId = targetIncomeForUpload.id
    const monthStr = targetIncomeForUpload.month
    setUploadingIncomeId(incomeId)

    startTransition(async () => {
      try {
        const fileExt = selectedFile.name.split('.').pop()
        const filePath = `${householdId}/${userId}/${monthStr}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('payrolls')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          throw uploadError
        }

        const res = await updateMonthlyIncomePayrollAction(incomeId, filePath)
        if (res?.error) {
          setError(res.error)
        } else {
          setSuccess(t('household.attachPayrollSuccess'))
        }
      } catch (err: any) {
        console.error('Error al subir documento de nómina:', err)
        setError(t('household.uploadPayrollErr'))
      } finally {
        setUploadingIncomeId(null)
        setTargetIncomeForUpload(null)
        if (rowFileInputRef.current) {
          rowFileInputRef.current.value = ''
        }
      }
    })
  }

  const processPayrollScanFile = (fileToScan: File) => {
    setError(null)
    setSuccess(null)

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(fileToScan.type)) {
      setError(t('household.invalidFileTypeErr'))
      if (scanFileInputRef.current) scanFileInputRef.current.value = ''
      return
    }
    if (fileToScan.size > 5 * 1024 * 1024) {
      setError(t('household.maxSizeErr'))
      if (scanFileInputRef.current) scanFileInputRef.current.value = ''
      return
    }

    setIsScanningPayroll(true)
    const reader = new FileReader()

    reader.onload = async () => {
      try {
        const base64Content = (reader.result as string).split(',')[1]
        const formData = new FormData()
        formData.append('base64Data', base64Content)
        formData.append('mimeType', fileToScan.type)

        const res = await scanPayrollAction(formData)

        if (res.error) {
          setError(res.error)
        } else {
          if (res.amount) setAmount(res.amount)
          if (res.month) setSelectedMonth(res.month)
          if (res.year) setSelectedYear(res.year)
          setFile(fileToScan)
          setSuccess(t('household.scanPayrollSuccess'))
        }
      } catch (err: any) {
        console.error('Error al escanear nómina con IA:', err)
        setError(t('household.scanPayrollErr'))
      } finally {
        setIsScanningPayroll(false)
        if (scanFileInputRef.current) scanFileInputRef.current.value = ''
      }
    }

    reader.readAsDataURL(fileToScan)
  }

  const handleScanPayrollFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileToScan = e.target.files?.[0]
    if (fileToScan) {
      processPayrollScanFile(fileToScan)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      processPayrollScanFile(droppedFiles[0])
    }
  }

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const label = date.toLocaleDateString(locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  return (
    <div className="space-y-6">
      {/* Input oculto para adjuntar archivo a un registro existente */}
      <input
        type="file"
        ref={rowFileInputRef}
        className="hidden"
        accept="application/pdf,image/*"
        onChange={handleRowFileSelected}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('expenses.validationErrorTitle')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertTitle>{t('chat.operationSuccess')}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Target/Drop Zone de Inteligencia Artificial Gemini */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 border ${isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-xl ring-2 ring-indigo-500/20'
            : 'border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 shadow-sm hover:shadow-md'
          }`}
      >
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              {/* <Sparkles className="h-3.5 w-3.5 fill-indigo-500/30 text-indigo-600 dark:text-indigo-400" /> */}
              <span>{t('household.scanBannerTitle')}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              {t('household.scanBannerSubtitle')}
            </p>
          </div>

          <div className="flex-shrink-0">
            <input
              type="file"
              ref={scanFileInputRef}
              className="hidden"
              accept="application/pdf,image/*"
              onChange={handleScanPayrollFile}
            />
            <div
              onClick={() => !isScanningPayroll && !isPending && scanFileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer group text-center min-w-[220px] ${isScanningPayroll
                  ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                  : 'border-indigo-200 dark:border-indigo-800/60 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-900'
                }`}
            >
              {isScanningPayroll ? (
                <div className="flex flex-col items-center space-y-2 py-1">
                  <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {t('household.scanningPayroll')}
                  </span>
                </div>
              ) : (
                <div className="space-y-1 py-0.5">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('household.dropzonePrompt')}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t('household.dropzoneFormats')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulario manual de registro */}
      <form onSubmit={handleAddIncome} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card p-5 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Landmark className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm text-foreground">{t('household.manualFormTitle')}</h3>
          </div>
          {file && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              <span className="max-w-[150px] truncate font-medium">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="monthSelect" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {t('household.thMonth')}
              </Label>
              <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val || '')} disabled={isPending || isScanningPayroll}>
                <SelectTrigger id="monthSelect" className="h-9 text-xs bg-background">
                  <SelectValue placeholder={t('household.thMonth')} />
                </SelectTrigger>
                <SelectContent>
                  {monthsList.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="yearSelect" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {t('cashflow.year')}
              </Label>
              <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val || '')} disabled={isPending || isScanningPayroll}>
                <SelectTrigger id="yearSelect" className="h-9 text-xs bg-background">
                  <SelectValue placeholder={t('cashflow.year')} />
                </SelectTrigger>
                <SelectContent>
                  {yearsList.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="monthlyAmount" className="text-xs font-medium text-muted-foreground">
              {t('household.netIncome')}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">€</span>
              <Input
                id="monthlyAmount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('household.netIncomePlaceholder')}
                disabled={isPending || isScanningPayroll}
                required
                className="h-9 pl-7 bg-background text-xs font-semibold focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="monthlyContribution" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>{t('household.householdContribution')}</span>
              <span className="text-[11px] text-muted-foreground font-normal">({t('household.contributionPlaceholder')})</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">€</span>
              <Input
                id="monthlyContribution"
                type="text"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                placeholder={t('household.contributionPlaceholder')}
                disabled={isPending || isScanningPayroll}
                className="h-9 pl-7 bg-background text-xs font-semibold text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Carga opcional manual si no se usó el drag zone */}
        {!file && (
          <div className="pt-1 flex items-center justify-between text-xs border-t border-border/40">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isPending || isScanningPayroll}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || isScanningPayroll}
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <Upload className="h-3.5 w-3.5" />
                {t('household.attachPayroll')}
              </Button>
            </div>
            <span className="text-[10px] text-muted-foreground">PDF, PNG, JPG (&lt;5MB)</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending || isScanningPayroll}
          className="w-full h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-sm transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('household.savingPayroll')}
            </>
          ) : (
            t('household.registerPayroll')
          )}
        </Button>
      </form>

      {/* Historial listado */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span>{t('household.payrollHistory')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground font-medium">
              {sortedIncomes.length}
            </span>
          </h3>
        </div>

        {sortedIncomes.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-muted-foreground text-xs space-y-1">
            <FileText className="h-8 w-8 mx-auto opacity-30 mb-2" />
            <p className="font-medium">{t('household.noPayrollsHistory')}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3 pl-4 whitespace-nowrap">{t('household.thMonth')}</th>
                    <th className="p-3 text-right whitespace-nowrap">{t('household.thNetIncome')}</th>
                    <th className="p-3 text-right whitespace-nowrap">{t('household.thHouseholdContribution')}</th>
                    <th className="p-3 text-center whitespace-nowrap">{t('household.thDocument')}</th>
                    <th className="p-3 pr-4 w-20 text-center whitespace-nowrap">{t('household.thAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {sortedIncomes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 text-foreground transition-colors group">
                      <td className="p-3 pl-4 font-medium">
                        {formatMonthName(inc.month)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">
                        {formatCurrency(inc.amount)}
                      </td>
                      <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {inc.contribution && Number(inc.contribution) > 0 ? formatCurrency(inc.contribution) : '-'}
                      </td>
                      <td className="p-3 text-center">
                        {inc.payroll_path ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPayroll(inc.payroll_path!)}
                              disabled={isPending || downloadingId !== null || uploadingIncomeId !== null}
                              className="h-7 px-2.5 text-[11px] gap-1.5 border-indigo-200/80 text-indigo-600 dark:border-indigo-900/60 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 rounded-lg"
                            >
                              {downloadingId === inc.payroll_path ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-indigo-500" />
                              )}
                              <span>{t('household.viewPayroll')}</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title={t('household.changePayrollAction')}
                              onClick={() => triggerAttachPayroll(inc)}
                              disabled={isPending || downloadingId !== null || uploadingIncomeId === inc.id}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg"
                            >
                              {uploadingIncomeId === inc.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-[10px] text-muted-foreground italic hidden sm:inline">{t('household.noDocument')}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => triggerAttachPayroll(inc)}
                              disabled={isPending || downloadingId !== null || uploadingIncomeId === inc.id}
                              className="h-7 px-2 text-[11px] gap-1.5 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
                            >
                              {uploadingIncomeId === inc.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5" />
                              )}
                              <span>{t('household.attachPayrollAction')}</span>
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="p-3 pr-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(inc)}
                            disabled={isPending}
                            title={t('common.edit')}
                            className="h-7 w-7 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground rounded-lg"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(inc.id)}
                            disabled={isPending}
                            title={t('common.delete')}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Diálogo de Edición de Registro de Nómina */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIncome ? `${t('common.edit')} (${formatMonthName(editingIncome.month)})` : t('common.edit')}
            </DialogTitle>
            <DialogDescription>
              {t('household.editPayrollDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editMonthlyAmount">{t('household.netIncome')}</Label>
              <div className="relative">
                <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="editMonthlyAmount"
                  type="text"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder={t('household.netIncomePlaceholder')}
                  disabled={isPending}
                  className="pl-9 bg-background focus:bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMonthlyContribution">{t('household.householdContribution')}</Label>
              <div className="relative">
                <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
                <Input
                  id="editMonthlyContribution"
                  type="text"
                  value={editContribution}
                  onChange={(e) => setEditContribution(e.target.value)}
                  placeholder={t('household.contributionPlaceholder')}
                  disabled={isPending}
                  className="pl-9 bg-background focus:bg-background"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" /> : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('household.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('household.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

