import React from 'react'
import { Card } from '@/components/ui/card'

export default function HouseholdLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-primary/20 rounded-xl" />
      </div>

      {/* Living room / Dotzi Room Banner Skeleton */}
      <Card className="h-64 border-border/40 bg-linear-to-b from-indigo-950/20 to-amber-500/10 rounded-3xl p-6 flex items-end justify-around">
        <div className="h-28 w-24 bg-muted/40 rounded-full" />
        <div className="h-28 w-24 bg-muted/40 rounded-full" />
      </Card>

      {/* Miembros del hogar */}
      <Card className="p-5 border-border/40 bg-card/60 rounded-3xl space-y-4">
        <div className="h-5 w-40 bg-muted/60 rounded-md" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/15 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted/50" />
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-muted/60 rounded-md" />
                  <div className="h-3 w-40 bg-muted/30 rounded-md" />
                </div>
              </div>
              <div className="h-6 w-20 bg-emerald-500/20 rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
