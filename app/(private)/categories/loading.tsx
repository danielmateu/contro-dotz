import React from 'react'
import { Card } from '@/components/ui/card'

export default function CategoriesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-primary/20 rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-4 border-border/40 bg-card/60 rounded-2xl space-y-4 lg:col-span-1 h-fit">
          <div className="h-4 w-36 bg-muted/60 rounded-md" />
          <div className="space-y-3">
            <div className="h-9 w-full bg-muted/40 rounded-xl" />
            <div className="h-9 w-full bg-muted/40 rounded-xl" />
            <div className="h-9 w-full bg-primary/20 rounded-xl" />
          </div>
        </Card>

        <Card className="p-5 border-border/40 bg-card/60 rounded-3xl space-y-4 lg:col-span-2">
          <div className="h-5 w-40 bg-muted/60 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-3.5 border border-border/30 rounded-2xl flex items-center justify-between bg-muted/10">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-muted/50" />
                  <div className="h-4 w-20 bg-muted/60 rounded-md" />
                </div>
                <div className="h-6 w-6 rounded-full bg-muted/30" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
