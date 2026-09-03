'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Home, PlusCircle, UserCheck } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarBrandLogo } from '@/components/dashboard/sidebar-brand-logo'
import { setActiveHouseholdAction } from '@/app/actions/household'
import { HouseholdMembershipItem } from '@/lib/household-context'
import { toast } from '@/components/ui/toast'
import Link from 'next/link'

interface HouseholdSwitcherProps {
  activeHouseholdId: string | null
  memberships: HouseholdMembershipItem[]
}

export function HouseholdSwitcher({
  activeHouseholdId,
  memberships,
}: HouseholdSwitcherProps) {
  const router = useRouter()
  const [isChanging, setIsChanging] = useState(false)

  const activeMembership = memberships.find((m) => m.household_id === activeHouseholdId) || memberships[0]
  const activeName = activeMembership?.households?.name || 'Sin hogar asignado'

  const handleSelectHousehold = async (householdId: string) => {
    if (householdId === activeHouseholdId || isChanging) return

    setIsChanging(true)
    const res = await setActiveHouseholdAction(householdId)

    if (res.error) {
      toast.add({
        title: 'Error al cambiar de hogar',
        description: res.error,
        type: 'error',
      })
    } else {
      const selected = memberships.find((m) => m.household_id === householdId)
      toast.add({
        title: 'Hogar cambiado',
        description: `Ahora estás en "${selected?.households.name || 'el nuevo hogar'}".`,
        type: 'success',
      })
      router.refresh()
    }
    setIsChanging(false)
  }

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex items-center justify-center rounded-lg text-primary-foreground shrink-0">
        <SidebarBrandLogo />
      </div>

      <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-between w-full p-1.5 -ml-1.5 rounded-xl hover:bg-sidebar-accent/50 transition-colors text-left outline-none group/trigger">
            <div className="flex flex-col truncate">
              <span className="font-semibold leading-none text-foreground font-heading text-sm truncate">
                {activeName}
              </span>
              {activeMembership && (
                <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">
                  Rol: {activeMembership.role === 'owner' ? 'Propietario' : 'Miembro'}
                </span>
              )}
            </div>
            <ChevronsUpDown className="w-4 h-4 text-muted-foreground group-hover/trigger:text-foreground shrink-0 ml-1 transition-colors" />
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64 rounded-2xl p-2 shadow-xl border-border bg-card text-card-foreground" align="start">
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                Mis Hogares ({memberships.length})
              </DropdownMenuLabel>
              {memberships.map((m) => {
                const isActive = m.household_id === activeHouseholdId
                return (
                  <DropdownMenuItem
                    key={m.household_id}
                    onClick={() => handleSelectHousehold(m.household_id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer font-medium transition-colors ${isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-muted text-foreground'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Home className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex flex-col truncate">
                        <span className="truncate">{m.households.name}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {m.role === 'owner' ? 'Propietario' : 'Miembro'}
                        </span>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-1.5" />

            <DropdownMenuItem
              onClick={() => router.push('/household')}
              className="p-2 rounded-xl text-xs font-medium cursor-pointer hover:bg-muted flex items-center gap-2 text-foreground"
            >
              <PlusCircle className="w-4 h-4 text-primary shrink-0" />
              <span>Gestión de Hogares & Invitaciones</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
