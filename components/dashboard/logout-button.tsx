'use client'

import { signOutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

export function LogoutButton() {
  const { t } = useI18n()

  return (
    <form action={signOutAction} className="w-full">
      <Button
        type="submit"
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 h-9"
        aria-label={t('common.logout')}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="ml-3 group-data-[collapsible=icon]:hidden">
          {t('common.logout')}
        </span>
      </Button>
    </form>
  )
}
