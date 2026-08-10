import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { createExpenseAction } from '@/app/actions/expense'

export default async function NewExpensePage() {
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

  // Cargar categorías del hogar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('household_id', membership.household_id)
    .order('name')

  // Enlazar el ID del hogar a la Server Action de creación
  const createActionWithId = createExpenseAction.bind(
    null,
    membership.household_id
  )

  return (
    <div className="max-w-xl mx-auto py-2">
      <ExpenseForm categories={categories || []} action={createActionWithId} />
    </div>
  )
}
