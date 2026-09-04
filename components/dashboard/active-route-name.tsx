'use client'

import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-context'

export function ActiveRouteName() {
  const pathname = usePathname()
  const { t } = useI18n()

  const routeKeyMap: Record<string, string> = {
    '/dashboard': t('common.dashboard'),
    '/expenses': t('common.expenses'),
    '/categories': t('common.categories'),
    '/budgets': t('common.budgets'),
    '/saving-goals': t('common.savingGoals'),
    '/chat': t('common.chat'),
    '/shopping': t('common.shoppingList'),
    '/household': t('common.household'),
    '/settings': t('common.settings'),
    '/admin': t('common.admin'),
  }

  const displayName = routeKeyMap[pathname] || (pathname === '/' ? 'Inicio' : pathname.replace(/^\//, '').replace(/-/g, ' '))

  return (
    <span className="hidden sm:block text-sm font-semibold text-muted-foreground capitalize">
      {displayName}
    </span>
  )
}
