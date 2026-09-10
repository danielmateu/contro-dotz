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
import { MessageSquarePlus, Send, CheckCircle2, Sparkles, MessageCircleDashed } from 'lucide-react'
import { sendFeedbackAction } from '@/app/actions/feedback'
import { useI18n } from '@/lib/i18n/i18n-context'

interface FeatureBaseWidgetProps {
  userEmail?: string
  userName?: string
  className?: string
  trigger?: React.ReactElement
}

export function FeatureBaseWidget({ className, trigger }: FeatureBaseWidgetProps) {
  const { t } = useI18n()
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
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={`rounded-xl border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-semibold gap-2 transition-all active:scale-95 ${className}`}
            >
              <MessageSquarePlus className="h-4 w-4 text-violet-400" />
              <span className="hidden lg:inline">Feedback</span>
            </Button>
          }
        />
      )}

      <DialogContent className="sm:max-w-md  border-slate-800 text-foreground rounded-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 mb-1">
            <MessageCircleDashed className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-bold font-heading">
            {t('feedback.title')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('feedback.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-foreground">{t('feedback.thankYou')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('feedback.submittedDesc')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('feedback.requestType')}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={category === 'feature' ? 'default' : 'outline'}
                  onClick={() => setCategory('feature')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    category === 'feature'
                      ? 'bg-violet-600 hover:bg-violet-500 text-white border-violet-500 shadow-md font-bold'
                      : 'border-slate-700/80 bg-transparent text-muted-foreground hover:text-foreground hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  {t('feedback.newIdea')}
                </Button>
                <Button
                  type="button"
                  variant={category === 'bug' ? 'default' : 'outline'}
                  onClick={() => setCategory('bug')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    category === 'bug'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md font-bold'
                      : 'border-slate-700/80 bg-transparent text-muted-foreground hover:text-foreground hover:bg-slate-800/50'
                  }`}
                >
                  {t('feedback.bug')}
                </Button>
                <Button
                  type="button"
                  variant={category === 'other' ? 'default' : 'outline'}
                  onClick={() => setCategory('other')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    category === 'other'
                      ? 'bg-slate-600 hover:bg-slate-500 text-white border-slate-500 shadow-md font-bold'
                      : 'border-slate-700/80 bg-transparent text-muted-foreground hover:text-foreground hover:bg-slate-800/50'
                  }`}
                >
                  {t('feedback.other')}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">{t('feedback.shortTitle')}</Label>
              <Input
                id="title"
                placeholder={t('feedback.shortTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className=" border-slate-700 rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feedback" className="text-xs font-semibold">{t('feedback.details')}</Label>
              <Textarea
                id="feedback"
                placeholder={t('feedback.detailsPlaceholder')}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                required
                className=" border-slate-700 rounded-xl text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim() || !feedback.trim()}
                className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs gap-2"
              >
                {loading ? (
                  t('common.loading')
                ) : (
                  <>
                    <span>{t('feedback.sendFeedback')}</span>
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
