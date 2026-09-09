'use client'

import { useTransition, useState } from 'react'
import { deleteCategoryAction } from '@/app/actions/category'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useI18n } from '@/lib/i18n/i18n-context'
import { AlertCircle, Trash2 } from 'lucide-react'

interface DeleteCategoryButtonProps {
  categoryId: string
  categoryName: string
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: DeleteCategoryButtonProps) {
  const { t } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = () => {
    setError('')
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) setError('') // Limpiar error al cerrar
    }}>
      <AlertDialogTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
            aria-label={`Eliminar categoría: ${categoryName}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
      />

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('categories.confirmDelete')}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              {categoryName}
            </span>

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isPending ? t('common.loading') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
