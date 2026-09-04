import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
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
    page?: string
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

  const pageSize = 40
  const currentPage = Math.max(1, parseInt(query.page || '1', 10) || 1)
  const from = (currentPage - 1) * pageSize
  const to = currentPage * pageSize - 1

  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar hogar activo
  const { activeMembership, activeHouseholdId } = await getActiveHouseholdHelper(user.id)
  if (!activeMembership || !activeHouseholdId) redirect('/household')

  const isOwner = activeMembership.role === 'owner'
  const householdId = activeHouseholdId

  // 1. Preparar consulta de categorías
  const categoriesPromise = supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', householdId)
    .order('name')

  // 2. Preparar consulta de miembros del hogar
  const membersPromise = supabase
    .from('household_members')
    .select('user_id, profiles(display_name)')
    .eq('household_id', householdId)

  // 3. Preparar consulta de gastos con filtros, ordenación y paginación
  let dbQuery = supabase
    .from('expenses')
    .select(
      'id, amount, category_id, description, expense_date, payment_method, notes, created_by, receipt_path, is_personal, categories(name, color, icon), profiles:created_by(display_name, avatar_url)',
      { count: 'exact' }
    )
    .eq('household_id', householdId)

  let totalAmountQuery = supabase
    .from('expenses')
    .select('amount')
    .eq('household_id', householdId)

  if (startDate) {
    dbQuery = dbQuery.gte('expense_date', startDate)
    totalAmountQuery = totalAmountQuery.gte('expense_date', startDate)
  }
  if (endDate) {
    dbQuery = dbQuery.lte('expense_date', endDate)
    totalAmountQuery = totalAmountQuery.lte('expense_date', endDate)
  }
  if (categoryId) {
    dbQuery = dbQuery.eq('category_id', categoryId)
    totalAmountQuery = totalAmountQuery.eq('category_id', categoryId)
  }
  if (memberId) {
    if (memberId === 'shared') {
      dbQuery = dbQuery.is('created_by', null)
      totalAmountQuery = totalAmountQuery.is('created_by', null)
    } else {
      dbQuery = dbQuery.eq('created_by', memberId)
      totalAmountQuery = totalAmountQuery.eq('created_by', memberId)
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

  // Aplicar rango de paginación
  dbQuery = dbQuery.range(from, to)

  const [categoriesRes, membersRes, expensesRes, totalAmountRes] = await Promise.all([
    categoriesPromise,
    membersPromise,
    dbQuery,
    totalAmountQuery
  ])

  if (expensesRes.error) {
    console.error('Error fetching expenses:', expensesRes.error)
  }

  const categories = categoriesRes.data
  const members = membersRes.data
  const expenses = expensesRes.data || []
  const totalCount = expensesRes.count || 0
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const totalExpensesAmount = (totalAmountRes.data || []).reduce(
    (sum, exp) => sum + Number(exp.amount || 0),
    0
  )

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
      householdId={householdId}
      currentUserId={user.id}
      isOwner={isOwner}
      categories={categories || []}
      members={(members as any) || []}
      mappedMembers={mappedMembers}
      expenses={expenses}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      totalExpensesAmount={totalExpensesAmount}
      startDate={startDate}
      endDate={endDate}
      categoryId={categoryId}
      memberId={memberId}
    />
  )
}
