import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecentActivityAction } from '@/app/actions/activity'
import { calculateDailyAverage, calculatePercentageChange } from '@/lib/finance-utils'
import { DashboardViewClient } from '@/components/dashboard/dashboard-view-client'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar membresía
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

  const isOwner = membership.role === 'owner'

  // Obtener fechas del mes actual y mes anterior
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth() + 1
  const currentMonthStr = `${currentYear}-${currentMonthNum
    .toString()
    .padStart(2, '0')}`
  const currentLastDay = new Date(currentYear, currentMonthNum, 0).getDate()
  const currentStartDate = `${currentMonthStr}-01`
  const currentEndDate = `${currentMonthStr}-${currentLastDay
    .toString()
    .padStart(2, '0')}`

  // Fechas del mes anterior
  const prevDate = new Date(currentYear, currentMonthNum - 2, 1)
  const prevYear = prevDate.getFullYear()
  const prevMonthNum = prevDate.getMonth() + 1
  const prevMonthStr = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`
  const prevLastDay = new Date(prevYear, prevMonthNum, 0).getDate()
  const prevStartDate = `${prevMonthStr}-01`
  const prevEndDate = `${prevMonthStr}-${prevLastDay.toString().padStart(2, '0')}`

  // Cargar todos los datos requeridos para el Dashboard en paralelo
  const [
    categoriesRes,
    currentExpensesRes,
    prevExpensesRes,
    currentBudgetsRes,
    householdMembersRes,
    memberIncomesRes,
    activities
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', membership.household_id)
      .order('name'),
    supabase
      .from('expenses')
      .select(
        'id, amount, description, expense_date, category_id, created_by, is_personal, categories(name, color, icon), profiles:created_by(display_name, avatar_url)'
      )
      .eq('household_id', membership.household_id)
      .gte('expense_date', currentStartDate)
      .lte('expense_date', currentEndDate),
    supabase
      .from('expenses')
      .select('amount, is_personal')
      .eq('household_id', membership.household_id)
      .gte('expense_date', prevStartDate)
      .lte('expense_date', prevEndDate),
    supabase
      .from('budgets')
      .select('id, amount, category_id, categories(name, color, icon)')
      .eq('household_id', membership.household_id)
      .eq('month', currentMonthStr),
    supabase
      .from('household_members')
      .select('user_id, role, monthly_income, monthly_contribution, profiles(display_name, email, avatar_url, status)')
      .eq('household_id', membership.household_id),
    supabase
      .from('member_incomes')
      .select('user_id, amount, contribution')
      .eq('household_id', membership.household_id)
      .eq('month', currentMonthStr),
    getRecentActivityAction(membership.household_id)
  ])

  const categories = categoriesRes.data
  const currentExpenses = currentExpensesRes.data || []
  const prevExpenses = prevExpensesRes.data || []
  const currentBudgets = currentBudgetsRes.data
  const householdMembers = householdMembersRes.data
  const monthlyIncomes = memberIncomesRes.data || []

  const membersList = householdMembers || []
  const memberNames = [
    ...membersList.map(m => {
      const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      return prof?.display_name || prof?.email?.split('@')[0] || 'Miembro'
    }),
    'Compartido'
  ]

  const mappedMembers = membersList.map((m: any) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      id: m.user_id,
      name: profile?.display_name || profile?.email?.split('@')[0] || 'Miembro',
    }
  })

  // Gastos del Hogar (compartidos, excluyendo personales)
  const sharedExpenses = currentExpenses.filter((e) => !e.is_personal)

  // Calcular gastos compartidos por miembro en el mes actual
  const memberSpentMap: Record<string, number> = {}
  membersList.forEach((m) => {
    memberSpentMap[m.user_id] = 0
  })
  sharedExpenses.forEach((exp) => {
    if (exp.created_by && memberSpentMap[exp.created_by] !== undefined) {
      memberSpentMap[exp.created_by] += Number(exp.amount)
    }
  })

  const membersIncomeAndSpent = membersList.map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    const name = profile?.display_name || profile?.email?.split('@')[0] || 'Miembro'
    
    const specificIncome = monthlyIncomes.find((inc) => inc.user_id === m.user_id)
    const income = specificIncome 
      ? Number(specificIncome.amount) 
      : Number(m.monthly_income || 0)

    const contribution = specificIncome && specificIncome.contribution !== null && specificIncome.contribution !== undefined
      ? Number(specificIncome.contribution)
      : Number(m.monthly_contribution || 0)

    return {
      name,
      income,
      contribution,
      spent: memberSpentMap[m.user_id] || 0,
    }
  })

  // Total del fondo aportado por el hogar (sumatorio de cuotas prometidas)
  const totalHouseholdFund = membersIncomeAndSpent.reduce((sum, m) => sum + m.contribution, 0)

  // --- CÁLCULO DE KPIs ---
  const currentTotalSpent =
    sharedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
  const prevTotalSpent =
    prevExpenses.filter((e) => !e.is_personal).reduce((sum, exp) => sum + Number(exp.amount), 0)

  const daysPassed = now.getDate()
  const dailyAverage = calculateDailyAverage(currentTotalSpent, daysPassed)

  const diffAbsolute = currentTotalSpent - prevTotalSpent
  const diffPercentage = calculatePercentageChange(currentTotalSpent, prevTotalSpent)

  const totalBudgeted =
    currentBudgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0

  const categorySpentMap: Record<string, number> = {}
  currentExpenses?.forEach((exp) => {
    const catId = exp.category_id
    const amt = Number(exp.amount)
    categorySpentMap[catId] = (categorySpentMap[catId] || 0) + amt
  })

  // --- PREPARAR DATOS PARA GRÁFICOS ---
  const categoryAgg: Record<
    string,
    { name: string; value: number; color: string }
  > = {}
  currentExpenses?.forEach((exp) => {
    const cat = exp.categories as any
    const catId = exp.category_id
    const amt = Number(exp.amount)
    if (catId) {
      if (!categoryAgg[catId]) {
        categoryAgg[catId] = {
          name: cat?.name || 'Otros',
          value: 0,
          color: cat?.color || '#64748b',
        }
      }
      categoryAgg[catId].value += amt
    }
  })
  const pieChartData = Object.values(categoryAgg)
    .filter((d) => d.value > 0)
    .map((d) => ({
      ...d,
      value: parseFloat(d.value.toFixed(2)),
    }))

  const dailyMap: Record<number, number> = {}
  for (let d = 1; d <= currentLastDay; d++) {
    dailyMap[d] = 0
  }
  currentExpenses?.forEach((exp) => {
    const dateVal = new Date(exp.expense_date)
    const day = dateVal.getDate()
    dailyMap[day] = (dailyMap[day] || 0) + Number(exp.amount)
  })

  let lineCumulative = 0
  const lineChartData = Object.keys(dailyMap).map((dayKey) => {
    const day = parseInt(dayKey)
    lineCumulative += dailyMap[day]
    return {
      day: `${day}`,
      Gasto: parseFloat(lineCumulative.toFixed(2)),
    }
  })

  const categoriesMap = new Map<string, { id: string; name: string; color: string }>()
  currentBudgets?.forEach(b => {
    const cat = b.categories as any
    if (b.category_id && cat) {
      categoriesMap.set(b.category_id, { id: b.category_id, name: cat.name, color: cat.color })
    }
  })
  currentExpenses?.forEach(exp => {
    const cat = exp.categories as any
    if (exp.category_id && cat) {
      categoriesMap.set(exp.category_id, { id: exp.category_id, name: cat.name, color: cat.color })
    }
  })

  const barChartData = Array.from(categoriesMap.values()).map(cat => {
    const budget = currentBudgets?.find(b => b.category_id === cat.id)?.amount || 0
    const spent = categorySpentMap[cat.id] || 0
    return {
      name: cat.name,
      Presupuesto: Number(budget),
      Gastado: Number(spent),
      color: cat.color,
    }
  })

  const runningTotal: Record<string, number> = {}
  memberNames.forEach(name => {
    runningTotal[name] = 0
  })

  const stackedChartData = []
  for (let d = 1; d <= currentLastDay; d++) {
    const dayExpenses = currentExpenses?.filter(exp => {
      const dateVal = new Date(exp.expense_date)
      return dateVal.getDate() === d
    }) || []

    dayExpenses.forEach(exp => {
      let name = 'Compartido'
      if (exp.created_by) {
        const matchedMember = membersList.find(m => m.user_id === exp.created_by)
        const prof = matchedMember ? (Array.isArray(matchedMember.profiles) ? matchedMember.profiles[0] : matchedMember.profiles) : null
        name = prof?.display_name || prof?.email?.split('@')[0] || 'Miembro'
      }
      runningTotal[name] = (runningTotal[name] || 0) + Number(exp.amount)
    })

    const dataPoint: Record<string, any> = { day: `${d}` }
    memberNames.forEach(name => {
      dataPoint[name] = parseFloat((runningTotal[name] || 0).toFixed(2))
    })
    stackedChartData.push(dataPoint)
  }

  const budgetsAlert = currentBudgets
    ?.map((b) => {
      const cat = b.categories as any
      const spent = categorySpentMap[b.category_id] || 0
      const limit = Number(b.amount)
      const percent = limit > 0 ? (spent / limit) * 100 : 0
      return {
        id: b.id,
        categoryName: cat?.name || 'Categoría',
        color: cat?.color || '#64748b',
        icon: cat?.icon || 'Tag',
        spent,
        limit,
        percent,
      }
    })
    .filter((b) => b.percent >= 80)
    .sort((a, b) => b.percent - a.percent)

  const latestExpenses = currentExpenses
    ? [...currentExpenses]
      .sort(
        (a, b) =>
          new Date(b.expense_date).getTime() -
          new Date(a.expense_date).getTime()
      )
      .slice(0, 5)
    : []

  return (
    <DashboardViewClient
      householdId={membership.household_id}
      userId={user.id}
      isOwner={isOwner}
      categories={categories || []}
      mappedMembers={mappedMembers}
      totalHouseholdFund={totalHouseholdFund}
      currentTotalSpent={currentTotalSpent}
      dailyAverage={dailyAverage}
      daysPassed={daysPassed}
      diffAbsolute={diffAbsolute}
      diffPercentage={diffPercentage}
      totalBudgeted={totalBudgeted}
      pieChartData={pieChartData}
      lineChartData={lineChartData}
      barChartData={barChartData}
      stackedChartData={stackedChartData}
      memberNames={memberNames}
      membersIncomeAndSpent={membersIncomeAndSpent}
      budgetsAlert={budgetsAlert || []}
      latestExpenses={latestExpenses}
      activities={activities}
    />
  )
}
