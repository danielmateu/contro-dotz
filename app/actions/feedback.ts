'use server'

import { createClient } from '@/lib/supabase/server'

export interface SubmitFeedbackInput {
  title: string
  description: string
  category: 'feature' | 'bug' | 'other'
}

export type FeedbackStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

/**
 * Server Action para recibir, almacenar y sincronizar el feedback enviado por los usuarios
 */
export async function sendFeedbackAction(input: SubmitFeedbackInput): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const title = input.title.trim()
    const description = input.description.trim()

    if (!title || !description) {
      return { success: false, error: 'Título y descripción son requeridos.' }
    }

    // 1. Almacenar el feedback de forma persistente en Supabase
    const { error: dbError } = await supabase.from('feedback').insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      category: input.category,
      title,
      description,
      status: 'pending',
    })

    if (dbError) {
      console.warn('[FEEDBACK DB WARN] No se pudo guardar en tabla feedback:', dbError.message)
    } else {
      console.log('[FEEDBACK STORED IN SUPABASE SUCCESS]', {
        userEmail: user?.email,
        category: input.category,
        title,
      })
    }

    // 2. Intentar enviar a FeatureBase API si está configurada la organización y/o API key
    const fbOrg = process.env.FEATUREBASE_ORG || process.env.NEXT_PUBLIC_FEATUREBASE_ORG
    const fbApiKey = process.env.FEATUREBASE_API_KEY

    if (fbOrg) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (fbApiKey) {
          headers['x-api-key'] = fbApiKey
        }

        const res = await fetch('https://api.featurebase.app/v1/posts', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            organization: fbOrg,
            organizationName: fbOrg,
            title,
            content: description,
            type: input.category,
            email: user?.email,
            authorEmail: user?.email,
          }),
        })

        const resText = await res.text()
        console.log(`[FEATUREBASE API SYNC STATUS: ${res.status}]`, resText)
      } catch (err) {
        console.warn('[FEATUREBASE API SYNC EXCEPTION]', err)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[FEEDBACK ACTION ERROR]', err)
    return { success: false, error: 'Ocurrió un error al procesar tu feedback.' }
  }
}

/**
 * Server Action para que un SuperAdmin modifique el estado de un feedback
 */
export async function updateFeedbackStatusAction(
  feedbackId: string,
  newStatus: FeedbackStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' }
    }

    // Verificar si es SuperAdmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return { success: false, error: 'Permisos insuficientes de SuperAdmin.' }
    }

    const { error } = await supabase
      .from('feedback')
      .update({ status: newStatus })
      .eq('id', feedbackId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[UPDATE FEEDBACK STATUS ERROR]', err)
    return { success: false, error: 'Ocurrió un error al actualizar el estado.' }
  }
}
