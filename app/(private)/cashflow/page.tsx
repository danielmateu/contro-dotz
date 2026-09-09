import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { fetchCashflowDataAction, fetchAnnualCashflowForecastAction } from '@/app/actions/cashflow'
import { CashflowSummaryCards } from '@/components/cashflow/cashflow-summary-cards'
import { CashflowCalendarView } from '@/components/cashflow/cashflow-calendar-view'
import { CashflowMonthNavigator } from '@/components/cashflow/cashflow-month-navigator'
import { CashflowAnnualView } from '@/components/cashflow/cashflow-annual-view'
import { RecurringExpensesDialog } from '@/components/cashflow/recurring-expenses-dialog'
import { CalendarCheck } from 'lucide-react'

import { cookies } from 'next/headers'

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
    year?: string
    view?: 'calendar' | 'annual'
  }>
}

export default async function CashflowPage({ searchParams }: CashflowPageProps) {
  const query = await searchParams
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'es'
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

  const activeView = query.view === 'annual' ? 'annual' : 'calendar'
  const yearNum = query.year ? parseInt(query.year, 10) : parseInt(monthStr.split('-')[0], 10) || now.getFullYear()

  // 3. Cargar datos de previsión mensual, anual y categorías
  const [cashflowData, annualData, categoriesRes] = await Promise.all([
    fetchCashflowDataAction(householdId, monthStr),
    fetchAnnualCashflowForecastAction(householdId, yearNum),
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
            {locale === 'en' ? 'Cash Flow Forecast' : locale === 'ca' ? 'Projecció de Flux de Caixa' : 'Previsión de Saldo (Cashflow)'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {locale === 'en'
              ? 'View month-to-month accumulated balance evolution or inspect 12-month annual projections.'
              : locale === 'ca'
                ? 'Visualitza l\'evolució del saldo disponible acumulat mes a mes o consulta la projecció anual.'
                : 'Visualiza la evolución del saldo disponible acumulado mes a mes o consulta la previsión anual a 12 meses.'}
          </p>
        </div>

        <RecurringExpensesDialog
          householdId={householdId}
          categories={categories}
        />
      </div>

      {/* Navegador de Meses & Selector de Vista */}
      <CashflowMonthNavigator
        currentMonthStr={monthStr}
        currentYear={yearNum}
        activeView={activeView}
      />

      {/* Contenido según Vista Seleccionada */}
      {activeView === 'annual' ? (
        <CashflowAnnualView
          annualData={annualData}
          householdId={householdId}
        />
      ) : (
        <>
          {/* Tarjetas Resumen Mensual */}
          <CashflowSummaryCards
            totalMonthlyIncome={cashflowData.totalMonthlyIncome}
            totalSpentSoFar={cashflowData.totalSpentSoFar}
            pendingBillsAmount={cashflowData.pendingBillsAmount}
            projectedEndBalance={cashflowData.projectedEndBalance}
            isDeficitRisk={cashflowData.isDeficitRisk}
            lowestBalanceDay={cashflowData.lowestBalanceDay}
          />

          {/* Calendario Interactivo Mensual */}
          <CashflowCalendarView
            householdId={householdId}
            days={cashflowData.days}
            monthStr={monthStr}
            recurringExpenses={cashflowData.recurringExpenses}
          />
        </>
      )}
    </div>
  )
}

