'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface MonthSelectorProps {
  defaultMonth: string
}

const MONTHS_ES = [
  { val: 1, label: 'Ene' },
  { val: 2, label: 'Feb' },
  { val: 3, label: 'Mar' },
  { val: 4, label: 'Abr' },
  { val: 5, label: 'May' },
  { val: 6, label: 'Jun' },
  { val: 7, label: 'Jul' },
  { val: 8, label: 'Ago' },
  { val: 9, label: 'Sep' },
  { val: 10, label: 'Oct' },
  { val: 11, label: 'Nov' },
  { val: 12, label: 'Dic' },
]

export function MonthSelector({ defaultMonth }: MonthSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [open, setOpen] = React.useState(false)

  // Parsear mes por defecto (YYYY-MM)
  const [selectedYear, setSelectedYear] = React.useState(() => {
    const parts = defaultMonth.split('-')
    return parseInt(parts[0]) || new Date().getFullYear()
  })

  const [selectedMonth, setSelectedMonth] = React.useState(() => {
    const parts = defaultMonth.split('-')
    return parseInt(parts[1]) || new Date().getMonth() + 1
  })

  // Sincronizar estados si cambia la prop defaultMonth
  React.useEffect(() => {
    const parts = defaultMonth.split('-')
    const y = parseInt(parts[0])
    const m = parseInt(parts[1])
    if (y) setSelectedYear(y)
    if (m) setSelectedMonth(m)
  }, [defaultMonth])

  const handleMonthSelect = (mVal: number) => {
    setSelectedMonth(mVal)
    setOpen(false)
    const monthStr = mVal.toString().padStart(2, '0')
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', `${selectedYear}-${monthStr}`)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleYearChange = (offset: number) => {
    setSelectedYear((prev) => prev + offset)
  }

  const handleSelectCurrent = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth() + 1
    setSelectedYear(y)
    setSelectedMonth(m)
    setOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', `${y}-${m.toString().padStart(2, '0')}`)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Nombre formateado en letras para mostrar en el botón trigger
  const displayLabel = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          className="flex h-9 items-center justify-between gap-2 px-3 py-1 text-sm font-medium border border-input rounded-md bg-background hover:bg-muted select-none capitalize text-foreground"
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{displayLabel}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rotate-90 ml-1 shrink-0" />
        </Button>
      } />

      <PopoverContent className="w-64 p-3 bg-popover text-popover-foreground rounded-lg border border-border shadow-md select-none">
        {/* Cabecera del Año */}
        <div className="flex items-center justify-between border-b pb-2 mb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => handleYearChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-bold text-sm text-foreground">{selectedYear}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => handleYearChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid de Meses */}
        <div className="grid grid-cols-4 gap-2">
          {MONTHS_ES.map((m) => {
            const isSelected = selectedMonth === m.val
            return (
              <button
                key={m.val}
                type="button"
                onClick={() => handleMonthSelect(m.val)}
                className={`h-9 rounded-md text-xs font-semibold flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Acciones del pie */}
        <div className="flex items-center justify-between border-t pt-2 mt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded hover:bg-muted"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={handleSelectCurrent}
            className="text-xs text-primary hover:text-primary/80 font-bold px-2 py-1 rounded hover:bg-primary/10"
          >
            Este mes
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
