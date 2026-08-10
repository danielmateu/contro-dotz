import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { updateExpenseAction } from '@/app/actions/expense'

interface EditExpensePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  // Await params as strictly required in Next.js 16
  const { id: expenseId } = await params

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

  // Cargar el gasto y validar que pertenece al mismo hogar
  const { data: expense } = await supabase
    .from('expenses')
    .select('id, amount, category_id, description, expense_date, payment_method, notes, household_id')
    .eq('id', expenseId)
    .single()

  if (!expense || expense.household_id !== membership.household_id) {
    notFound()
  }

  // Cargar categorías del hogar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', membership.household_id)
    .order('name')

  // Enlazar el ID del gasto a la Server Action de edición
  const updateActionWithId = updateExpenseAction.bind(null, expenseId)

  return (
    <div className="max-w-xl mx-auto py-2">
      <ExpenseForm
        categories={categories || []}
        action={updateActionWithId}
        initialData={{
          id: expense.id,
          amount: Number(expense.amount),
          category_id: expense.category_id,
          description: expense.description,
          expense_date: expense.expense_date,
          payment_method: expense.payment_method,
          notes: expense.notes,
        }}
      />
    </div>
  )
}
