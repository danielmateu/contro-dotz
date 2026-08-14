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
    .select('household_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

  const isOwner = membership.role === 'owner'

  // Cargar categorías y miembros en paralelo
  const [categoriesRes, membersRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('household_id', membership.household_id)
      .order('name'),
    supabase
      .from('household_members')
      .select('user_id, profiles(display_name)')
      .eq('household_id', membership.household_id)
  ])

  const categories = categoriesRes.data
  const members = (membersRes.data || []).map((m: any) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      id: m.user_id,
      name: profile?.display_name || profile?.email?.split('@')[0] || 'Miembro',
    }
  })

  // Enlazar el ID del hogar a la Server Action de creación
  const createActionWithId = createExpenseAction.bind(
    null,
    membership.household_id
  )

  return (
    <div className="max-w-xl mx-auto py-2">
      <ExpenseForm
        categories={categories || []}
        action={createActionWithId}
        members={members}
        currentUserId={user.id}
        isOwner={isOwner}
      />
    </div>
  )
}
