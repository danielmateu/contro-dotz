'use client'

import { usePathname } from 'next/navigation'
import { MorphIcon } from '@/components/ui/client-morph-icon'
// @ts-ignore
import { __iconNode as LogoHouseData } from 'lucide-react/dist/esm/icons/house.mjs'
// @ts-ignore
import { __iconNode as LayoutDashboardData } from 'lucide-react/dist/esm/icons/layout-dashboard.mjs'
// @ts-ignore
import { __iconNode as ReceiptData } from 'lucide-react/dist/esm/icons/receipt.mjs'
// @ts-ignore
import { __iconNode as TagsData } from 'lucide-react/dist/esm/icons/tags.mjs'
// @ts-ignore
import { __iconNode as PiggyBankData } from 'lucide-react/dist/esm/icons/piggy-bank.mjs'
// @ts-ignore
import { __iconNode as Users2Data } from 'lucide-react/dist/esm/icons/users-round.mjs'
// @ts-ignore
import { __iconNode as SettingsData } from 'lucide-react/dist/esm/icons/settings.mjs'

export function SidebarBrandLogo() {
  const pathname = usePathname()

  const iconMap: Record<string, any> = {
    '/dashboard': LayoutDashboardData,
    '/expenses': ReceiptData,
    '/categories': TagsData,
    '/budgets': PiggyBankData,
    '/household': Users2Data,
    '/settings': SettingsData,
  }
  const currentIcon = iconMap[pathname] || LogoHouseData

  return (
    <MorphIcon
      icon={currentIcon}
      spring="snappy"
      className="h-4 w-4 shrink-0"
    />
  )
}
