'use client'

import * as React from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'

interface MonthSelectorProps {
  defaultMonth: string
}

export function MonthSelector({ defaultMonth }: MonthSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (newMonth) {
      params.set('month', newMonth)
    } else {
      params.delete('month')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <input
        type="month"
        name="month"
        defaultValue={defaultMonth}
        onChange={handleMonthChange}
        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring text-foreground"
      />
    </div>
  )
}
