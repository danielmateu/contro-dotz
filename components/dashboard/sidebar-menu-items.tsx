'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { LayoutDashboard, Receipt, Tags, PiggyBank, Users2, Settings } from 'lucide-react'

interface SidebarMenuItemsProps {
  hasHousehold: boolean
}

export function SidebarMenuItems({ hasHousehold }: SidebarMenuItemsProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
      disabled: !hasHousehold,
    },
    {
      title: 'Gastos',
      url: '/expenses',
      icon: Receipt,
      disabled: !hasHousehold,
    },
    {
      title: 'Categorías',
      url: '/categories',
      icon: Tags,
      disabled: !hasHousehold,
    },
    {
      title: 'Presupuestos',
      url: '/budgets',
      icon: PiggyBank,
      disabled: !hasHousehold,
    },
    {
      title: 'Hogar / Familia',
      url: '/household',
      icon: Users2,
      disabled: false,
    },
    {
      title: 'Ajustes',
      url: '/settings',
      icon: Settings,
      disabled: !hasHousehold,
    },
  ]

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        // Soporta coincidencia exacta y subrutas si aplica (en este caso coincidencia exacta)
        const isActive = pathname === item.url
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
                <Link href={item.url}>
                  <item.icon className="h-4 w-4 shrink-0" />
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
