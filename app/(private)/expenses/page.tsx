import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExpensesViewClient } from '@/components/expenses/expenses-view-client'

export const metadata: Metadata = {
  title: 'Gastos Diarios',
  robots: {
    index: false,
    follow: false,
  },
}

interface ExpensesPageProps {
  searchParams: Promise<{
    startDate?: string
    endDate?: string
    categoryId?: string
    memberId?: string
    sortBy?: string
  }>
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  // Await searchParams as strictly required in Next.js 16
  const query = await searchParams
  const startDate = query.startDate || ''
  const endDate = query.endDate || ''
  const categoryId = query.categoryId || ''
  const memberId = query.memberId || ''
  const sortBy = query.sortBy || 'date_desc'

  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar membresía de hogar
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

  const isOwner = membership.role === 'owner'

  // 1. Preparar consulta de categorías
  const categoriesPromise = supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', membership.household_id)
    .order('name')

  // 2. Preparar consulta de miembros del hogar
  const membersPromise = supabase
    .from('household_members')
    .select('user_id, profiles(display_name)')
    .eq('household_id', membership.household_id)

  // 3. Preparar consulta de gastos con filtros y ordenación
  let dbQuery = supabase
    .from('expenses')
    .select(
      'id, amount, category_id, description, expense_date, payment_method, notes, created_by, receipt_path, categories(name, color, icon), profiles:created_by(display_name, avatar_url)'
    )
    .eq('household_id', membership.household_id)

  if (startDate) dbQuery = dbQuery.gte('expense_date', startDate)
  if (endDate) dbQuery = dbQuery.lte('expense_date', endDate)
  if (categoryId) dbQuery = dbQuery.eq('category_id', categoryId)
  if (memberId) {
    if (memberId === 'shared') {
      dbQuery = dbQuery.is('created_by', null)
    } else {
      dbQuery = dbQuery.eq('created_by', memberId)
    }
  }

  if (sortBy === 'date_asc') {
    dbQuery = dbQuery
      .order('expense_date', { ascending: true })
      .order('created_at', { ascending: true })
  } else if (sortBy === 'amount_desc') {
    dbQuery = dbQuery.order('amount', { ascending: false })
  } else if (sortBy === 'amount_asc') {
    dbQuery = dbQuery.order('amount', { ascending: true })
  } else {
    dbQuery = dbQuery
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
  }

  const [categoriesRes, membersRes, expensesRes] = await Promise.all([
    categoriesPromise,
    membersPromise,
    dbQuery
  ])

  if (expensesRes.error) {
    console.error('Error fetching expenses:', expensesRes.error)
  }

  const categories = categoriesRes.data
  const members = membersRes.data
  const expenses = expensesRes.data

  const mappedMembers = (members || []).map((m: any) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      id: m.user_id,
      name: profile?.display_name || profile?.email?.split('@')[0] || 'Miembro',
      avatarUrl: profile?.avatar_url || null,
    }
  })

  return (
    <ExpensesViewClient
      householdId={membership.household_id}
      currentUserId={user.id}
      isOwner={isOwner}
      categories={categories || []}
      members={(members as any) || []}
      mappedMembers={mappedMembers}
      expenses={expenses || []}
      startDate={startDate}
      endDate={endDate}
      categoryId={categoryId}
      memberId={memberId}
    />
  )
}
