'use client'

import React, { useState } from 'react'
import { sendHouseholdReportAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react'

interface SendReportButtonProps {
  householdId: string
  compact?: boolean
}

export function SendReportButton({ householdId, compact }: SendReportButtonProps) {
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
      } else {
        setStatus('success')
        setMessage(res.success || '¡Informe enviado con éxito a todos los miembros!')
        setTimeout(() => {
          setStatus('idle')
          setMessage(null)
        }, 5000)
      }
    } catch (err) {
      console.error('Error sending report:', err)
      setStatus('error')
      setMessage('Error de red al intentar enviar el reporte.')
    }
  }

  return (
    <div className={compact ? "relative" : "space-y-4"}>
      {status === 'success' && message && !compact && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {status === 'error' && message && !compact && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al enviar</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Alerta flotante compacta si ocurre éxito/error en modo compacto */}
      {compact && message && (
        <div className={`absolute bottom-full right-0 mb-2 z-50 p-3.5 rounded-xl border shadow-lg text-xs w-64 leading-normal ${
          status === 'success'
            ? 'bg-emerald-50 border-emerald-500/30 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-500/20 dark:text-emerald-400'
            : 'bg-rose-50 border-rose-500/30 text-rose-700 dark:bg-rose-950 dark:border-rose-500/20 dark:text-rose-400'
        }`}>
          <div className="flex gap-2">
            {status === 'success' ? (
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            )}
            <div>
              <p className="font-bold">{status === 'success' ? 'Éxito' : 'Error al enviar'}</p>
              <p className="mt-0.5">{message}</p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleSendReport}
        disabled={status === 'loading'}
        variant={compact ? "outline" : "default"}
        className={compact ? "h-9 px-3 rounded-xl border-slate-200/50 hover:bg-muted/50 dark:border-slate-800/50" : "w-full sm:w-auto"}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {!compact && <span className="ml-2">Enviando reportes...</span>}
          </>
        ) : (
          <>
            <Mail className="h-4 w-4" />
            {!compact ? (
              <span className="ml-2">Enviar Informe Familiar por Email</span>
            ) : (
              <span className="ml-2 hidden sm:inline text-xs font-semibold">Enviar Informe</span>
            )}
          </>
        )}
      </Button>
    </div>
  )
}
