'use client'

import { useState, useTransition, useRef } from 'react'
import { saveMonthlyIncomeAction, deleteMonthlyIncomeAction, getPayrollUrlAction } from '@/app/actions/household'
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
import { AlertCircle, CheckCircle2, Calendar, Landmark, Loader2, Trash2, FileText, Upload } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'

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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Confirmación de eliminación
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Definición de listado estático de meses
  const monthsList = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ]

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
      setError('Introduce un importe válido y mayor o igual a 0.')
      return
    }

    if (isNaN(numericContrib) || numericContrib < 0) {
      setError('Introduce una aportación válida y mayor o igual a 0.')
      return
    }

    // Validar archivo si existe
    if (file) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        setError('Por favor, selecciona un archivo válido (PDF o Imagen PNG/JPG).')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo debe ser menor a 5MB.')
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
          setError('Error al subir el archivo de la nómina. Inténtalo de nuevo.')
          return
        }
      }

      const res = await saveMonthlyIncomeAction(householdId, monthStr, numericAmount, numericContrib, filePath)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess('Ingreso mensual y documento registrados con éxito.')
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
        setSuccess('Registro de ingresos eliminado con éxito.')
      }
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
      setError('Error al abrir el documento de la nómina.')
    } finally {
      setDownloadingId(null)
    }
  }

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  return (
    <div className="space-y-6">
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

      {/* Formulario de registro */}
      <form onSubmit={handleAddIncome} className="space-y-4 p-4 rounded-xl border border-slate-200/50 bg-slate-50/30 dark:border-slate-800/40 dark:bg-slate-900/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="space-y-2 flex-1">
              <Label htmlFor="monthSelect">Mes</Label>
              <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val || '')} disabled={isPending}>
                <SelectTrigger id="monthSelect" className="bg-background">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {monthsList.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex-1">
              <Label htmlFor="yearSelect">Año</Label>
              <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val || '')} disabled={isPending}>
                <SelectTrigger id="yearSelect" className="bg-background">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {yearsList.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyAmount">Importe Neto (€)</Label>
            <div className="relative">
              <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="monthlyAmount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej. 2450"
                disabled={isPending}
                required
                className="pl-9 bg-background focus:bg-background"
              />
            </div>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="monthlyContribution">Aportación al Hogar (€)</Label>
            <div className="relative">
              <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500" />
              <Input
                id="monthlyContribution"
                type="text"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                placeholder="Ej. 600 (opcional)"
                disabled={isPending}
                className="pl-9 bg-background focus:bg-background"
              />
            </div>
          </div>
        </div>

        {/* Carga del documento Justificante/Nómina */}
        <div className="space-y-2">
          <Label htmlFor="payrollFile">Adjuntar Nómina / Justificante (Opcional)</Label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Upload className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="payrollFile"
                type="file"
                ref={fileInputRef}
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isPending}
                className="pl-9 bg-background focus:bg-background cursor-pointer file:cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-xs text-destructive hover:bg-destructive/10"
              >
                Quitar archivo
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Formatos admitidos: PDF, PNG, JPG, JPEG. Tamaño máximo de 5MB. El documento será estrictamente privado para ti.
          </p>
        </div>

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando nómina...
            </>
          ) : (
            'Registrar Nómina'
          )}
        </Button>
      </form>

      {/* Historial listado */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-foreground">Historial de Nóminas Registradas</h3>
        {sortedIncomes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            No has registrado nóminas específicas para meses anteriores. El sistema aplicará tu ingreso base por defecto.
          </p>
        ) : (
          <div className="rounded-xl border border-slate-200/50 overflow-x-auto dark:border-slate-800/50">
            <table className="w-full border-collapse text-left text-xs min-w-[440px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800/50 text-muted-foreground font-semibold">
                  <th className="p-3 whitespace-nowrap">Mes</th>
                  <th className="p-3 text-right whitespace-nowrap">Ingreso Neto</th>
                  <th className="p-3 text-right whitespace-nowrap">Aportación Hogar</th>
                  <th className="p-3 text-center whitespace-nowrap">Documento</th>
                  <th className="p-3 w-16 text-center whitespace-nowrap">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/30">
                {sortedIncomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-foreground transition-colors">
                    <td className="p-3 font-medium flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatMonthName(inc.month)}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {formatCurrency(inc.amount)}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {inc.contribution ? formatCurrency(inc.contribution) : '-'}
                    </td>
                    <td className="p-3 text-center">
                      {inc.payroll_path ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPayroll(inc.payroll_path!)}
                          disabled={isPending || downloadingId !== null}
                          className="h-7 text-[10px] gap-1 border-indigo-200 text-indigo-600 dark:border-indigo-900/50 dark:text-indigo-400 hover:bg-indigo-50/50"
                        >
                          {downloadingId === inc.payroll_path ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          Ver Nómina
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Sin documento</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(inc.id)}
                        disabled={isPending}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diálogo de Confirmación */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar este registro de ingresos y su documento asociado? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
