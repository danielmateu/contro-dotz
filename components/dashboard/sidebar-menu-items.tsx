'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { MorphIcon } from 'morphicons/react'
import { createClient } from '@/lib/supabase/client'
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
// @ts-ignore
import { __iconNode as MessageSquareData } from 'lucide-react/dist/esm/icons/message-square.mjs'
// @ts-ignore
import { __iconNode as MessagesSquareData } from 'lucide-react/dist/esm/icons/messages-square.mjs'
// @ts-ignore
import { __iconNode as ShoppingBasketData } from 'lucide-react/dist/esm/icons/shopping-basket.mjs'
// @ts-ignore
import { __iconNode as ShoppingCartData } from 'lucide-react/dist/esm/icons/shopping-cart.mjs'
// @ts-ignore
import { __iconNode as WalletData } from 'lucide-react/dist/esm/icons/wallet.mjs'
// @ts-ignore
import { __iconNode as TargetData } from 'lucide-react/dist/esm/icons/target.mjs'

interface SidebarMenuItemsProps {
  hasHousehold: boolean
  householdId?: string | null
  userId?: string
}

export function SidebarMenuItems({ hasHousehold, householdId, userId }: SidebarMenuItemsProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [hasUnread, setHasUnread] = useState(false)

  // Limpiar el badge si el usuario entra al chat
  useEffect(() => {
    if (pathname === '/chat') {
      setHasUnread(false)
    }
  }, [pathname])

  // Suscribirse a mensajes en tiempo real para activar la alerta de mensajes nuevos
  useEffect(() => {
    if (!householdId || !userId || pathname === '/chat') return

    const supabase = createClient()

    const channel = supabase
      .channel(`sidebar_unread_${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          if (payload.new.created_by !== userId) {
            setHasUnread(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, userId, pathname])

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
      title: 'Huchas Ahorro',
      url: '/saving-goals',
      icon: WalletData,
      activeIcon: TargetData,
      disabled: !hasHousehold,
    },
    {
      title: 'Chat Familiar',
      url: '/chat',
      icon: MessageSquareData,
      activeIcon: MessagesSquareData,
      disabled: !hasHousehold,
    },
    {
      title: 'Lista Compra',
      url: '/shopping',
      icon: ShoppingBasketData,
      activeIcon: ShoppingCartData,
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
                  <div className="relative flex items-center justify-center">
                    <MorphIcon
                      icon={currentIcon}
                      spring="snappy"
                      className="h-4 w-4 shrink-0"
                    />
                    {item.title === 'Chat Familiar' && hasUnread && (
                      <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    )}
                  </div>
                  <span className="group-data-[collapsible=icon]:hidden flex-1 flex items-center justify-between">
                    <span>{item.title}</span>
                    {item.title === 'Chat Familiar' && hasUnread && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    )}
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
