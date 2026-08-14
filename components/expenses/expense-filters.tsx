'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'

interface Category {
  id: string
  name: string
}

interface Member {
  user_id: string
  profiles: {
    display_name: string | null
  } | null
}

interface ExpenseFiltersProps {
  categories: Category[]
  members: Member[]
}

export function ExpenseFilters({ categories, members }: ExpenseFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Leer filtros activos
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const memberId = searchParams.get('memberId') || ''
  const sortBy = searchParams.get('sortBy') || 'date_desc'

  // Convertir strings de la URL a Date para el calendario
  const calendarRange: DateRange | undefined = {
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  }

  const handleRangeChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString())

    if (range?.from) {
      const yyyy = range.from.getFullYear()
      const mm = String(range.from.getMonth() + 1).padStart(2, '0')
      const dd = String(range.from.getDate()).padStart(2, '0')
      params.set('startDate', `${yyyy}-${mm}-${dd}`)
    } else {
      params.delete('startDate')
    }

    if (range?.to) {
      const yyyy = range.to.getFullYear()
      const mm = String(range.to.getMonth() + 1).padStart(2, '0')
      const dd = String(range.to.getDate()).padStart(2, '0')
      params.set('endDate', `${yyyy}-${mm}-${dd}`)
    } else {
      params.delete('endDate')
    }

    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Volver a la primera página si hubiera paginación
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasActiveFilters =
    startDate || endDate || categoryId || memberId || sortBy !== 'date_desc'

  return (
    <div className="p-4 border border-slate-200/50 rounded-2xl bg-background shadow-xs dark:border-slate-800/50 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* Rango de Fechas */}
        <div className="space-y-1">
          <Label className="text-xs">Rango de Fechas</Label>
          <Popover>
            <PopoverTrigger render={
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-muted/40 border border-input rounded-md px-3 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
                  (!startDate && !endDate) && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {startDate ? (
                  endDate ? (
                    <span className="truncate">
                      {format(new Date(startDate), "dd/MM/yyyy", { locale: es })} - {format(new Date(endDate), "dd/MM/yyyy", { locale: es })}
                    </span>
                  ) : (
                    <span>
                      {format(new Date(startDate), "dd/MM/yyyy", { locale: es })}
                    </span>
                  )
                ) : (
                  <span>Seleccionar fechas</span>
                )}
              </Button>
            } />
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={calendarRange}
                onSelect={handleRangeChange}
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Filtrar por Categoría */}
        <div className="space-y-1">
          <Label htmlFor="filterCategory" className="text-xs">
            Categoría
          </Label>
          <Select
            value={categoryId}
            onValueChange={(val) => updateFilters('categoryId', val || '')}
            items={[{ value: '', label: 'Todas las categorías' }, ...categories.map((cat) => ({ value: cat.id, label: cat.name }))]}
          >
            <SelectTrigger id="filterCategory" className="w-full bg-muted/40">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtrar por Miembro */}
        <div className="space-y-1">
          <Label htmlFor="filterMember" className="text-xs">
            Miembro
          </Label>
          <Select
            value={memberId}
            onValueChange={(val) => updateFilters('memberId', val || '')}
            items={[
              { value: '', label: 'Todos los miembros' },
              { value: 'shared', label: 'A medias / Compartido' },
              ...members.map((mem) => ({ value: mem.user_id, label: mem.profiles?.display_name || 'Desconocido' }))
            ]}
          >
            <SelectTrigger id="filterMember" className="w-full bg-muted/40">
              <SelectValue placeholder="Todos los miembros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los miembros</SelectItem>
              <SelectItem value="shared">A medias / Compartido</SelectItem>
              {members.map((mem) => (
                <SelectItem key={mem.user_id} value={mem.user_id}>
                  {mem.profiles?.display_name || 'Desconocido'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ordenación */}
        <div className="space-y-1">
          <Label htmlFor="sortBy" className="text-xs">
            Ordenar por
          </Label>
          <Select
            value={sortBy}
            onValueChange={(val) => updateFilters('sortBy', val || 'date_desc')}
            items={[
              { value: 'date_desc', label: 'Fecha (recientes primero)' },
              { value: 'date_asc', label: 'Fecha (antiguos primero)' },
              { value: 'amount_desc', label: 'Importe (mayor primero)' },
              { value: 'amount_asc', label: 'Importe (menor primero)' },
            ]}
          >
            <SelectTrigger id="sortBy" className="w-full bg-muted/40">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Fecha (recientes primero)</SelectItem>
              <SelectItem value="date_asc">Fecha (antiguos primero)</SelectItem>
              <SelectItem value="amount_desc">Importe (mayor primero)</SelectItem>
              <SelectItem value="amount_asc">Importe (menor primero)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
