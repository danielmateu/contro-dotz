import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { saveBudgetAction } from '@/app/actions/budget'
import { BudgetsViewClient } from '@/components/budgets/budgets-view-client'

export const metadata: Metadata = {
  title: 'Presupuestos Mensuales',
  robots: {
    index: false,
    follow: false,
  },
}

interface BudgetsPageProps {
  searchParams: Promise<{
    month?: string
  }>
}

export default async function BudgetsPage({ searchParams }: BudgetsPageProps) {
  // Await searchParams as required in Next.js 16
  const query = await searchParams
  
  // Mes por defecto: mes actual en formato YYYY-MM
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`
  const month = query.month || defaultMonth

  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar hogar activo
  const { activeMembership, activeHouseholdId } = await getActiveHouseholdHelper(user.id)
  if (!activeMembership || !activeHouseholdId) redirect('/household')

  const householdId = activeHouseholdId

  // Calcular fechas de inicio y fin del mes
  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr)
  const monthNum = parseInt(monthStr)
  const lastDay = new Date(year, monthNum, 0).getDate()
  const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`

  // Cargar presupuestos, categorías y gastos del mes en paralelo
  const [budgetsRes, categoriesRes, expensesRes] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, amount, category_id, categories(name, color, icon)')
      .eq('household_id', householdId)
      .eq('month', month),
    supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', householdId)
      .order('name'),
    supabase
      .from('expenses')
      .select('amount, category_id')
      .eq('household_id', householdId)
      .eq('is_personal', false)
      .gte('expense_date', `${month}-01`)
      .lte('expense_date', endDate)
  ])

  const budgets = budgetsRes.data
  const categories = categoriesRes.data
  const expenses = expensesRes.data

  // Calcular total gastado por categoría
  const categorySpentMap: Record<string, number> = {}
  expenses?.forEach((exp) => {
    const catId = exp.category_id
    const amt = Number(exp.amount)
    categorySpentMap[catId] = (categorySpentMap[catId] || 0) + amt
  })

  // Enlazar la acción de guardar con el ID del hogar
  const saveActionWithId = saveBudgetAction.bind(null, householdId)

  // Formatear mes en letras para el título (ej: agosto de 2026)
  const monthDate = new Date(year, monthNum - 1)
  const monthName = monthDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <BudgetsViewClient
      month={month}
      categories={categories || []}
      budgets={budgets || []}
      categorySpentMap={categorySpentMap}
      saveActionWithId={saveActionWithId}
      monthName={monthName}
    />
  )
}
