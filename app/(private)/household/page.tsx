import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
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

  // Cargar perfil y hogar activo
  const [profileRes, householdContext] = await Promise.all([
    supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single(),
    getActiveHouseholdHelper(user.id),
  ])

  const profile = profileRes.data
  const { activeMembership, activeHouseholdId } = householdContext
  const userEmail = profile?.email || ''

  const hasHousehold = !!activeMembership
  const householdName = activeMembership?.households?.name || null
  const householdCreatedAt = null

  let membersList: any[] = []
  let sentInvitations: any[] = []
  let receivedInvitations: any[] = []
  let balances: any[] = []
  let debts: any[] = []
  let settlementsList: any[] = []

  // Cargar siempre invitaciones recibidas pendientes para el correo del usuario
  const { data: received } = await supabase
    .from('invitations')
    .select(
      'id, role, status, created_at, households(name), profiles:invited_by(display_name)'
    )
    .ilike('email', userEmail.trim())
    .eq('status', 'pending')

  receivedInvitations = received || []

  if (hasHousehold && activeHouseholdId) {
    const now = new Date()
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

    // Cargar miembros, invitaciones enviadas, gastos y liquidaciones en paralelo para el hogar activo
    const [membersRes, sentRes, expensesRes, settlementsRes, monthIncomesRes] = await Promise.all([
      supabase
        .from('household_members')
        .select('id, role, user_id, monthly_income, monthly_contribution, profiles(display_name, email, avatar_url, status)')
        .eq('household_id', activeHouseholdId),
      supabase
        .from('invitations')
        .select('id, email, role, status, created_at')
        .eq('household_id', activeHouseholdId)
        .eq('status', 'pending'),
      supabase
        .from('expenses')
        .select('created_by, amount, is_personal')
        .eq('household_id', activeHouseholdId),
      supabase
        .from('settlements')
        .select('id, payer_id, receiver_id, amount, settled_at')
        .eq('household_id', activeHouseholdId)
        .order('settled_at', { ascending: false }),
      supabase
        .from('member_incomes')
        .select('user_id, amount, contribution')
        .eq('household_id', activeHouseholdId)
        .eq('month', currentMonthStr)
    ])

    membersList = membersRes.data || []
    sentInvitations = sentRes.data || []
    const expensesList = expensesRes.data || []
    settlementsList = settlementsRes.data || []
    const monthIncomes = monthIncomesRes.data || []

    const calculatedMembers = membersList.map((m) => {
      const specificIncome = monthIncomes.find((inc) => inc.user_id === m.user_id)
      const income = specificIncome ? Number(specificIncome.amount) : Number(m.monthly_income || 0)
      const contribution = specificIncome && specificIncome.contribution !== null && specificIncome.contribution !== undefined
        ? Number(specificIncome.contribution)
        : Number(m.monthly_contribution || 0)

      return {
        ...m,
        monthly_income: income,
        monthly_contribution: contribution,
      }
    })

    // Calcular balances y deudas
    balances = calculateBalances(calculatedMembers, expensesList, settlementsList)
    debts = calculateDebts(balances)
  }

  return (
    <HouseholdViewClient
      hasHousehold={hasHousehold}
      householdName={householdName}
      householdCreatedAt={householdCreatedAt}
      householdId={activeHouseholdId}
      role={activeMembership?.role}
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
