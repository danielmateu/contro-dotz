import React from 'react'
import { Card } from '@/components/ui/card'

export default function SavingGoalsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-52 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-10 w-40 bg-amber-500/20 rounded-xl" />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 border-border/40 bg-card/60 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-muted/50" />
                <div className="space-y-1">
                  <div className="h-4 w-28 bg-muted/60 rounded-md" />
                  <div className="h-3 w-16 bg-muted/30 rounded-md" />
                </div>
              </div>
              <div className="h-7 w-7 rounded-full bg-muted/40" />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <div className="h-4 w-20 bg-muted/40 rounded-md" />
                <div className="h-4 w-24 bg-muted/50 rounded-md" />
              </div>
              <div className="h-3 w-full bg-muted/30 rounded-full" />
            </div>

            <div className="h-9 w-full bg-muted/40 rounded-xl pt-2" />
          </Card>
        ))}
      </div>
    </div>
  )
}
