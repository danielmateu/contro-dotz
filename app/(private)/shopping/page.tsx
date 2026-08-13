import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShoppingListWindow } from '@/components/shopping/shopping-list-window'

export const metadata: Metadata = {
  title: 'Lista de la Compra',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ShoppingPage() {
  const supabase = await createClient()

  // Verificar sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar membresía de hogar del usuario
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id, households(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    redirect('/household')
  }

  const householdId = membership.household_id
  const householdName = (membership.households as any)?.name || 'Hogar'

  // Cargar artículos de compra, categorías y miembros del hogar en paralelo
  const [itemsRes, categoriesRes, membersRes] = await Promise.all([
    supabase
      .from('shopping_list')
      .select('id, name, quantity, bought, created_by, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name, color, icon')
      .eq('household_id', householdId)
      .order('name'),
    supabase
      .from('household_members')
      .select('user_id, profiles(display_name, email, avatar_url, status)')
      .eq('household_id', householdId)
  ])

  const initialItems = itemsRes.data || []
  const categories = categoriesRes.data || []
  const membersList = membersRes.data || []

  // Mapear miembros para pasárselos de forma limpia al cliente
  const members = membersList.map((m) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      user_id: m.user_id,
      display_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
      avatar_url: prof?.avatar_url || '',
    }
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          Lista de la Compra
        </h1>
        <p className="text-muted-foreground">
          Añade artículos que hacen falta en el hogar en tiempo real y regístralos como gastos con un solo clic.
        </p>
      </div>

      <ShoppingListWindow
        householdId={householdId}
        householdName={householdName}
        userId={user.id}
        initialItems={initialItems}
        categories={categories}
        members={members}
      />
    </div>
  )
}
