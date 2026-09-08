import React from 'react'
import { Card } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header y Tamagotchi Hero Banner Skeleton */}
      <div className="h-36 sm:h-40 w-full bg-linear-to-r from-violet-950/20 via-indigo-900/10 to-emerald-500/10 rounded-3xl border border-border/40 p-4 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-muted/60 rounded-xl" />
          <div className="h-4 w-60 bg-muted/40 rounded-lg" />
          <div className="h-4 w-32 bg-muted/30 rounded-lg" />
        </div>
        <div className="h-24 w-24 rounded-full bg-muted/50 shrink-0" />
      </div>

      {/* 4 KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-3 border-border/40 bg-card/60 rounded-2xl">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted/50 rounded-md" />
              <div className="h-7 w-7 bg-muted/60 rounded-xl" />
            </div>
            <div className="h-7 w-32 bg-muted/70 rounded-lg" />
            <div className="h-3.5 w-20 bg-muted/40 rounded-sm" />
          </Card>
        ))}
      </div>

      {/* Gráficos y Actividad Reciente */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="p-5 border-border/40 bg-card/60 space-y-4 lg:col-span-2 rounded-3xl">
          <div className="flex justify-between items-center">
            <div className="h-5 w-44 bg-muted/60 rounded-md" />
            <div className="h-8 w-48 bg-muted/40 rounded-xl" />
          </div>
          <div className="h-72 w-full bg-muted/30 rounded-2xl" />
        </Card>

        <Card className="p-5 border-border/40 bg-card/60 space-y-4 lg:col-span-1 rounded-3xl">
          <div className="h-5 w-36 bg-muted/60 rounded-md" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-muted/20 rounded-xl">
                <div className="h-8 w-8 rounded-full bg-muted/50 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 bg-muted/50 rounded-md" />
                  <div className="h-3 w-1/2 bg-muted/30 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
