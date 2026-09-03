import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { ShoppingViewClient } from '@/components/shopping/shopping-view-client'

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

  // Cargar hogar activo
  const { activeMembership, activeHouseholdId } = await getActiveHouseholdHelper(user.id)
  if (!activeMembership || !activeHouseholdId) redirect('/household')

  const householdId = activeHouseholdId
  const householdName = activeMembership.households.name

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
    <ShoppingViewClient
      householdId={householdId}
      householdName={householdName}
      userId={user.id}
      initialItems={initialItems}
      categories={categories}
      members={members}
    />
  )
}
