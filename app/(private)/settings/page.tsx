import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsViewClient } from '@/components/settings/settings-view-client'

export const metadata: Metadata = {
  title: 'Ajustes',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SettingsPage() {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar perfil actual y membresía del hogar en paralelo
  const [profileRes, membershipRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, email, avatar_url, status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('household_members')
      .select('household_id, monthly_income, monthly_contribution')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileRes.data
  const membership = membershipRes.data
  const householdId = membership?.household_id || null
  const monthlyIncome = Number(membership?.monthly_income || 0)
  const monthlyContribution = Number(membership?.monthly_contribution || 0)

  // Cargar ingresos mensuales específicos del usuario logueado en este hogar
  let memberIncomes: any[] = []
  if (householdId) {
    const { data: incomesRes } = await supabase
      .from('member_incomes')
      .select('id, month, amount, contribution, payroll_path')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
    memberIncomes = incomesRes || []
  }

  const displayName = profile?.display_name || ''
  const email = profile?.email || ''
  const avatarUrl = profile?.avatar_url || ''
  const status = profile?.status || ''

  return (
    <SettingsViewClient
      userId={user.id}
      email={email}
      displayName={displayName}
      avatarUrl={avatarUrl}
      status={status}
      householdId={householdId}
      monthlyIncome={monthlyIncome}
      monthlyContribution={monthlyContribution}
      memberIncomes={memberIncomes}
    />
  )
}
