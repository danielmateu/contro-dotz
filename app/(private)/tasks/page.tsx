import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveHouseholdHelper } from '@/lib/household-context'
import { getTasksAction } from '@/app/actions/tasks'
import { TasksViewClient } from '@/components/tasks/tasks-view-client'

export const metadata: Metadata = {
  title: 'Tareas del Hogar | Control Dotz',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function TasksPage() {
  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar hogar activo
  const { activeHouseholdId } = await getActiveHouseholdHelper(user.id)
  const householdId = activeHouseholdId || null

  // Cargar tareas iniciales
  const initialTasks = await getTasksAction(householdId)

  // Cargar miembros del hogar si hay un hogar activo
  let householdMembers: { id: string; displayName: string }[] = []
  if (householdId) {
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id, profiles(display_name, email)')
      .eq('household_id', householdId)

    if (members) {
      householdMembers = members.map((m: any) => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
        const name = profile?.display_name || profile?.email?.split('@')[0] || 'Miembro'
        return {
          id: m.user_id,
          displayName: m.user_id === user.id ? `${name} (Tú)` : name,
        }
      })
    }
  }

  return (
    <TasksViewClient
      initialTasks={initialTasks}
      currentUserId={user.id}
      householdId={householdId}
      householdMembers={householdMembers}
    />
  )
}
