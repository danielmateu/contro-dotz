'use client'

import { useActionState, useState, useEffect } from 'react'
import { createCategoryAction, updateCategoryAction } from '@/app/actions/category'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { AlertCircle, Tag, Check, LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'

// Paleta de colores predefinida
const COLORS = [
  '#ef4444', // Rojo
  '#3b82f6', // Azul
  '#f59e0b', // Ámbar
  '#10b981', // Verde
  '#8b5cf6', // Púrpura
  '#ec4899', // Rosa
  '#6366f1', // Índigo
  '#14b8a6', // Teal
  '#f43f5e', // Rosa fuerte (Rose)
  '#06b6d4', // Cian
  '#64748b', // Slate
  '#78350f', // Marrón
]

// Iconos sugeridos mapeados
const ICONS = [
  'Tag',
  'Utensils',
  'Home',
  'Car',
  'HeartPulse',
  'GraduationCap',
  'Sparkles',
  'Shirt',
  'Tv',
  'Pizza',
  'ShoppingBag',
  'Gamepad2',
  'Gift',
  'Briefcase',
  'Plane',
  'Wrench',
]

interface CategoryDialogProps {
  householdId?: string // Requerido para crear
  category?: {
    id: string
    name: string
    color: string
    icon: string
  } // Requerido para editar
  trigger: React.ReactElement
}

type FormState = {
  error?: string
  success?: string
}

const initialState: FormState = {}

export function CategoryDialog({
  householdId,
  category,
  trigger,
}: CategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(
    category?.color || COLORS[0]
  )
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || ICONS[0])

  const action = category
    ? updateCategoryAction.bind(null, category.id)
    : createCategoryAction.bind(null, householdId!)

  const [state, formAction, pending] = useActionState(action, initialState)

  // Cerrar el modal cuando la acción tiene éxito
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        setOpen(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state])

  // Resetear estados al abrir para crear
  useEffect(() => {
    if (open && !category) {
      setSelectedColor(COLORS[0])
      setSelectedIcon(ICONS[0])
    }
  }, [open, category])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            {category
              ? 'Personaliza el nombre, color e icono de esta categoría.'
              : 'Crea una categoría personalizada para clasificar tus gastos.'}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <div className="space-y-4 py-2">
            {state?.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
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

            {/* Nombre */}
            <div className="space-y-1">
              <Label htmlFor="name">Nombre de categoría</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Ej. Mascotas, Gimnasio"
                defaultValue={category?.name || ''}
                required
                className="bg-muted/50 focus:bg-background"
              />
            </div>

            {/* Selector de color */}
            <div className="space-y-1.5">
              <Label>Color de etiqueta</Label>
              <input type="hidden" name="color" value={selectedColor} />
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="h-7 w-7 rounded-full flex items-center justify-center border hover:scale-105 active:scale-95 transition-all shadow-xs"
                    style={{ backgroundColor: c, borderColor: selectedColor === c ? '#000' : 'transparent' }}
                    aria-label={`Seleccionar color ${c}`}
                  >
                    {selectedColor === c && (
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de icono */}
            <div className="space-y-1.5">
              <Label>Icono representativo</Label>
              <input type="hidden" name="icon" value={selectedIcon} />
              <div className="grid grid-cols-8 gap-2 border border-slate-200/50 dark:border-slate-800/50 p-2 rounded-xl bg-muted/20">
                {ICONS.map((i) => {
                  const LucideIconComp = (Icons as any)[i] as LucideIcon
                  const isSelected = selectedIcon === i
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedIcon(i)}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all active:scale-95 hover:bg-muted ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-transparent text-muted-foreground'
                      }`}
                      title={i}
                      aria-label={`Seleccionar icono ${i}`}
                    >
                      {LucideIconComp ? (
                        <LucideIconComp className="h-4 w-4" />
                      ) : (
                        <Tag className="h-4 w-4" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose render={<Button variant="outline" type="button">Cancelar</Button>} />
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando...' : 'Guardar Categoría'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
