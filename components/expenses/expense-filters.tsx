'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5 items-end">
        {/* Fecha Inicio */}
        <div className="space-y-1">
          <Label htmlFor="startDate" className="text-xs">
            Fecha Inicio
          </Label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => updateFilters('startDate', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-muted/40 px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Fecha Fin */}
        <div className="space-y-1">
          <Label htmlFor="endDate" className="text-xs">
            Fecha Fin
          </Label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => updateFilters('endDate', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-muted/40 px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          />
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
            <SelectTrigger id="filterCategory" className="w-full bg-muted/40 h-9">
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
            items={[{ value: '', label: 'Todos los miembros' }, ...members.map((mem) => ({ value: mem.user_id, label: mem.profiles?.display_name || 'Desconocido' }))]}
          >
            <SelectTrigger id="filterMember" className="w-full bg-muted/40 h-9">
              <SelectValue placeholder="Todos los miembros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los miembros</SelectItem>
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
            <SelectTrigger id="sortBy" className="w-full bg-muted/40 h-9">
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
