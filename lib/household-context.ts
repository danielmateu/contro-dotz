import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface HouseholdMembershipItem {
  id: string
  household_id: string
  role: 'owner' | 'member'
  monthly_income: number
  monthly_contribution: number
  households: {
    id: string
    name: string
  }
}

export async function getActiveHouseholdHelper(userId: string) {
  const supabase = await createClient()

  // 1. Obtener todas las membresías a hogares del usuario
  const { data: rawMemberships, error } = await supabase
    .from('household_members')
    .select('id, household_id, role, monthly_income, monthly_contribution, households(id, name)')
    .eq('user_id', userId)

  if (error || !rawMemberships || rawMemberships.length === 0) {
    return {
      activeMembership: null as HouseholdMembershipItem | null,
      allMemberships: [] as HouseholdMembershipItem[],
      activeHouseholdId: null as string | null,
    }
  }

  const allMemberships = rawMemberships.map((m) => {
    const hh = Array.isArray(m.households) ? m.households[0] : m.households
    return {
      id: m.id,
      household_id: m.household_id,
      role: m.role as 'owner' | 'member',
      monthly_income: Number(m.monthly_income || 0),
      monthly_contribution: Number(m.monthly_contribution || 0),
      households: {
        id: hh?.id || m.household_id,
        name: hh?.name || 'Hogar Sin Nombre',
      },
    }
  })

  // 2. Leer la cookie active_household_id
  const cookieStore = await cookies()
  const activeCookieId = cookieStore.get('active_household_id')?.value

  // 3. Buscar la membresía que coincida con la cookie
  let activeMembership = allMemberships.find((m) => m.household_id === activeCookieId)

  // 4. Si no hay cookie o la cookie no coincide con ninguna membresía, usar la primera
  if (!activeMembership) {
    activeMembership = allMemberships[0]
  }

  return {
    activeMembership,
    allMemberships,
    activeHouseholdId: activeMembership.household_id,
  }
}
