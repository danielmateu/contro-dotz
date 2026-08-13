'use client'

import React, { useState } from 'react'
import { sendHouseholdReportAction } from '@/app/actions/household'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Mail, Loader2, Check, AlertCircle } from 'lucide-react'

interface SendReportButtonProps {
  householdId: string
}

export function SendReportButton({ householdId }: SendReportButtonProps) {
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
    <div className="space-y-4">
      {status === 'success' && message && (
        <Alert className="border-emerald-500/50 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {status === 'error' && message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al enviar</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSendReport}
        disabled={status === 'loading'}
        className="w-full sm:w-auto"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Enviando reportes...
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Enviar Informe Familiar por Email
          </>
        )}
      </Button>
    </div>
  )
}
