'use client'

import { useState } from 'react'
import { Share2, Copy, Check, MessageCircle, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n/i18n-context'

interface ShareAppModalProps {
  trigger?: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function ShareAppModal({
  trigger,
  variant = 'outline',
  size = 'sm',
  className,
}: ShareAppModalProps) {
  const { locale } = useI18n()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://controldotz.app'
  
  const shareTitle =
    locale === 'en'
      ? 'Control Dotz - Family Expense Tracker'
      : locale === 'ca'
      ? 'Control Dotz - Control de Despeses Familiars'
      : 'Control Dotz - Control de Gastos Familiares'

  const shareText =
    locale === 'en'
      ? 'Check out Control Dotz to manage household expenses, budgets, and AI receipt scanning with your family!'
      : locale === 'ca'
      ? 'Mira aquesta aplicació per gestionar les despeses de la llar, pressupostos i escàner de tiquets amb IA!'
      : '¡Prueba Control Dotz para gestionar gastos en familia, presupuestos mensuales y escáner de tickets con IA!'

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return true
      } catch (err) {
        // Si el usuario cancela la hoja de compartir o falla
        return false
      }
    }
    return false
  }

  const handleShareClick = async () => {
    const shared = await handleNativeShare()
    if (!shared) {
      // Si la API nativa no está disponible (ej. Desktop), abrimos el modal fallback
      setOpen(true)
    }
  }

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.add({
        title:
          locale === 'en'
            ? 'Link copied!'
            : locale === 'ca'
            ? 'Enllaç copiat!'
            : '¡Enlace copiado!',
        description:
          locale === 'en'
            ? 'The Control Dotz link has been copied to your clipboard.'
            : locale === 'ca'
            ? 'L\'enllaç de Control Dotz s\'ha copiat al porta-retalls.'
            : 'El enlace de Control Dotz se ha copiado al portapapeles.',
        type: 'success',
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`

  return (
    <>
      {trigger ? (
        <div onClick={handleShareClick} className="inline-block cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={handleShareClick}
          className={className || 'gap-2 rounded-xl border-border bg-background/80 hover:bg-accent text-foreground'}
          title={
            locale === 'en'
              ? 'Share Control Dotz'
              : locale === 'ca'
              ? 'Compartir Control Dotz'
              : 'Compartir Control Dotz'
          }
        >
          <Share2 className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">
            {locale === 'en' ? 'Share App' : locale === 'ca' ? 'Compartir App' : 'Compartir App'}
          </span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card text-card-foreground shadow-2xl p-6">
          <DialogHeader className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {locale === 'en' ? 'Spread the word' : locale === 'ca' ? 'Recomana Control Dotz' : 'Recomienda Control Dotz'}
              </span>
            </div>
            <DialogTitle className="text-xl font-bold font-heading flex items-center gap-2 pt-1">
              <Share2 className="w-5 h-5 text-primary" />
              {locale === 'en' ? 'Share Control Dotz' : locale === 'ca' ? 'Compartir Control Dotz' : 'Compartir Control Dotz'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'en'
                ? 'Recommend Control Dotz to your friends and family so they can easily track household expenses.'
                : locale === 'ca'
                ? 'Recomana Control Dotz als teus amics i familiars per a gestionar les despeses de la llar.'
                : 'Recomienda Control Dotz a tus amigos o conocidos para que coordinen los gastos del hogar con facilidad.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Input con Copiar Enlace */}
            <div className="flex items-center gap-2 bg-muted/60 p-2 rounded-xl border border-border">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs font-mono flex-1 outline-none text-foreground px-2"
              />
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="h-8 rounded-lg text-xs gap-1.5 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copied
                  ? locale === 'en'
                    ? 'Copied'
                    : locale === 'ca'
                    ? 'Copiat'
                    : 'Copiado'
                  : locale === 'en'
                  ? 'Copy'
                  : locale === 'ca'
                  ? 'Copiar'
                  : 'Copiar'}
              </Button>
            </div>

            {/* Accesos directos a Redes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all shadow-2xs"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                WhatsApp
              </a>
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold transition-all shadow-2xs"
              >
                <Send className="w-4 h-4 shrink-0" />
                Telegram
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
