'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface HouseholdTask {
  id: string
  household_id: string | null
  user_id: string
  assigned_to: string | null
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_private: boolean
  due_date: string | null
  xp_reward: number
  completed_at: string | null
  completed_by: string | null
  created_at: string
  updated_at: string
  creator_name?: string
  assignee_name?: string
  assignee_avatar?: string
}

const PRIORITY_XP: Record<string, number> = {
  low: 10,
  medium: 15,
  high: 25,
  urgent: 40,
}

/**
 * Obtener las tareas del usuario (privadas del usuario + compartidas del hogar activo)
 */
export async function getTasksAction(householdId?: string | null): Promise<HouseholdTask[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  let query = supabase
    .from('household_tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (householdId) {
    query = query.or(`is_private.eq.true,household_id.eq.${householdId}`)
  } else {
    query = query.eq('user_id', user.id).eq('is_private', true)
  }

  const { data: tasks, error } = await query

  if (error || !tasks) {
    console.error('Error fetching household tasks:', error)
    return []
  }

  // Cargar perfiles de usuarios asignados y creadores para mostrar nombres
  const memberIds = Array.from(
    new Set(tasks.flatMap(t => [t.user_id, t.assigned_to, t.completed_by]).filter(Boolean))
  ) as string[]

  let profileMap = new Map<string, { display_name: string; avatar_url?: string }>()
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', memberIds)

    if (profiles) {
      profiles.forEach(p => profileMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url }))
    }
  }

  return tasks.map(t => ({
    ...t,
    creator_name: profileMap.get(t.user_id)?.display_name || 'Usuario',
    assignee_name: t.assigned_to ? profileMap.get(t.assigned_to)?.display_name : undefined,
    assignee_avatar: t.assigned_to ? profileMap.get(t.assigned_to)?.avatar_url : undefined,
  }))
}

/**
 * Crear una nueva tarea del hogar o privada
 */
export async function createTaskAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const priority = (formData.get('priority') as string) || 'medium'
  const isPrivate = formData.get('is_private') === 'true'
  const householdId = isPrivate ? null : (formData.get('household_id') as string) || null
  const assignedTo = (formData.get('assigned_to') as string) || null
  const dueDate = (formData.get('due_date') as string) || null

  if (!title) {
    return { success: false, error: 'El título de la tarea es obligatorio' }
  }

  const xpReward = PRIORITY_XP[priority] || 15

  const { error } = await supabase.from('household_tasks').insert({
    household_id: householdId,
    user_id: user.id,
    assigned_to: assignedTo,
    title,
    description,
    priority,
    is_private: isPrivate,
    due_date: dueDate ? new Date(dueDate).toISOString() : null,
    xp_reward: xpReward,
    status: 'pending',
  })

  if (error) {
    console.error('Error creating task:', error)
    return { success: false, error: 'Error al crear la tarea en la base de datos' }
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Actualizar el estado de una tarea (Pendiente, En Proceso, Completada)
 * Si se marca como completada, se otorga recompensa de XP/Coins a Dotzi.
 */
export async function updateTaskStatusAction(
  taskId: string,
  newStatus: 'pending' | 'in_progress' | 'completed'
): Promise<{ success: boolean; error?: string; xpEarned?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Usuario no autenticado' }

  // Obtener tarea previa
  const { data: task, error: fetchErr } = await supabase
    .from('household_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (fetchErr || !task) {
    return { success: false, error: 'Tarea no encontrada' }
  }

  const isCompleting = newStatus === 'completed' && task.status !== 'completed'

  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (isCompleting) {
    updateData.completed_at = new Date().toISOString()
    updateData.completed_by = user.id
  } else if (newStatus !== 'completed') {
    updateData.completed_at = null
    updateData.completed_by = null
  }

  const { error: updateErr } = await supabase
    .from('household_tasks')
    .update(updateData)
    .eq('id', taskId)

  if (updateErr) {
    console.error('Error updating task status:', updateErr)
    return { success: false, error: 'Error al actualizar el estado de la tarea' }
  }

  let xpEarned = 0
  if (isCompleting) {
    xpEarned = task.xp_reward || 15

    // Otorgar XP y Monedas al Tamagotchi del usuario
    try {
      const { data: gs } = await supabase
        .from('user_game_state')
        .select('coins, friendship_points')
        .eq('user_id', user.id)
        .maybeSingle()

      const currentCoins = gs?.coins ?? 100
      const currentFp = gs?.friendship_points ?? 0
      const newCoins = currentCoins + Math.round(xpEarned * 0.8)
      const newFp = currentFp + xpEarned

      if (gs) {
        await supabase
          .from('user_game_state')
          .update({
            coins: newCoins,
            friendship_points: newFp,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('user_game_state')
          .upsert({
            user_id: user.id,
            coins: newCoins,
            friendship_points: newFp,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
      }

      // Notificar en el chat del hogar si es una tarea compartida
      if (!task.is_private && task.household_id) {
        const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
        const userName = profile?.display_name || 'Un miembro'
        await supabase.from('messages').insert({
          household_id: task.household_id,
          created_by: user.id,
          content: `✅ **Tarea Completada:** **${userName}** ha completado **"${task.title}"** (+${xpEarned} XP para Dotzi) 🐾📋`,
        })
      }
    } catch (gameErr) {
      console.error('Error rewarding task completion in game state:', gameErr)
    }
  }

  revalidatePath('/tasks')
  revalidatePath('/dashboard')
  return { success: true, xpEarned: isCompleting ? xpEarned : 0 }
}

/**
 * Editar detalles de una tarea existente
 */
export async function updateTaskAction(taskId: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const priority = (formData.get('priority') as string) || 'medium'
  const isPrivate = formData.get('is_private') === 'true'
  const householdId = isPrivate ? null : (formData.get('household_id') as string) || null
  const assignedTo = (formData.get('assigned_to') as string) || null
  const dueDate = (formData.get('due_date') as string) || null

  if (!title) {
    return { success: false, error: 'El título de la tarea es obligatorio' }
  }

  const xpReward = PRIORITY_XP[priority] || 15

  const { error } = await supabase
    .from('household_tasks')
    .update({
      household_id: householdId,
      assigned_to: assignedTo,
      title,
      description,
      priority,
      is_private: isPrivate,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      xp_reward: xpReward,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task:', error)
    return { success: false, error: 'Error al actualizar la tarea' }
  }

  revalidatePath('/tasks')
  return { success: true }
}

/**
 * Eliminar una tarea
 */
export async function deleteTaskAction(taskId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Usuario no autenticado' }

  const { error } = await supabase
    .from('household_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: 'Error al eliminar la tarea' }
  }

  revalidatePath('/tasks')
  return { success: true }
}
