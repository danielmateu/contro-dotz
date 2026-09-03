import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { ChatWindow } from '@/components/chat/chat-window'

export const metadata: Metadata = {
  title: 'Chat Familiar',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ChatPage() {
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

  // Cargar miembros del hogar y últimos 50 mensajes en paralelo
  const [membersRes, messagesRes] = await Promise.all([
    supabase
      .from('household_members')
      .select('user_id, role, profiles(display_name, email, avatar_url, status)')
      .eq('household_id', householdId),
    supabase
      .from('messages')
      .select('id, content, created_at, created_by, updated_at, is_deleted')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(100)
  ])

  const membersList = membersRes.data || []
  const initialMessages = [...(messagesRes.data || [])].reverse()

  // Mapear miembros para tener una lista limpia
  const members = membersList.map((m) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
    return {
      user_id: m.user_id,
      role: m.role,
      display_name: prof?.display_name || prof?.email?.split('@')[0] || 'Miembro',
      avatar_url: prof?.avatar_url || '',
      status: prof?.status || '',
      email: prof?.email || '',
    }
  })

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-5xl mx-auto">
      <ChatWindow
        householdId={householdId}
        householdName={householdName}
        userId={user.id}
        initialMessages={initialMessages}
        members={members}
      />
    </div>
  )
}
