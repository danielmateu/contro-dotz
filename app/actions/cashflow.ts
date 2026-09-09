'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RecurringExpense {
  id: string
  household_id: string
  category_id: string
  created_by: string | null
  name: string
  amount: number
  day_of_month: number
  payment_method: string
  is_active: boolean
  notes: string | null
  categories?: { name: string; color: string; icon: string } | null
}

export interface ScheduledBill {
  id: string
  name: string
  amount: number
  category_id: string
  categoryName: string
  categoryColor: string
  isPaid: boolean
}

export interface DayCashflowStatus {
  dayNumber: number
  dateStr: string // YYYY-MM-DD
  isPast: boolean
  isToday: boolean
  incurredExpensesSum: number
  scheduledIncomeSum: number
  scheduledBillsSum: number
  scheduledBills: ScheduledBill[]
  projectedEndingBalance: number
}

export interface CashflowForecastResult {
  monthStr: string // YYYY-MM
  totalMonthlyIncome: number
  totalSpentSoFar: number
  pendingBillsAmount: number
  projectedEndBalance: number
  isDeficitRisk: boolean
  lowestBalanceDay?: { day: number; balance: number }
  days: DayCashflowStatus[]
  recurringExpenses: RecurringExpense[]
  error?: string
}

export interface MonthAnnualSummary {
  monthStr: string // YYYY-MM
  monthNumber: number // 1..12
  monthName: string
  isPast: boolean
  isCurrent: boolean
  totalIncome: number
  totalFixedBills: number
  actualSpent: number
  projectedSpent: number
  projectedNet: number
  projectedEndingBalance: number
  isDeficitRisk: boolean
  recurringCount: number
}

export interface AnnualCashflowForecastResult {
  year: number
  totalAnnualIncome: number
  totalAnnualSpent: number
  totalAnnualNet: number
  hasDeficitMonths: boolean
  deficitMonthNames: string[]
  months: MonthAnnualSummary[]
  error?: string
}

/**
 * Calcula y devuelve la previsión de cashflow día a día para un mes específico.
 */
export async function fetchCashflowDataAction(
  householdId: string,
  targetMonthStr?: string
): Promise<CashflowForecastResult> {
  const supabase = await createClient()

  // 1. Validar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.', monthStr: '', totalMonthlyIncome: 0, totalSpentSoFar: 0, pendingBillsAmount: 0, projectedEndBalance: 0, isDeficitRisk: false, days: [], recurringExpenses: [] }

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const monthStr = targetMonthStr || currentMonthStr

  const [yearNum, monthNum] = monthStr.split('-').map((v) => parseInt(v, 10))
  const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate()
  const monthStartDateStr = `${monthStr}-01`
  const monthEndDateStr = `${monthStr}-${lastDayOfMonth.toString().padStart(2, '0')}`

  try {
    // 2. Cargar en paralelo: miembros del hogar, ingresos del mes, gastos del mes y gastos recurrentes
    const [membersRes, incomesRes, expensesRes, recurringRes, categoriesRes] = await Promise.all([
      supabase
        .from('household_members')
        .select('user_id, monthly_income')
        .eq('household_id', householdId),
      supabase
        .from('member_incomes')
        .select('user_id, amount')
        .eq('household_id', householdId)
        .eq('month', monthStr),
      supabase
        .from('expenses')
        .select('id, amount, description, expense_date, category_id, categories(name, color)')
        .eq('household_id', householdId)
        .gte('expense_date', monthStartDateStr)
        .lte('expense_date', monthEndDateStr),
      supabase
        .from('recurring_expenses')
        .select('id, household_id, category_id, created_by, name, amount, day_of_month, payment_method, is_active, notes, categories(name, color, icon)')
        .eq('household_id', householdId)
        .eq('is_active', true),
      supabase
        .from('categories')
        .select('id, name, color, icon')
        .eq('household_id', householdId),
    ])

    const members = membersRes.data || []
    const incomes = incomesRes.data || []
    const expenses = expensesRes.data || []
    const recurringExpensesRaw = recurringRes.data || []
    const categories = categoriesRes.data || []

    const recurringExpenses: RecurringExpense[] = recurringExpensesRaw.map((r: any) => ({
      ...r,
      amount: Number(r.amount),
      categories: Array.isArray(r.categories) ? r.categories[0] : r.categories,
    }))

    // 3. Calcular ingresos totales del mes
    let totalMonthlyIncome = 0
    members.forEach((m) => {
      const specificIncome = incomes.find((inc) => inc.user_id === m.user_id)
      const income = specificIncome ? Number(specificIncome.amount) : Number(m.monthly_income || 0)
      totalMonthlyIncome += income
    })

    const todayDateStr = now.toISOString().split('T')[0]
    const todayDayNumber = now.getFullYear() === yearNum && now.getMonth() + 1 === monthNum ? now.getDate() : 99

    // Agrupar gastos reales por fecha
    const expensesByDate: Record<string, number> = {}
    const expensesListByDate: Record<string, any[]> = {}
    expenses.forEach((exp) => {
      const dateKey = exp.expense_date
      expensesByDate[dateKey] = (expensesByDate[dateKey] || 0) + Number(exp.amount)
      if (!expensesListByDate[dateKey]) expensesListByDate[dateKey] = []
      expensesListByDate[dateKey].push(exp)
    })

    const totalSpentSoFar = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Agrupar gastos recurrentes por día del mes
    const recurringByDay: Record<number, RecurringExpense[]> = {}
    recurringExpenses.forEach((rec) => {
      const dayClamped = Math.min(rec.day_of_month, lastDayOfMonth)
      if (!recurringByDay[dayClamped]) recurringByDay[dayClamped] = []
      recurringByDay[dayClamped].push(rec)
    })

    // 4. Construir la previsión día a día (días 1 al lastDayOfMonth)
    let runningBalance = totalMonthlyIncome // Asumimos que los ingresos entran a inicio de mes o día 1
    let pendingBillsAmount = 0
    let isDeficitRisk = false
    let lowestBalance: { day: number; balance: number } | undefined = undefined

    const days: DayCashflowStatus[] = []

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dateStr = `${monthStr}-${day.toString().padStart(2, '0')}`
      const isPast = day < todayDayNumber
      const isToday = day === todayDayNumber

      const incurredExpensesSum = expensesByDate[dateStr] || 0
      const scheduledBillsForDay = recurringByDay[day] || []
      const scheduledBillsSum = scheduledBillsForDay.reduce((sum, b) => sum + b.amount, 0)

      const scheduledBills: ScheduledBill[] = scheduledBillsForDay.map((b) => {
        // Verificar si la factura ya se pagó (si existe un gasto real en este mes con nombre similar o categoría)
        const dateExpenses = expensesListByDate[dateStr] || []
        const isPaid = dateExpenses.some(
          (e) =>
            Math.abs(Number(e.amount) - b.amount) < 1 ||
            e.description.toLowerCase().includes(b.name.toLowerCase())
        )

        return {
          id: b.id,
          name: b.name,
          amount: b.amount,
          category_id: b.category_id,
          categoryName: (b.categories as any)?.name || 'Factura',
          categoryColor: (b.categories as any)?.color || '#64748b',
          isPaid,
        }
      })

      // Si el día aún no ha pasado y la factura no está registrada como gasto, suma a pendientes
      scheduledBills.forEach((b) => {
        if (!b.isPaid && !isPast) {
          pendingBillsAmount += b.amount
        }
      })

      // Actualizar saldo proyectado acumulado
      // En días pasados, descontamos el gasto real incurrido. En días futuros, descontamos la factura prevista si no está pagada.
      if (isPast) {
        runningBalance -= incurredExpensesSum
      } else {
        // Si hay gastos ya registrados en el día presente/futuro
        runningBalance -= incurredExpensesSum
        // Descontar facturas pendientes del día que aún no estén en gastos reales
        const unpaidBillsSum = scheduledBills.filter((b) => !b.isPaid).reduce((sum, b) => sum + b.amount, 0)
        runningBalance -= unpaidBillsSum
      }

      if (runningBalance < 0) {
        isDeficitRisk = true
      }

      if (!lowestBalance || runningBalance < lowestBalance.balance) {
        lowestBalance = { day, balance: runningBalance }
      }

      days.push({
        dayNumber: day,
        dateStr,
        isPast,
        isToday,
        incurredExpensesSum,
        scheduledIncomeSum: day === 1 ? totalMonthlyIncome : 0,
        scheduledBillsSum,
        scheduledBills,
        projectedEndingBalance: Math.round(runningBalance * 100) / 100,
      })
    }

    const projectedEndBalance = Math.round(runningBalance * 100) / 100

    return {
      monthStr,
      totalMonthlyIncome,
      totalSpentSoFar: Math.round(totalSpentSoFar * 100) / 100,
      pendingBillsAmount: Math.round(pendingBillsAmount * 100) / 100,
      projectedEndBalance,
      isDeficitRisk,
      lowestBalanceDay: lowestBalance,
      days,
      recurringExpenses,
    }
  } catch (err: any) {
    console.error('fetchCashflowDataAction error:', err)
    return {
      error: 'Error al calcular la previsión de saldo: ' + (err.message || 'Error desconocido'),
      monthStr,
      totalMonthlyIncome: 0,
      totalSpentSoFar: 0,
      pendingBillsAmount: 0,
      projectedEndBalance: 0,
      isDeficitRisk: false,
      days: [],
      recurringExpenses: [],
    }
  }
}

/**
 * Crea una nueva factura fija / gasto recurrente
 */
export async function createRecurringExpenseAction(
  householdId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const name = formData.get('name') as string
  const amount = formData.get('amount') as string
  const category_id = formData.get('category_id') as string
  const day_of_month = formData.get('day_of_month') as string
  const payment_method = formData.get('payment_method') as string
  const notes = formData.get('notes') as string

  if (!name || !amount || !category_id || !day_of_month) {
    return { error: 'Por favor, completa todos los campos obligatorios.' }
  }

  const numericAmount = parseFloat(amount.replace(',', '.'))
  const dayNum = parseInt(day_of_month, 10)

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { error: 'Introduce un importe válido mayor que 0.' }
  }

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
    return { error: 'El día del mes debe estar entre 1 y 31.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { error } = await supabase.from('recurring_expenses').insert({
    household_id: householdId,
    created_by: user.id,
    category_id,
    name: name.trim(),
    amount: numericAmount,
    day_of_month: dayNum,
    payment_method: payment_method || 'Domiciliación',
    notes: notes ? notes.trim() : null,
    is_active: true,
  })

  if (error) {
    console.error('createRecurringExpenseAction error:', error)
    return { error: 'Error al registrar la factura recurrente.' }
  }

  revalidatePath('/cashflow')
  revalidatePath('/dashboard')
  return { success: 'Factura recurrente registrada con éxito.' }
}

/**
 * Elimina una factura fija / gasto recurrente
 */
export async function deleteRecurringExpenseAction(id: string): Promise<any> {
  const supabase = await createClient()

  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)

  if (error) {
    return { error: 'Error al eliminar la factura recurrente.' }
  }

  revalidatePath('/cashflow')
  revalidatePath('/dashboard')
  return { success: 'Factura recurrente eliminada con éxito.' }
}

/**
 * Convierte una factura fija recurrente en un gasto real ejecutado en el mes.
 */
export async function convertRecurringToExpenseAction(
  householdId: string,
  recurringId: string,
  expenseDate: string
): Promise<any> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // 1. Obtener la factura recurrente
  const { data: rec } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', recurringId)
    .single()

  if (!rec) return { error: 'Factura recurrente no encontrada.' }

  // 2. Insertar como gasto real
  const { error: insertErr } = await supabase.from('expenses').insert({
    household_id: householdId,
    created_by: user.id,
    amount: Number(rec.amount),
    category_id: rec.category_id,
    description: rec.name,
    expense_date: expenseDate,
    payment_method: rec.payment_method || 'Domiciliación',
    notes: `Factura abonada automáticamente (${rec.name})`,
    is_personal: false,
  })

  if (insertErr) {
    console.error('convertRecurringToExpenseAction error:', insertErr)
    return { error: 'Error al convertir la factura a gasto real.' }
  }

  // 3. Notificación al Chat Familiar
  try {
    await supabase.from('messages').insert({
      household_id: householdId,
      created_by: user.id,
      content: `💳 **Factura abonada**: **${Number(rec.amount).toFixed(2)} €** para "${rec.name}" registrado como gasto real.`,
    })
  } catch {}

  revalidatePath('/cashflow')
  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/chat')

  return { success: `Factura "${rec.name}" registrada como gasto real.` }
}

/**
 * Calcula y devuelve la previsión de cashflow mensual para los 12 meses del año especificado.
 */
export async function fetchAnnualCashflowForecastAction(
  householdId: string,
  targetYear?: number
): Promise<AnnualCashflowForecastResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const currentYear = new Date().getFullYear()
  const year = targetYear || currentYear
  const currentMonthIndex = new Date().getMonth() + 1
  const isCurrentYear = new Date().getFullYear() === year

  if (!user) {
    return {
      year,
      totalAnnualIncome: 0,
      totalAnnualSpent: 0,
      totalAnnualNet: 0,
      hasDeficitMonths: false,
      deficitMonthNames: [],
      months: [],
      error: 'Sesión no iniciada.',
    }
  }

  const startDateStr = `${year}-01-01`
  const endDateStr = `${year}-12-31`
  const startMonthStr = `${year}-01`
  const endMonthStr = `${year}-12`

  try {
    const [membersRes, incomesRes, expensesRes, recurringRes] = await Promise.all([
      supabase.from('household_members').select('user_id, monthly_income').eq('household_id', householdId),
      supabase
        .from('member_incomes')
        .select('user_id, amount, month')
        .eq('household_id', householdId)
        .gte('month', startMonthStr)
        .lte('month', endMonthStr),
      supabase
        .from('expenses')
        .select('amount, expense_date')
        .eq('household_id', householdId)
        .gte('expense_date', startDateStr)
        .lte('expense_date', endDateStr),
      supabase
        .from('recurring_expenses')
        .select('id, amount, is_active')
        .eq('household_id', householdId)
        .eq('is_active', true),
    ])

    const members = membersRes.data || []
    const incomes = incomesRes.data || []
    const expenses = expensesRes.data || []
    const recurringExpenses = recurringRes.data || []

    const totalFixedBillsSum = recurringExpenses.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    const recurringCount = recurringExpenses.length

    const expensesByMonth: Record<string, number> = {}
    expenses.forEach((exp) => {
      if (exp.expense_date) {
        const monthKey = exp.expense_date.substring(0, 7)
        expensesByMonth[monthKey] = (expensesByMonth[monthKey] || 0) + Number(exp.amount)
      }
    })

    const months: MonthAnnualSummary[] = []
    let accumulatedBalance = 0
    let totalAnnualIncome = 0
    let totalAnnualSpent = 0
    const deficitMonthNames: string[] = []

    const monthNamesEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    for (let m = 1; m <= 12; m++) {
      const monthStr = `${year}-${m.toString().padStart(2, '0')}`
      const monthName = monthNamesEs[m - 1]

      const isPast = isCurrentYear ? m < currentMonthIndex : year < currentYear
      const isCurrent = isCurrentYear && m === currentMonthIndex

      let monthIncome = 0
      members.forEach((member) => {
        const specificInc = incomes.find((inc) => inc.month === monthStr && inc.user_id === member.user_id)
        monthIncome += specificInc ? Number(specificInc.amount) : Number(member.monthly_income || 0)
      })

      const actualSpent = Math.round((expensesByMonth[monthStr] || 0) * 100) / 100

      let projectedSpent = 0
      if (isPast) {
        projectedSpent = actualSpent
      } else if (isCurrent) {
        projectedSpent = Math.max(actualSpent, totalFixedBillsSum)
      } else {
        projectedSpent = Math.max(actualSpent, totalFixedBillsSum)
      }

      projectedSpent = Math.round(projectedSpent * 100) / 100
      const projectedNet = Math.round((monthIncome - projectedSpent) * 100) / 100

      accumulatedBalance += projectedNet
      accumulatedBalance = Math.round(accumulatedBalance * 100) / 100

      const isDeficitRisk = accumulatedBalance < 0
      if (isDeficitRisk) {
        deficitMonthNames.push(monthName)
      }

      totalAnnualIncome += monthIncome
      totalAnnualSpent += projectedSpent

      months.push({
        monthStr,
        monthNumber: m,
        monthName,
        isPast,
        isCurrent,
        totalIncome: Math.round(monthIncome * 100) / 100,
        totalFixedBills: Math.round(totalFixedBillsSum * 100) / 100,
        actualSpent,
        projectedSpent,
        projectedNet,
        projectedEndingBalance: accumulatedBalance,
        isDeficitRisk,
        recurringCount,
      })
    }

    return {
      year,
      totalAnnualIncome: Math.round(totalAnnualIncome * 100) / 100,
      totalAnnualSpent: Math.round(totalAnnualSpent * 100) / 100,
      totalAnnualNet: Math.round((totalAnnualIncome - totalAnnualSpent) * 100) / 100,
      hasDeficitMonths: deficitMonthNames.length > 0,
      deficitMonthNames,
      months,
    }
  } catch (err: any) {
    console.error('fetchAnnualCashflowForecastAction error:', err)
    return {
      year,
      totalAnnualIncome: 0,
      totalAnnualSpent: 0,
      totalAnnualNet: 0,
      hasDeficitMonths: false,
      deficitMonthNames: [],
      months: [],
      error: 'Error al calcular la previsión anual: ' + (err.message || 'Error desconocido'),
    }
  }
}

