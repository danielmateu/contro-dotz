'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Save } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface SaveBudgetFormProps {
  categories: Category[]
  month: string
  action: (prevState: any, formData: FormData) => Promise<any>
}

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export function SaveBudgetForm({
  categories,
  month,
  action,
}: SaveBudgetFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Limpiar formulario al guardar con éxito
  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset()
    }
  }, [state])

  return (
    <form
      ref={formRef}
      action={formAction}
      className="p-4 border border-slate-200/50 rounded-2xl bg-background shadow-sm dark:border-slate-800/50 space-y-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold text-foreground font-heading">
          Asignar o Modificar Presupuesto
        </h3>
        <p className="text-xs text-muted-foreground">
          Define el importe mensual máximo para controlar el gasto por categorías.
        </p>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <AlertTitle>Guardado</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      )}

      {/* Mes oculto pre-seleccionado */}
      <input type="hidden" name="month" value={month} />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Categoría */}
        <div className="space-y-1">
          <Label htmlFor="category_id" className="text-xs">
            Categoría
          </Label>
          <Select name="category_id" defaultValue="" items={categories.map((cat) => ({ value: cat.id, label: cat.name }))}>
            <SelectTrigger id="category_id" className="w-full bg-muted/40 h-9">
              <SelectValue placeholder="-- Selecciona categoría --" />
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

        {/* Límite Importe */}
        <div className="space-y-1">
          <Label htmlFor="amount" className="text-xs">
            Límite Mensual (€)
          </Label>
          <Input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="Ej: 200,00"
            required
            className="bg-muted/40 focus:bg-background h-9"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full h-9">
        <Save className="mr-2 h-4 w-4" />
        {pending ? 'Guardando...' : 'Establecer Presupuesto'}
      </Button>
    </form>
  )
}
