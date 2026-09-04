import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarMenuItems } from '@/components/dashboard/sidebar-menu-items'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { LogOut } from 'lucide-react'

import { HouseholdSwitcher } from '@/components/dashboard/household-switcher'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { ActiveRouteName } from '@/components/dashboard/active-route-name'
import { LocaleSwitcher } from '@/components/i18n/locale-switcher'
import { FeatureBaseWidget } from '@/components/feedback/featurebase-widget'
import { ShareAppModal } from '@/components/share-app-modal'
import { HeaderTamagotchiTrigger } from '@/components/game/header-tamagotchi-trigger'
import { GameStateProvider } from '@/lib/game/game-context'

interface PrivateLayoutProps {
  children: React.ReactNode
}

export default async function PrivateLayout({ children }: PrivateLayoutProps) {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar perfil y contexto multihogar
  const [profileResult, householdContext] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, email, avatar_url, status, is_super_admin')
      .eq('id', user.id)
      .single(),
    getActiveHouseholdHelper(user.id),
  ])

  const profile = profileResult.data
  const { activeMembership, allMemberships, activeHouseholdId } = householdContext

  const hasHousehold = !!activeMembership
  const householdId = activeHouseholdId
  const isSuperAdmin = profile?.is_super_admin ?? false

  return (
    <GameStateProvider>
      <SidebarProvider>
      {/* Sidebar de la aplicación */}
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/50 py-3.5 px-4">
          <HouseholdSwitcher
            activeHouseholdId={activeHouseholdId}
            memberships={allMemberships}
          />
        </SidebarHeader>

        <SidebarContent className="py-2">
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Menú Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenuItems
                hasHousehold={hasHousehold}
                householdId={householdId}
                userId={user.id}
                isSuperAdmin={isSuperAdmin}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/50 p-4">
          {/* Perfil del usuario */}
          <div className="flex items-center gap-3 py-2 group-data-[collapsible=icon]:hidden">
            <Avatar className="h-9 w-9 border border-sidebar-border/40">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name || 'Usuario'} className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {(profile?.display_name || 'U').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 truncate">
              <span className="text-sm font-semibold text-foreground truncate">
                {profile?.display_name || 'Usuario'}
              </span>
              {profile?.status ? (
                <span className="text-[10px] text-muted-foreground truncate italic">
                  {profile.status}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground truncate">
                  {profile?.email}
                </span>
              )}
            </div>
          </div>

          <Separator className="my-2 group-data-[collapsible=icon]:hidden" />

          {/* Botón de logout */}
          <form action={signOutAction} className="w-full">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2 h-9"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="ml-3 group-data-[collapsible=icon]:hidden">
                Cerrar sesión
              </span>
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header Superior Móvil/Desktop */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/50 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            {/* <Separator orientation="vertical" className="h-4" /> */}
            <ActiveRouteName />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <HeaderTamagotchiTrigger householdId={householdId || undefined} />
            <ShareAppModal />
            <FeatureBaseWidget userEmail={profile?.email} userName={profile?.display_name || undefined} />
            <LocaleSwitcher />
            <ModeToggle />
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </GameStateProvider>
  )
}
