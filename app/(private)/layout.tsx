import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Receipt,
  Tags,
  PiggyBank,
  Users2,
  Settings,
  LogOut,
  User,
  Home,
  Menu,
} from 'lucide-react'

interface PrivateLayoutProps {
  children: React.ReactNode
}

export default async function PrivateLayout({ children }: PrivateLayoutProps) {
  // Obtener x-pathname de las cabeceras
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  // Cargar membresía de hogar
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role, households(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const hasHousehold = !!membership
  const householdName = membership?.households
    ? (membership.households as any).name
    : null



  // Menú de navegación lateral
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
      disabled: false, // Siempre disponible para ver invitaciones o crear otro
    },
    {
      title: 'Ajustes',
      url: '/settings',
      icon: Settings,
      disabled: !hasHousehold,
    },
  ]

  return (
    <SidebarProvider>
      {/* Sidebar de la aplicación */}
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/50 py-4 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg text-primary-foreground">
              <Home className="h-4 w-4" />
            </div>
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
              <span className="font-semibold leading-none text-foreground font-heading">
                {householdName || 'Sin hogar asignado'}
              </span>
              {hasHousehold && (
                <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                  Rol: {membership.role === 'owner' ? 'Propietario' : 'Miembro'}
                </span>
              )}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="py-2">
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Menú Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        disabled={item.disabled}
                        className={cn(
                          'flex items-center gap-3',
                          item.disabled ? 'pointer-events-none opacity-40' : ''
                        )}
                        render={
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
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
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/50 p-4">
          {/* Perfil del usuario */}
          <div className="flex items-center gap-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 truncate">
              <span className="text-sm font-medium text-foreground truncate">
                {profile?.display_name || 'Usuario'}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {profile?.email}
              </span>
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
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-muted-foreground capitalize">
              {pathname.replace('/', '').replace('-', ' ') || 'Inicio'}
            </span>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 dark:bg-slate-900/10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
