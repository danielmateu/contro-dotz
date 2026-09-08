import React from 'react'
import { Card } from '@/components/ui/card'

export default function ExpensesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header con título y botón de Añadir Gasto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-emerald-500/20 rounded-xl" />
      </div>

      {/* Barra de Filtros (Fecha, Categoría, Miembro, Orden) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-card/60 border border-border/40 rounded-xl" />
        ))}
      </div>

      {/* Tabla de Gastos */}
      <Card className="border-border/40 bg-card/60 rounded-3xl overflow-hidden p-4 space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-border/40">
          <div className="h-4 w-32 bg-muted/50 rounded-md" />
          <div className="h-4 w-20 bg-muted/40 rounded-md" />
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-muted/15 rounded-2xl gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-xl bg-muted/50 shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="h-4 w-1/3 bg-muted/60 rounded-md" />
                <div className="h-3 w-1/4 bg-muted/30 rounded-md" />
              </div>
            </div>
            <div className="h-4 w-16 bg-muted/40 rounded-md shrink-0" />
            <div className="h-6 w-20 bg-muted/50 rounded-lg shrink-0" />
          </div>
        ))}
      </Card>
    </div>
  )
}
