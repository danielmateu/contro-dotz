'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AdminMetrics {
  totalUsers: number
  totalHouseholds: number
  totalExpenses: number
  totalAmountTracked: number
  totalChatMessages: number
  totalAiResponses: number
  recentUsers: Array<{
    id: string
    email: string
    display_name: string | null
    created_at: string
    is_super_admin: boolean
  }>
  recentHouseholds: Array<{
    id: string
    name: string
    created_at: string
  }>
}

/**
 * Comprueba si el usuario autenticado es SuperAdministrador y obtiene las métricas globales
 */
export async function getAdminMetricsAction(): Promise<{
  data?: AdminMetrics
  error?: string
}> {
  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Verificar si es SuperAdmin en la tabla profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  const isSuperAdmin = profile?.is_super_admin ?? false

  if (!isSuperAdmin) {
    return { error: 'No tienes permisos de SuperAdministrador para acceder a esta área.' }
  }

  // 3. Obtener métricas globales del sistema
  const [
    { count: totalUsers },
    { count: totalHouseholds },
    { count: totalExpenses },
    { data: expensesSumData },
    { count: totalChatMessages },
    { count: totalAiResponses },
    { data: recentUsers },
    { data: recentHouseholds },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('households').select('*', { count: 'exact', head: true }),
    supabase.from('expenses').select('*', { count: 'exact', head: true }),
    supabase.from('expenses').select('amount'),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', '00000000-0000-0000-0000-000000000000'),
    supabase
      .from('profiles')
      .select('id, email, display_name, created_at, is_super_admin')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('households')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalAmountTracked = (expensesSumData || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  return {
    data: {
      totalUsers: totalUsers || 0,
      totalHouseholds: totalHouseholds || 0,
      totalExpenses: totalExpenses || 0,
      totalAmountTracked: Math.round(totalAmountTracked * 100) / 100,
      totalChatMessages: totalChatMessages || 0,
      totalAiResponses: totalAiResponses || 0,
      recentUsers: recentUsers || [],
      recentHouseholds: recentHouseholds || [],
    },
  }
}
