import React from 'react'
import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-1 sm:p-2">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-muted/50 rounded-xl" />
          <div className="h-9 w-32 bg-muted/50 rounded-xl" />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-3 border-border/40 bg-card/40">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted/50 rounded-md" />
              <div className="h-8 w-8 bg-muted/60 rounded-lg" />
            </div>
            <div className="h-7 w-32 bg-muted/70 rounded-lg" />
            <div className="h-3 w-20 bg-muted/40 rounded-sm" />
          </Card>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="p-5 border-border/40 bg-card/40 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-muted/60 rounded-md" />
            <div className="h-4 w-24 bg-muted/40 rounded-md" />
          </div>
          <div className="h-64 w-full bg-muted/30 rounded-2xl" />
        </Card>
        <Card className="p-5 border-border/40 bg-card/40 space-y-4 lg:col-span-1">
          <div className="h-5 w-36 bg-muted/60 rounded-md" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-muted/30 rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
