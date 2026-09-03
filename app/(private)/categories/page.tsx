import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { CategoriesViewClient } from '@/components/categories/categories-view-client'

export const metadata: Metadata = {
  title: 'Categorías',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar hogar activo
  const { activeMembership, activeHouseholdId } = await getActiveHouseholdHelper(user.id)
  if (!activeMembership || !activeHouseholdId) redirect('/household')

  // Cargar las categorías del hogar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color, icon')
    .eq('household_id', activeHouseholdId)
    .order('name')

  return (
    <CategoriesViewClient
      householdId={activeHouseholdId}
      categories={categories || []}
    />
  )
}
