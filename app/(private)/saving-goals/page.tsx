import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { SavingGoalsViewClient } from '@/components/saving-goals/saving-goals-view-client'

export const metadata: Metadata = {
  title: 'Huchas de Ahorro',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SavingGoalsPage() {
  const supabase = await createClient()

  // Verificar sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar hogar activo
  const { activeMembership, activeHouseholdId } = await getActiveHouseholdHelper(user.id)
  if (!activeMembership || !activeHouseholdId) redirect('/household')

  const householdId = activeHouseholdId
  const userRole = activeMembership.role

  // Cargar metas de ahorro, aportaciones y miembros en paralelo
  const [goalsRes, contributionsRes, membersRes] = await Promise.all([
    supabase
      .from('saving_goals')
      .select('id, name, target_amount, current_amount, target_date, created_by, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false }),
    supabase
      .from('saving_contributions')
      .select(`
        id,
        goal_id,
        user_id,
        amount,
        created_at,
        profiles (display_name, email, avatar_url),
        saving_goals (name)
      `)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('household_members')
      .select('user_id, role, profiles(display_name, email, avatar_url)')
      .eq('household_id', householdId),
  ])

  const goals = goalsRes.data || []
  const rawContributions = contributionsRes.data || []
  const membersList = membersRes.data || []

  // Limpiar aportaciones para pasarlas al cliente de forma segura
  const contributions = rawContributions.map((c: any) => {
    const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    const goal = Array.isArray(c.saving_goals) ? c.saving_goals[0] : c.saving_goals
    return {
      id: c.id,
      goal_id: c.goal_id,
      goal_name: goal?.name || 'Hucha eliminada',
      user_id: c.user_id,
      user_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
      avatar_url: prof?.avatar_url || '',
      amount: Number(c.amount),
      created_at: c.created_at,
    }
  })

  // Limpiar miembros
  const members = membersList.map((m: any) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      id: m.user_id,
      name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
      avatar_url: prof?.avatar_url || '',
    }
  })

  return (
    <SavingGoalsViewClient
      householdId={householdId}
      currentUserId={user.id}
      isOwner={userRole === 'owner'}
      initialGoals={goals}
      initialContributions={contributions}
      members={members}
    />
  )
}
