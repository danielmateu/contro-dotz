import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SaveBudgetForm } from '@/components/budgets/save-budget-form'
import { MonthSelector } from '@/components/budgets/month-selector'
import { DeleteBudgetButton } from '@/components/budgets/delete-budget-button'
import { formatCurrency } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { saveBudgetAction } from '@/app/actions/budget'
import { PiggyBank, Calendar, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'

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

  // Cargar membresía
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

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
      .eq('household_id', membership.household_id)
      .eq('month', month),
    supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', membership.household_id)
      .order('name'),
    supabase
      .from('expenses')
      .select('amount, category_id')
      .eq('household_id', membership.household_id)
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
  const saveActionWithId = saveBudgetAction.bind(null, membership.household_id)

  // Formatear mes en letras para el título (ej: agosto de 2026)
  const monthDate = new Date(year, monthNum - 1)
  const monthName = monthDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Presupuestos Mensuales
          </h1>
          <p className="text-muted-foreground">
            Establece y controla los límites de gasto mensual para cada categoría.
          </p>
        </div>

        {/* Selector de mes interactivo */}
        <MonthSelector defaultMonth={month} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulario lateral */}
        <div className="md:col-span-1">
          <SaveBudgetForm
            categories={categories || []}
            month={month}
            action={saveActionWithId}
          />
        </div>

        {/* Listado y Progreso */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg capitalize">
                Presupuestos de {monthName}
              </CardTitle>
              <CardDescription>
                Resumen de gastos frente al límite establecido para este mes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!budgets || budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PiggyBank className="h-12 w-12 text-slate-400 stroke-1 mb-3" />
                  <h4 className="font-semibold font-heading">
                    No hay presupuestos asignados
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-xs mt-1">
                    Establece presupuestos para tus categorías de gastos en el formulario
                    de la izquierda.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {budgets.map((budget) => {
                    const category = budget.categories as any
                    const spent = categorySpentMap[budget.category_id] || 0
                    const limit = Number(budget.amount)
                    const percent = limit > 0 ? (spent / limit) * 100 : 0
                    const LucideIconComp = category?.icon
                      ? ((Icons as any)[category.icon] as LucideIcon)
                      : null

                    // Determinar colores del progreso
                    let progressColor = 'bg-emerald-500'
                    let textColor = 'text-emerald-600 dark:text-emerald-400'
                    let bgProgress = 'bg-emerald-100 dark:bg-emerald-950/30'

                    if (percent >= 100) {
                      progressColor = 'bg-destructive animate-pulse'
                      textColor = 'text-destructive font-semibold'
                      bgProgress = 'bg-destructive/10'
                    } else if (percent >= 80) {
                      progressColor = 'bg-amber-500'
                      textColor = 'text-amber-600 dark:text-amber-400 font-semibold'
                      bgProgress = 'bg-amber-100 dark:bg-amber-950/30'
                    }

                    return (
                      <div
                        key={budget.id}
                        className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 bg-muted/10 hover:bg-muted/20 transition-all"
                      >
                        {/* Cabecera del presupuesto */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center shadow-xs border"
                              style={{
                                backgroundColor: `${category?.color || '#cbd5e1'}15`,
                                color: category?.color || '#64748b',
                              }}
                            >
                              {LucideIconComp ? (
                                <LucideIconComp className="h-4 w-4" />
                              ) : (
                                <Icons.Tag className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground">
                                {category?.name || 'Categoría eliminada'}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Límite: {formatCurrency(limit)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                {formatCurrency(spent)} gastados
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider font-semibold ${textColor}`}>
                                {percent.toFixed(0)}% consumido
                              </span>
                            </div>

                            <DeleteBudgetButton
                              budgetId={budget.id}
                              categoryName={category?.name || 'Categoría'}
                              month={month}
                            />
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="space-y-1">
                          <div className={`h-2.5 w-full rounded-full overflow-hidden ${bgProgress}`}>
                            <div
                              className={`h-full transition-all duration-300 ${progressColor}`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>

                          {/* Alertas */}
                          {percent >= 100 ? (
                            <div className="flex items-center gap-1 text-[11px] text-destructive font-medium pt-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              ¡Presupuesto superado! Has gastado {formatCurrency(spent - limit)} de más.
                            </div>
                          ) : percent >= 80 ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1">
                              <Info className="h-3 w-3 shrink-0" />
                              Atención: Estás a punto de superar el límite de esta categoría.
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              Presupuesto bajo control.
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
