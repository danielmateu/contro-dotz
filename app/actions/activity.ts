'use server'

import { createClient } from '@/lib/supabase/server'

export interface ActivityEvent {
  id: string
  type: 'expense' | 'message' | 'shopping_add' | 'shopping_bought' | 'saving_contribution'
  title: string
  amount?: number
  user_name: string
  avatar_url?: string
  date: string
}

/**
 * Obtiene las actividades recientes agregadas de un hogar
 */
export async function getRecentActivityAction(householdId: string): Promise<ActivityEvent[]> {
  try {
    const supabase = await createClient()

    // Verificar sesión y acceso al hogar
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data: isMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!isMember) return []

    // Hacer las consultas en paralelo
    const [expensesRes, messagesRes, shoppingRes, savingsRes] = await Promise.all([
      // 1. Gastos recientes
      supabase
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          created_at,
          profiles:created_by (display_name, email, avatar_url),
          categories (name)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(5),

      // 2. Mensajes de chat recientes (excluyendo bot si queremos o incluyendo)
      supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          is_bot,
          profiles:created_by (display_name, email, avatar_url)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(5),

      // 3. Ítems recientes de lista de compra
      supabase
        .from('shopping_list')
        .select(`
          id,
          name,
          bought,
          created_at,
          profiles:created_by (display_name, email, avatar_url)
        `)
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(5),

      // 4. Aportaciones recientes a metas de ahorro
      supabase
        .from('saving_contributions')
        .select(`
          id,
          amount,
          created_at,
          profiles:user_id (display_name, email, avatar_url),
          saving_goals!inner (name, household_id)
        `)
        .eq('saving_goals.household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const events: ActivityEvent[] = []

    // Procesar Gastos
    const expenses = expensesRes.data || []
    expenses.forEach((e: any) => {
      const prof = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
      const cat = Array.isArray(e.categories) ? e.categories[0] : e.categories
      events.push({
        id: e.id,
        type: 'expense',
        title: `registró un gasto de **${Number(e.amount).toFixed(2)}€** en **"${e.description}"** (${cat?.name || 'Otros'})`,
        amount: Number(e.amount),
        user_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
        avatar_url: prof?.avatar_url || '',
        date: e.created_at,
      })
    })

    // Procesar Mensajes
    const messages = messagesRes.data || []
    messages.forEach((m: any) => {
      if (m.is_bot) {
        events.push({
          id: m.id,
          type: 'message',
          title: `el **Asistente Gemini AI** envió un análisis o sugerencia al chat`,
          user_name: 'Gemini AI',
          avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop',
          date: m.created_at,
        })
      } else {
        const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        events.push({
          id: m.id,
          type: 'message',
          title: `envió un mensaje al chat familiar`,
          user_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
          avatar_url: prof?.avatar_url || '',
          date: m.created_at,
        })
      }
    })

    // Procesar Lista de compra
    const shopping = shoppingRes.data || []
    shopping.forEach((s: any) => {
      const prof = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
      events.push({
        id: s.id,
        type: s.bought ? 'shopping_bought' : 'shopping_add',
        title: s.bought 
          ? `marcó como comprado **"${s.name}"** en la lista` 
          : `añadió **"${s.name}"** a la lista de la compra`,
        user_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
        avatar_url: prof?.avatar_url || '',
        date: s.created_at,
      })
    })

    // Procesar Ahorros
    const savings = savingsRes.data || []
    savings.forEach((s: any) => {
      const prof = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
      const goal = Array.isArray(s.saving_goals) ? s.saving_goals[0] : s.saving_goals
      events.push({
        id: s.id,
        type: 'saving_contribution',
        title: `aportó **${Number(s.amount).toFixed(2)}€** a la hucha **"${goal?.name || 'Ahorros'}"**`,
        amount: Number(s.amount),
        user_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
        avatar_url: prof?.avatar_url || '',
        date: s.created_at,
      })
    })

    // Ordenar todas las actividades por fecha decreciente
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Retornar las 10 más recientes
    return events.slice(0, 10)
  } catch (err) {
    console.error('getRecentActivityAction Error:', err)
    return []
  }
}
