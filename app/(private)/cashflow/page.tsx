import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { fetchCashflowDataAction } from '@/app/actions/cashflow'
import { CashflowSummaryCards } from '@/components/cashflow/cashflow-summary-cards'
import { CashflowCalendarView } from '@/components/cashflow/cashflow-calendar-view'
import { RecurringExpensesDialog } from '@/components/cashflow/recurring-expenses-dialog'
import { CalendarCheck, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Previsión de Saldo & Cashflow',
  robots: {
    index: false,
    follow: false,
  },
}

interface CashflowPageProps {
  searchParams: Promise<{
    month?: string
  }>
}

export default async function CashflowPage({ searchParams }: CashflowPageProps) {
  const query = await searchParams
  const supabase = await createClient()

  // 1. Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Obtener hogar activo
  const { activeMembership, activeHouseholdId } = await getActiveHouseholdHelper(user.id)
  if (!activeMembership || !activeHouseholdId) redirect('/household')

  const householdId = activeHouseholdId
  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  const monthStr = query.month || currentMonthStr

  // 3. Cargar datos de previsión y categorías
  const [cashflowData, categoriesRes] = await Promise.all([
    fetchCashflowDataAction(householdId, monthStr),
    supabase
      .from('categories')
      .select('id, name, color')
      .eq('household_id', householdId)
      .order('name'),
  ])

  const categories = categoriesRes.data || []

  return (
    <div className="space-y-6">
      {/* Título & Botón de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2.5">
            <CalendarCheck className="w-8 h-8 text-primary" />
            Previsión de Saldo (Cashflow)
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualiza la evolución del saldo disponible acumulado hasta fin de mes y prevé recibos fijos.
          </p>
        </div>

        <RecurringExpensesDialog
          householdId={householdId}
          categories={categories}
        />
      </div>

      {/* Tarjetas Resumen */}
      <CashflowSummaryCards
        totalMonthlyIncome={cashflowData.totalMonthlyIncome}
        totalSpentSoFar={cashflowData.totalSpentSoFar}
        pendingBillsAmount={cashflowData.pendingBillsAmount}
        projectedEndBalance={cashflowData.projectedEndBalance}
        isDeficitRisk={cashflowData.isDeficitRisk}
        lowestBalanceDay={cashflowData.lowestBalanceDay}
      />

      {/* Calendario Interactivo */}
      <CashflowCalendarView
        householdId={householdId}
        days={cashflowData.days}
        monthStr={monthStr}
        recurringExpenses={cashflowData.recurringExpenses}
      />
    </div>
  )
}
