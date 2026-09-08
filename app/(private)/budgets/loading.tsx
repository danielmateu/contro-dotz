import React from 'react'
import { Card } from '@/components/ui/card'

export default function BudgetsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header con Selector de Ámbito y Mes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-muted/60 rounded-xl" />
          <div className="h-4 w-80 bg-muted/40 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-48 bg-muted/50 rounded-xl" />
          <div className="h-9 w-36 bg-muted/50 rounded-xl" />
        </div>
      </div>

      {/* Grid: Formulario lateral + Rejilla de 2 columnas de Tarjetas */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario lateral */}
        <Card className="p-4 border-border/40 bg-card/60 rounded-2xl space-y-4 lg:col-span-1 h-fit">
          <div className="h-4 w-40 bg-muted/60 rounded-md" />
          <div className="space-y-3">
            <div className="h-9 w-full bg-muted/40 rounded-xl" />
            <div className="h-9 w-full bg-muted/40 rounded-xl" />
            <div className="h-9 w-full bg-primary/20 rounded-xl" />
          </div>
        </Card>

        {/* Rejilla de Presupuestos de 2 Columnas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-border/40 bg-card/60 rounded-3xl space-y-4">
            <div className="h-5 w-48 bg-muted/60 rounded-md" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4 border border-border/30 rounded-2xl space-y-3 bg-muted/10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-muted/50" />
                      <div className="h-4 w-24 bg-muted/60 rounded-md" />
                    </div>
                    <div className="h-6 w-6 rounded-full bg-muted/40" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-4 w-20 bg-muted/40 rounded-md" />
                    <div className="h-5 w-16 bg-muted/50 rounded-md" />
                  </div>
                  <div className="h-2.5 w-full bg-muted/30 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
