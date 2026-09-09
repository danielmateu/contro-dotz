'use client'

import React, { useState } from 'react'
import { sendHouseholdReportAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SendReportButtonProps {
  householdId: string
  compact?: boolean
}

export function SendReportButton({ householdId, compact }: SendReportButtonProps) {
  const { locale } = useI18n()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSendReport = async () => {
    if (status === 'loading') return

    setStatus('loading')
    setMessage(null)

    try {
      const res = await sendHouseholdReportAction(householdId)
      if (res.error) {
        setStatus('error')
        setMessage(res.error)
        toast.add({
          title: locale === 'en' ? 'Failed to send' : locale === 'ca' ? 'Error en enviar' : 'Error al enviar',
          description: res.error,
          type: 'error',
        })
      } else {
        setStatus('success')
        const successMsg = res.success || (
          locale === 'en'
            ? 'Family report sent successfully to all members!'
            : locale === 'ca'
              ? '¡Informe familiar enviat amb èxit a tots els membres!'
              : '¡Informe familiar enviado con éxito a todos los miembros!'
        )
        setMessage(successMsg)
        toast.add({
          title: locale === 'en' ? 'Report sent!' : locale === 'ca' ? '¡Informe enviat!' : '¡Informe enviado!',
          description: successMsg,
          type: 'success',
        })
        setTimeout(() => {
          setStatus('idle')
          setMessage(null)
        }, 5000)
      }
    } catch (err) {
      console.error('Error sending report:', err)
      setStatus('error')
      const errMsg = locale === 'en'
        ? 'Network error while attempting to send the report.'
        : locale === 'ca'
          ? 'Error de xarxa en intentar enviar l\'informe.'
          : 'Error de red al intentar enviar el reporte.'
      setMessage(errMsg)
      toast.add({
        title: locale === 'en' ? 'Failed to send' : locale === 'ca' ? 'Error en enviar' : 'Error al enviar',
        description: errMsg,
        type: 'error',
      })
    }
  }

  const tooltipTitle =
    locale === 'en'
      ? 'Email Family Report'
      : locale === 'ca'
        ? 'Informe Familiar per Email'
        : 'Informe Familiar por Email'

  const tooltipDescription =
    locale === 'en'
      ? 'Sends a summary of monthly expenses and financial health by email to all household members.'
      : locale === 'ca'
        ? 'Envia un resum de despeses mensuals i salut financera per correu a tots els membres de la llar.'
        : 'Envía un resumen de gastos mensuales y salud financiera por email a todos los miembros del hogar.'

  return (
    <div className={compact ? "relative" : "space-y-4"}>
      {!compact && status === 'success' && message && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <AlertTitle>
            {locale === 'en' ? 'Success' : locale === 'ca' ? 'Èxit' : 'Éxito'}
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {!compact && status === 'error' && message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {locale === 'en' ? 'Send Failed' : locale === 'ca' ? 'Error en enviar' : 'Error al enviar'}
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={
            <Button
              onClick={handleSendReport}
              disabled={status === 'loading'}
              variant={compact ? "outline" : "default"}
              className={compact ? "h-9 px-3 rounded-xl border-slate-200/50 hover:bg-muted/50 dark:border-slate-800/50" : "w-full sm:w-auto"}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {!compact && (
                    <span className="ml-2">
                      {locale === 'en' ? 'Sending reports...' : locale === 'ca' ? 'Enviant informes...' : 'Enviando reportes...'}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  {!compact ? (
                    <span className="ml-2">
                      {locale === 'en' ? 'Send Family Report by Email' : locale === 'ca' ? 'Enviar Informe Familiar per Email' : 'Enviar Informe Familiar por Email'}
                    </span>
                  ) : (
                    <span className="ml-2 hidden sm:inline text-xs font-semibold">
                      {locale === 'en' ? 'Send Report' : locale === 'ca' ? 'Enviar Informe' : 'Enviar Informe'}
                    </span>
                  )}
                </>
              )}
            </Button>
          } />
          <TooltipContent side="bottom" align={compact ? "center" : "center"} className="max-w-xs">
            <div className="space-y-1 text-left">
              <p className="font-semibold text-xs">{tooltipTitle}</p>
              <p className="text-[11px] text-muted-foreground leading-normal font-normal">
                {tooltipDescription}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

