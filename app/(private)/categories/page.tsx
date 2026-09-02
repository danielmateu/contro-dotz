import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

  // Cargar membresía
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect('/household')

  // Cargar las categorías del hogar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color, icon')
    .eq('household_id', membership.household_id)
    .order('name')

  return (
    <CategoriesViewClient
      householdId={membership.household_id}
      categories={categories || []}
    />
  )
}
