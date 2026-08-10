import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExpenseFilters } from '@/components/expenses/expense-filters'
import { DeleteExpenseButton } from '@/components/expenses/delete-expense-button'
import { formatCurrency, formatDate } from '@/lib/format'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Receipt, Calendar, CreditCard, Tag } from 'lucide-react'

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
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

  // Cargar categorías para filtros
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', membership.household_id)
    .order('name')

  // Cargar miembros del hogar para filtros
  const { data: members } = await supabase
    .from('household_members')
    .select('user_id, profiles(display_name)')
    .eq('household_id', membership.household_id)

  // Consulta de gastos
  let dbQuery = supabase
    .from('expenses')
    .select(
      'id, amount, description, expense_date, payment_method, notes, created_by, categories(name, color, icon), profiles:created_by(display_name)'
    )
    .eq('household_id', membership.household_id)

  // Aplicar filtros
  if (startDate) {
    dbQuery = dbQuery.gte('expense_date', startDate)
  }
  if (endDate) {
    dbQuery = dbQuery.lte('expense_date', endDate)
  }
  if (categoryId) {
    dbQuery = dbQuery.eq('category_id', categoryId)
  }
  if (memberId) {
    dbQuery = dbQuery.eq('created_by', memberId)
  }

  // Aplicar ordenación
  if (sortBy === 'date_asc') {
    dbQuery = dbQuery
      .order('expense_date', { ascending: true })
      .order('created_at', { ascending: true })
  } else if (sortBy === 'amount_desc') {
    dbQuery = dbQuery.order('amount', { ascending: false })
  } else if (sortBy === 'amount_asc') {
    dbQuery = dbQuery.order('amount', { ascending: true })
  } else {
    // Default: date_desc
    dbQuery = dbQuery
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
  }

  const { data: expenses } = await dbQuery

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
            Gastos Diarios
          </h1>
          <p className="text-muted-foreground">
            Consulta, filtra y registra los gastos diarios de tu familia.
          </p>
        </div>

        <Link
          href="/expenses/new"
          className={buttonVariants({ variant: 'default' })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar Gasto
        </Link>
      </div>

      {/* Componente de Filtros */}
      <ExpenseFilters
        categories={categories || []}
        members={(members as any) || []}
      />

      {/* Tabla de Resultados */}
      {!expenses || expenses.length === 0 ? (
        <Card className="border-slate-200/50 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <Receipt className="h-8 w-8 stroke-1 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground font-heading">
              No se han encontrado gastos
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 leading-relaxed">
              {startDate || endDate || categoryId || memberId
                ? 'No hay gastos que coincidan con los filtros seleccionados. Intenta ajustarlos o limpiarlos.'
                : 'Aún no se ha registrado ningún gasto en este hogar. ¡Empieza añadiendo tu primer gasto familiar!'}
            </p>
            {!startDate && !endDate && !categoryId && !memberId && (
              <Link
                href="/expenses/new"
                className={buttonVariants({ variant: 'default', className: 'mt-6' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar primer gasto
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200/50 shadow-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const category = expense.categories as any
                const creator = expense.profiles as any
                const expenseDateFormatted = formatDate(
                  expense.expense_date,
                  'dd/MM/yyyy'
                )

                return (
                  <TableRow key={expense.id} className="hover:bg-muted/10">
                    {/* Fecha */}
                    <TableCell className="font-medium whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {expenseDateFormatted}
                      </span>
                    </TableCell>

                    {/* Concepto / Notas */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {expense.description}
                        </span>
                        {expense.notes && (
                          <span className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                            {expense.notes}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Categoría */}
                    <TableCell>
                      {category ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{
                          backgroundColor: `${category.color}15`,
                          color: category.color,
                        }}>
                          <Tag className="h-3 w-3" />
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sin categoría
                        </span>
                      )}
                    </TableCell>

                    {/* Método de pago */}
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        {expense.payment_method}
                      </span>
                    </TableCell>

                    {/* Creador */}
                    <TableCell className="text-muted-foreground">
                      {creator?.display_name || 'Desconocido'}
                    </TableCell>

                    {/* Importe */}
                    <TableCell className="text-right font-bold text-slate-900 dark:text-slate-50 text-base">
                      {formatCurrency(expense.amount)}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/expenses/${expense.id}/edit`}
                          className={buttonVariants({
                            variant: 'ghost',
                            size: 'icon',
                            className:
                              'text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8',
                          })}
                          aria-label={`Editar gasto: ${expense.description}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <DeleteExpenseButton
                          expenseId={expense.id}
                          description={expense.description}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
