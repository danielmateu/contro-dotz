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

    // 4. Si el mensaje menciona a @gemini, invocar al asistente Gemini
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
