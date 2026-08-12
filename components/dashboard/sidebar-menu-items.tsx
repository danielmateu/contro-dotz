'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { MorphIcon } from 'morphicons/react'
// @ts-ignore
import { __iconNode as LayoutDashboardData } from 'lucide-react/dist/esm/icons/layout-dashboard.mjs'
// @ts-ignore
import { __iconNode as TrendingUpData } from 'lucide-react/dist/esm/icons/trending-up.mjs'
// @ts-ignore
import { __iconNode as ReceiptData } from 'lucide-react/dist/esm/icons/receipt.mjs'
// @ts-ignore
import { __iconNode as CoinsData } from 'lucide-react/dist/esm/icons/coins.mjs'
// @ts-ignore
import { __iconNode as TagsData } from 'lucide-react/dist/esm/icons/tags.mjs'
// @ts-ignore
import { __iconNode as FolderOpenData } from 'lucide-react/dist/esm/icons/folder-open.mjs'
// @ts-ignore
import { __iconNode as PiggyBankData } from 'lucide-react/dist/esm/icons/piggy-bank.mjs'
// @ts-ignore
import { __iconNode as ScaleData } from 'lucide-react/dist/esm/icons/scale.mjs'
// @ts-ignore
import { __iconNode as Users2Data } from 'lucide-react/dist/esm/icons/users-round.mjs'
// @ts-ignore
import { __iconNode as HomeData } from 'lucide-react/dist/esm/icons/house.mjs'
// @ts-ignore
import { __iconNode as SettingsData } from 'lucide-react/dist/esm/icons/settings.mjs'
// @ts-ignore
import { __iconNode as WrenchData } from 'lucide-react/dist/esm/icons/wrench.mjs'

interface SidebarMenuItemsProps {
  hasHousehold: boolean
}

export function SidebarMenuItems({ hasHousehold }: SidebarMenuItemsProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboardData,
      activeIcon: TrendingUpData,
      disabled: !hasHousehold,
    },
    {
      title: 'Gastos',
      url: '/expenses',
      icon: ReceiptData,
      activeIcon: CoinsData,
      disabled: !hasHousehold,
    },
    {
      title: 'Categorías',
      url: '/categories',
      icon: TagsData,
      activeIcon: FolderOpenData,
      disabled: !hasHousehold,
    },
    {
      title: 'Presupuestos',
      url: '/budgets',
      icon: PiggyBankData,
      activeIcon: ScaleData,
      disabled: !hasHousehold,
    },
    {
      title: 'Hogar / Familia',
      url: '/household',
      icon: Users2Data,
      activeIcon: HomeData,
      disabled: false,
    },
    {
      title: 'Ajustes',
      url: '/settings',
      icon: SettingsData,
      activeIcon: WrenchData,
      disabled: !hasHousehold,
    },
  ]

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = pathname === item.url
        const isHovered = hoveredItem === item.title
        const currentIcon = (isActive || isHovered) ? item.activeIcon : item.icon

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={isActive}
              tooltip={item.title}
              disabled={item.disabled}
              className={cn(
                'flex items-center gap-3 transition-all duration-200',
                item.disabled ? 'pointer-events-none opacity-40' : '',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              render={
                <Link
                  href={item.url}
                  onMouseEnter={() => !item.disabled && setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <MorphIcon
                    icon={currentIcon}
                    spring="snappy"
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="group-data-[collapsible=icon]:hidden">
                    {item.title}
                  </span>
                </Link>
              }
            />
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
