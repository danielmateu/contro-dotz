'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { askGeminiAction } from '@/app/actions/gemini'

/**
 * Server Action para enviar un mensaje en el chat familiar
 */
export async function sendMessageAction(
  householdId: string,
  content: string
): Promise<{ success?: boolean; error?: string; message?: any }> {
  try {
    const trimmed = content.trim()
    if (!trimmed) {
      return { error: 'El mensaje no puede estar vacío.' }
    }

    const supabase = await createClient()

    // 1. Validar usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesión no iniciada.' }

    // 2. Verificar pertenencia al hogar
    const { data: isMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!isMember) {
      return { error: 'No perteneces a este hogar.' }
    }

    // 3. Insertar el mensaje
    const { data: inserted, error: insertError } = await supabase
      .from('messages')
      .insert({
        household_id: householdId,
        content: trimmed,
        created_by: user.id,
      })
      .select('id, content, created_at, created_by, updated_at, is_deleted')
      .single()

    if (insertError) {
      console.error('sendMessageAction Error:', insertError)
      return { error: 'Error al registrar el mensaje en la base de datos.' }
    }

    // 4. Si el mensaje es una afirmación/cancelación simple, comprobar si hay una acción pendiente reciente
    const lowerTrimmed = trimmed.toLowerCase()
    const isAffirmative = ['si', 'sí', 'confirmar', 'adelante', 'aceptar', 'dale', 'continuar'].includes(lowerTrimmed)
    const isNegative = ['no', 'cancelar', 'rechazar', 'pasar'].includes(lowerTrimmed)

    if (isAffirmative || isNegative) {
      // Buscar el último mensaje con PENDING_ACTION y status pending
      const { data: pendingMsgs } = await supabase
        .from('messages')
        .select('id, content')
        .eq('household_id', householdId)
        .like('content', '%<!--PENDING_ACTION:%')
        .order('created_at', { ascending: false })
        .limit(5)

      const activePending = pendingMsgs?.find((m) => m.content.includes('"status":"pending"'))
      if (activePending) {
        const match = activePending.content.match(/<!--PENDING_ACTION:(.*?)-->/)
        if (match && match[1]) {
          try {
            const actionData = JSON.parse(match[1])
            if (isAffirmative) {
              await confirmChatAction(activePending.id, actionData)
            } else {
              await cancelChatAction(activePending.id)
            }
            revalidatePath('/chat')
            return { success: true, message: inserted }
          } catch (pErr) {
            console.error('Error procesando respuesta rápida a PENDING_ACTION:', pErr)
          }
        }
      }
    }

    // 5. Si el mensaje menciona a @gemini, invocar al asistente Gemini
    if (trimmed.toLowerCase().includes('@gemini')) {
      try {
        await askGeminiAction(householdId, trimmed)
      } catch (geminiErr) {
        console.error('Error al invocar a Gemini desde sendMessageAction:', geminiErr)
      }
    }

    revalidatePath('/chat')
    return { success: true, message: inserted }
  } catch (err: any) {
    console.error('sendMessageAction Catch Error:', err)
    return { error: 'Error inesperado al enviar el mensaje.' }
  }
}

/**
 * Server Action para confirmar y ejecutar una acción propuesta por el Chat
 */
export async function confirmChatAction(
  messageId: string,
  actionData: { action: string; params: any }
): Promise<{ success?: boolean; error?: string; resultMessage?: string }> {
  try {
    const supabase = await createClient()

    // 1. Validar usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesión no iniciada.' }

    // 2. Obtener el mensaje para verificar hogar y contenido
    const { data: msg } = await supabase
      .from('messages')
      .select('id, household_id, content')
      .eq('id', messageId)
      .single()

    if (!msg) return { error: 'Mensaje no encontrado.' }
    const householdId = msg.household_id

    // Verificar pertenencia al hogar
    const { data: isMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!isMember) return { error: 'No perteneces a este hogar.' }

    let resultText = ''

    // 3. Ejecutar la acción según el tipo
    switch (actionData.action) {
      case 'create_saving_goal': {
        const { name, target_amount, target_date } = actionData.params || {}
        if (!name) return { error: 'Nombre de meta no especificado.' }
        const targetAmountNum = Number(target_amount || 0)

        const { error } = await supabase.from('saving_goals').insert({
          household_id: householdId,
          name: name.trim(),
          target_amount: targetAmountNum,
          target_date: target_date || null,
          created_by: user.id,
        })
        if (error) {
          console.error('confirmChatAction create_saving_goal error:', error)
          return { error: 'Error al crear la meta de ahorro.' }
        }
        resultText = targetAmountNum > 0
          ? `🎯 **Meta de ahorro creada**: Se ha abierto la hucha **"${name.trim()}"** con un objetivo de **${targetAmountNum.toFixed(2)}€**.`
          : `🐷 **Hucha libre creada**: Se ha abierto la hucha libre **"${name.trim()}"** 💰.`
        break
      }

      case 'add_saving_contribution': {
        let { goal_id, goal_name, amount } = actionData.params || {}
        if (!goal_id && goal_name) {
          const { data: matchedGoal } = await supabase
            .from('saving_goals')
            .select('id')
            .eq('household_id', householdId)
            .ilike('name', goal_name.trim())
            .limit(1)
            .maybeSingle()
          if (matchedGoal) goal_id = matchedGoal.id
        }
        if (!goal_id) return { error: 'No se encontró la hucha especificada.' }

        const numericAmount = Number(amount || 0)
        if (numericAmount <= 0) return { error: 'Importe de aportación no válido.' }

        const { error } = await supabase.from('saving_contributions').insert({
          goal_id,
          user_id: user.id,
          amount: numericAmount,
        })
        if (error) {
          console.error('confirmChatAction add_saving_contribution error:', error)
          return { error: 'Error al registrar la aportación de ahorro.' }
        }
        resultText = `🐷 **Aportación registrada**: Se han añadido **${numericAmount.toFixed(2)}€** a la hucha.`
        break
      }

      case 'add_shopping_items': {
        const items = actionData.params?.items || []
        if (!Array.isArray(items) || items.length === 0) {
          return { error: 'Sin artículos especificados para la lista de compra.' }
        }
        const records = items.map((it: any) => ({
          household_id: householdId,
          name: (it.name || it).toString().trim(),
          quantity: it.quantity ? String(it.quantity) : '1',
          bought: false,
          created_by: user.id,
        }))

        const { error } = await supabase.from('shopping_list').insert(records)
        if (error) {
          console.error('confirmChatAction add_shopping_items error:', error)
          return { error: 'Error al añadir ítems a la lista de compra.' }
        }

        const itemsFormatted = records.map((r) => `**${r.name}**`).join(', ')
        resultText = `🛒 **Añadido a la lista de la compra**: ${itemsFormatted}.`
        break
      }

      case 'add_expense': {
        const { amount, description, category_id, category_name } = actionData.params || {}
        const numericAmount = Number(amount || 0)
        if (numericAmount <= 0) return { error: 'Importe de gasto no válido.' }

        let catId = category_id
        if (!catId && category_name) {
          const { data: matchedCat } = await supabase
            .from('categories')
            .select('id')
            .eq('household_id', householdId)
            .ilike('name', category_name.trim())
            .limit(1)
            .maybeSingle()
          if (matchedCat) catId = matchedCat.id
        }
        if (!catId) {
          const { data: firstCat } = await supabase
            .from('categories')
            .select('id')
            .eq('household_id', householdId)
            .limit(1)
            .maybeSingle()
          if (firstCat) catId = firstCat.id
        }

        const today = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('expenses').insert({
          household_id: householdId,
          created_by: user.id,
          amount: numericAmount,
          category_id: catId,
          description: (description || 'Gasto desde chat').trim(),
          expense_date: today,
          payment_method: 'card',
          is_personal: false,
        })

        if (error) {
          console.error('confirmChatAction add_expense error:', error)
          return { error: 'Error al registrar el gasto.' }
        }

        resultText = `💳 **Gasto registrado**: **${numericAmount.toFixed(2)}€** para "${(description || 'Gasto').trim()}".`
        break
      }

      case 'send_member_reminder': {
        const { target_user_name, reminder_text } = actionData.params || {}
        const { sendHouseholdChatPushAction } = await import('@/app/actions/push')
        const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
        const senderName = profile?.display_name || 'Miembro'

        await sendHouseholdChatPushAction({
          householdId,
          senderId: user.id,
          senderName: `Aviso de ${senderName}`,
          text: `${target_user_name ? `@${target_user_name}: ` : ''}${reminder_text}`,
        }).catch((err) => console.error(err))

        resultText = `🔔 **Aviso enviado a ${target_user_name || 'la familia'}**: "${reminder_text}".`
        break
      }

      default:
        return { error: 'Tipo de acción no reconocido.' }
    }

    // 4. Actualizar el estado de la etiqueta PENDING_ACTION en el mensaje original a status: "confirmed"
    const updatedContent = msg.content.replace(
      /"status":"pending"/g,
      '"status":"confirmed"'
    )

    await supabase
      .from('messages')
      .update({ content: updatedContent, updated_at: new Date().toISOString() })
      .eq('id', messageId)

    // 5. Publicar mensaje del bot notificando el éxito de la acción
    await supabase.from('messages').insert({
      household_id: householdId,
      created_by: user.id,
      content: resultText,
    })

    revalidatePath('/chat')
    revalidatePath('/expenses')
    revalidatePath('/saving-goals')
    revalidatePath('/shopping')
    revalidatePath('/dashboard')

    return { success: true, resultMessage: resultText }
  } catch (err: any) {
    console.error('confirmChatAction Catch Error:', err)
    return { error: 'Error al confirmar la acción.' }
  }
}

/**
 * Server Action para cancelar una acción propuesta por el Chat
 */
export async function cancelChatAction(
  messageId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesión no iniciada.' }

    const { data: msg } = await supabase
      .from('messages')
      .select('id, household_id, content')
      .eq('id', messageId)
      .single()

    if (!msg) return { error: 'Mensaje no encontrado.' }

    const updatedContent = msg.content.replace(
      /"status":"pending"/g,
      '"status":"cancelled"'
    )

    await supabase
      .from('messages')
      .update({ content: updatedContent, updated_at: new Date().toISOString() })
      .eq('id', messageId)

    revalidatePath('/chat')
    return { success: true }
  } catch (err: any) {
    console.error('cancelChatAction Catch Error:', err)
    return { error: 'Error al cancelar la acción.' }
  }
}


/**
 * Server Action para editar un mensaje existente
 */
export async function updateMessageAction(
  messageId: string,
  newContent: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const trimmed = newContent.trim()
    if (!trimmed) {
      return { error: 'El mensaje no puede estar vacío.' }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Sesión no iniciada.' }

    const now = new Date().toISOString()
    const { error: updateErr } = await supabase
      .from('messages')
      .update({ content: trimmed, updated_at: now })
      .eq('id', messageId)
      .eq('created_by', user.id)

    if (updateErr) {
      console.error('updateMessageAction Error:', updateErr)
      return { error: 'Error al actualizar el mensaje.' }
    }

    revalidatePath('/chat')
    return { success: true }
  } catch (err: any) {
    console.error('updateMessageAction Catch Error:', err)
    return { error: 'Error inesperado al editar el mensaje.' }
  }
}

/**
 * Server Action para eliminar suavemente un mensaje (marcarlo como eliminado)
 */
export async function deleteMessageAction(
  messageId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Sesión no iniciada.' }

    const now = new Date().toISOString()
    const { error: deleteErr } = await supabase
      .from('messages')
      .update({ is_deleted: true, updated_at: now })
      .eq('id', messageId)
      .eq('created_by', user.id)

    if (deleteErr) {
      console.error('deleteMessageAction Error:', deleteErr)
      return { error: 'Error al eliminar el mensaje.' }
    }

    revalidatePath('/chat')
    return { success: true }
  } catch (err: any) {
    console.error('deleteMessageAction Catch Error:', err)
    return { error: 'Error inesperado al eliminar el mensaje.' }
  }
}
