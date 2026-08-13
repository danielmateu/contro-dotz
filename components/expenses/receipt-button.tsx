'use client'

import { createClient } from '@/lib/supabase/client'
import { Receipt, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ReceiptButtonProps {
  receiptPath: string
}

export function ReceiptButton({ receiptPath }: ReceiptButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage
        .from('receipts')
        .createSignedUrl(receiptPath, 300) // Válido por 5 minutos
      
      if (error) {
        console.error('Error generating signed URL:', error)
        alert('No se pudo acceder al ticket.')
        return
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      } else {
        alert('No se pudo obtener el enlace del ticket.')
      }
    } catch (err) {
      console.error(err)
      alert('Error inesperado al intentar abrir el ticket.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 p-0 transition-colors"
      onClick={handleOpen}
      disabled={loading}
      title="Ver ticket de compra"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
      ) : (
        <Receipt className="h-4 w-4 text-emerald-500" />
      )}
    </Button>
  )
}
