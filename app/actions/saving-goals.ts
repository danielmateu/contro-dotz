'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Crea una meta de ahorro
 */
export async function createSavingGoalAction(
  householdId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const name = formData.get('name') as string
  const target_amount_str = formData.get('target_amount') as string
  const target_date = formData.get('target_date') as string || null

  if (!name || name.trim().length === 0) {
    return { error: 'El nombre de la meta es obligatorio.' }
  }

  let target_amount = 0
  if (target_amount_str && target_amount_str.trim() !== '') {
    target_amount = parseFloat(target_amount_str.replace(',', '.'))
    if (isNaN(target_amount) || target_amount < 0) {
      return { error: 'El importe objetivo debe ser un número válido mayor o igual a 0.' }
    }
  }

  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // Insertar meta
  const { error } = await supabase.from('saving_goals').insert({
    household_id: householdId,
    name: name.trim(),
    target_amount,
    target_date: target_date || null,
    created_by: user.id,
  })

  if (error) {
    console.error('CREATE SAVING GOAL ERROR:', error)
    return { error: 'Error al registrar la meta de ahorro en la base de datos.' }
  }

  // Notificación en el chat familiar
  try {
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    const userName = profile?.display_name || 'Miembro'
    const goalText = target_amount > 0 
      ? `🎯 **Nueva meta creada**: **${userName}** ha propuesto la meta de ahorro **"${name.trim()}"** con un objetivo de **${target_amount.toFixed(2)}€**`
      : `🐷 **Nueva hucha libre creada**: **${userName}** ha abierto la hucha libre **"${name.trim()}"** (ahorro sin meta fija) 💰`
    
    await supabase.from('messages').insert({
      household_id: householdId,
      created_by: user.id,
      content: goalText,
    })
  } catch (chatError) {
    console.error(chatError)
  }

  revalidatePath('/saving-goals')
  revalidatePath('/dashboard')
  revalidatePath('/chat')
  return { success: 'Hucha de ahorro registrada con éxito.' }
}

/**
 * Añade una aportación a una meta de ahorro
 */
export async function addSavingContributionAction(
  goalId: string,
  householdId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const amount_str = formData.get('amount') as string

  const amount = parseFloat(amount_str.replace(',', '.'))
  if (isNaN(amount) || amount <= 0) {
    return { error: 'El importe de la aportación debe ser un número mayor que 0.' }
  }

  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // Obtener estado actual de la meta antes de la aportación para verificar si se completa al 100%
  const { data: goalData } = await supabase
    .from('saving_goals')
    .select('name, target_amount, current_amount')
    .eq('id', goalId)
    .single()

  const prevAmount = Number(goalData?.current_amount || 0)
  const targetAmount = Number(goalData?.target_amount || 0)
  const goalName = goalData?.name || 'Hucha'
  const isGoalCompleted100 = targetAmount > 0 && prevAmount < targetAmount && (prevAmount + amount) >= targetAmount

  // Insertar aportación (el trigger de la base de datos actualizará el current_amount en la meta)
  const { error } = await supabase.from('saving_contributions').insert({
    goal_id: goalId,
    user_id: user.id,
    amount,
  })

  if (error) {
    console.error('ADD SAVING CONTRIBUTION ERROR:', error)
    return { error: 'Error al registrar la aportación de ahorro en la base de datos.' }
  }

  // Notificación en el chat familiar
  try {
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    const userName = profile?.display_name || 'Miembro'

    if (isGoalCompleted100) {
      // Mensaje de gran logro en el chat
      await supabase.from('messages').insert({
        household_id: householdId,
        created_by: user.id,
        content: `🎉 **¡META DE AHORRO ALCANZADA AL 100%!** 🏆 **${userName}** ha realizado la aportación definitiva a la meta **"${goalName}"** alcanzando los **${targetAmount.toFixed(2)}€**. ¡Dotzi gana **+100 Monedas Dotzi** de celebración! 🐷✨`,
      })
    } else {
      await supabase.from('messages').insert({
        household_id: householdId,
        created_by: user.id,
        content: `🐷 **Aportación al ahorro**: **${userName}** ha añadido **${amount.toFixed(2)}€** a la hucha **"${goalName}"** 💰`,
      })
    }
  } catch (chatError) {
    console.error(chatError)
  }

  revalidatePath('/saving-goals')
  revalidatePath('/dashboard')
  revalidatePath('/chat')
  return {
    success: 'Aportación registrada con éxito.',
    isGoalCompleted100,
    goalName,
    targetAmount,
  }
}

/**
 * Elimina una meta de ahorro
 */
export async function deleteSavingGoalAction(goalId: string, householdId: string): Promise<any> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('saving_goals')
    .delete()
    .eq('id', goalId)
    .eq('household_id', householdId)

  if (error) {
    console.error('DELETE SAVING GOAL ERROR:', error)
    return { error: 'Error al eliminar la meta de ahorro.' }
  }

  revalidatePath('/saving-goals')
  revalidatePath('/dashboard')
  return { success: 'Meta de ahorro eliminada con éxito.' }
}

/**
 * Elimina una aportación de ahorro
 */
export async function deleteSavingContributionAction(contributionId: string): Promise<any> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('saving_contributions')
    .delete()
    .eq('id', contributionId)

  if (error) {
    console.error('DELETE SAVING CONTRIBUTION ERROR:', error)
    return { error: 'Error al eliminar la aportación de ahorro.' }
  }

  revalidatePath('/saving-goals')
  revalidatePath('/dashboard')
  return { success: 'Aportación eliminada con éxito.' }
}
