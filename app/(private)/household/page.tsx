import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateBalances, calculateDebts } from '@/lib/finance-utils'
import { HouseholdViewClient } from '@/components/household/household-view-client'

export const metadata: Metadata = {
  title: 'Mi Hogar / Familia',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function HouseholdPage() {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar email de perfil y membresía de hogar en paralelo
  const [profileRes, membershipRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single(),
    supabase
      .from('household_members')
      .select('id, household_id, role, households(name, created_at)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
  ])

  const profile = profileRes.data
  const membership = membershipRes.data
  const userEmail = profile?.email || ''

  const hasHousehold = !!membership
  const householdName = membership?.households
    ? (membership.households as any).name
    : null
  const householdCreatedAt = membership?.households
    ? (membership.households as any).created_at
    : null

  let membersList: any[] = []
  let sentInvitations: any[] = []
  let receivedInvitations: any[] = []
  let balances: any[] = []
  let debts: any[] = []
  let settlementsList: any[] = []

  if (hasHousehold) {
    // Cargar miembros, invitaciones enviadas, gastos y liquidaciones en paralelo
    const [membersRes, sentRes, expensesRes, settlementsRes] = await Promise.all([
      supabase
        .from('household_members')
        .select('id, role, user_id, monthly_income, monthly_contribution, profiles(display_name, email, avatar_url, status)')
        .eq('household_id', membership.household_id),
      supabase
        .from('invitations')
        .select('id, email, role, status, created_at')
        .eq('household_id', membership.household_id)
        .eq('status', 'pending'),
      supabase
        .from('expenses')
        .select('created_by, amount, is_personal')
        .eq('household_id', membership.household_id),
      supabase
        .from('settlements')
        .select('id, payer_id, receiver_id, amount, settled_at')
        .eq('household_id', membership.household_id)
        .order('settled_at', { ascending: false })
    ])

    membersList = membersRes.data || []
    sentInvitations = sentRes.data || []
    const expensesList = expensesRes.data || []
    settlementsList = settlementsRes.data || []

    // Calcular balances y deudas
    balances = calculateBalances(membersList, expensesList, settlementsList)
    debts = calculateDebts(balances)
  } else {
    // Cargar invitaciones recibidas pendientes
    const { data: received } = await supabase
      .from('invitations')
      .select(
        'id, role, status, created_at, households(name), profiles:invited_by(display_name)'
      )
      .eq('email', userEmail.toLowerCase().trim())
      .eq('status', 'pending')

    receivedInvitations = received || []
  }

  return (
    <HouseholdViewClient
      hasHousehold={hasHousehold}
      householdName={householdName}
      householdCreatedAt={householdCreatedAt}
      householdId={membership?.household_id}
      role={membership?.role}
      currentUserId={user.id}
      membersList={membersList}
      sentInvitations={sentInvitations}
      receivedInvitations={receivedInvitations}
      balances={balances}
      debts={debts}
      settlementsList={settlementsList}
    />
  )
}
