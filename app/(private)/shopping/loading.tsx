
import { Card } from '@/components/ui/card'

export default function ShoppingLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/60 rounded-xl" />
          <div className="h-4 w-72 bg-muted/40 rounded-lg" />
        </div>
      </div>

      <Card className="p-5 border-border/40 bg-card/60 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-10 flex-1 bg-muted/30 border border-border/40 rounded-xl" />
          <div className="h-10 w-28 bg-emerald-500/20 rounded-xl shrink-0" />
        </div>

        <div className="space-y-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/15 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-md bg-muted/40" />
                <div className="h-4 w-40 bg-muted/60 rounded-md" />
              </div>
              <div className="h-6 w-6 rounded-lg bg-muted/30" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
