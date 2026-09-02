'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquarePlus, Send, CheckCircle2, Sparkles } from 'lucide-react'
import { sendFeedbackAction } from '@/app/actions/feedback'

interface FeatureBaseWidgetProps {
  userEmail?: string
  userName?: string
  className?: string
}

export function FeatureBaseWidget({ className }: FeatureBaseWidgetProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [feedback, setFeedback] = useState('')
  const [category, setCategory] = useState<'feature' | 'bug' | 'other'>('feature')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !feedback.trim()) return

    setLoading(true)

    const res = await sendFeedbackAction({
      title,
      description: feedback,
      category,
    })

    setLoading(false)

    if (res.success) {
      setSubmitted(true)
      setTimeout(() => {
        setOpen(false)
        setSubmitted(false)
        setTitle('')
        setFeedback('')
      }, 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={`rounded-xl border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-semibold gap-2 transition-all active:scale-95 ${className}`}
          >
            <MessageSquarePlus className="h-4 w-4 text-violet-400" />
            <span className="hidden sm:inline">Feedback / Sugerencias</span>
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-foreground rounded-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mb-1">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-bold font-heading">
            Envíanos tu Feedback o Sugerencia
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            ¿Qué te gustaría ver en Control Dotz o qué podemos mejorar? Tu opinión es clave.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-foreground">¡Muchas gracias!</h3>
            <p className="text-xs text-muted-foreground">
              Hemos recibido tu sugerencia correctamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Petición</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('feature')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    category === 'feature'
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  💡 Nueva Idea
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('bug')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    category === 'bug'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  🐛 Error / Bug
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('other')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    category === 'other'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  💬 Otro
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">Título breve</Label>
              <Input
                id="title"
                placeholder="Ej. Exportar informe mensual en PDF..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-slate-800/60 border-slate-700 rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feedback" className="text-xs font-semibold">Detalles de la sugerencia</Label>
              <Textarea
                id="feedback"
                placeholder="Explica qué necesitas y cómo te gustaría que funcionase..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                required
                className="bg-slate-800/60 border-slate-700 rounded-xl text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim() || !feedback.trim()}
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs gap-2"
              >
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <span>Enviar Feedback</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
