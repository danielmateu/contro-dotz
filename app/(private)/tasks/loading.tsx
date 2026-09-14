import React from 'react'
import { Card } from '@/components/ui/card'

export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header con título y botón */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-blue-500/20 rounded-xl" />
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-2 border-border/40 bg-card/60 rounded-2xl">
            <div className="h-4 w-24 bg-muted/50 rounded-md" />
            <div className="h-7 w-16 bg-muted/70 rounded-lg" />
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="h-10 bg-card/60 border border-border/40 rounded-2xl w-full" />

      {/* Cards List Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-3 border-border/40 bg-card/60 rounded-2xl">
            <div className="h-5 w-3/4 bg-muted/60 rounded-md" />
            <div className="h-3.5 w-1/2 bg-muted/40 rounded-md" />
            <div className="flex gap-2 pt-2">
              <div className="h-5 w-16 bg-muted/50 rounded-lg" />
              <div className="h-5 w-16 bg-muted/40 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
