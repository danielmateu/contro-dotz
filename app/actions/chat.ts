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
      .select('id, content, created_at, created_by')
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
