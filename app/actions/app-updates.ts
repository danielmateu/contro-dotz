'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/supabase/get-authenticated-user'
import { revalidatePath } from 'next/cache'
import { sendUpdateNotificationEmail } from '@/lib/mail'
import { sendAppUpdatePushNotificationAction } from '@/app/actions/push'

export interface AppUpdate {
  id: string
  title: string
  content: string
  version?: string | null
  category: 'feature' | 'improvement' | 'fix' | 'announcement'
  is_published: boolean
  published_at: string
  created_by?: string | null
  created_at: string
}

/**
 * Obtiene todas las novedades publicadas y comprueba si hay novedades no leídas para el usuario
 */
export async function getAppUpdatesAction() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { updates: [], hasUnread: false, error: 'Usuario no autenticado.' }
    }

    const supabase = await createClient()

    // 1. Obtener actualizaciones publicadas
    const { data: updates, error } = await supabase
      .from('app_updates')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error al obtener novedades:', error)
      return { updates: [], hasUnread: false, error: error.message }
    }

    // 2. Obtener fecha de última lectura del usuario
    const { data: readRecord } = await supabase
      .from('user_app_update_reads')
      .select('last_read_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const lastReadAt = readRecord?.last_read_at ? new Date(readRecord.last_read_at) : null

    // Hay no leídas si existe alguna actualización publicada con fecha posterior a lastReadAt
    const hasUnread = (updates || []).some((up) => {
      if (!lastReadAt) return true
      return new Date(up.published_at) > lastReadAt
    })

    return {
      updates: (updates || []) as AppUpdate[],
      hasUnread,
      lastReadAt: lastReadAt ? lastReadAt.toISOString() : null,
    }
  } catch (err: any) {
    console.error('Excepción en getAppUpdatesAction:', err)
    return { updates: [], hasUnread: false, error: err.message || 'Error inesperado.' }
  }
}

/**
 * Marca las novedades como leídas para el usuario actual
 */
export async function markAppUpdatesAsReadAction() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { error: 'Usuario no autenticado.' }
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    const { error } = await supabase.from('user_app_update_reads').upsert({
      user_id: user.id,
      last_read_at: now,
    })

    if (error) {
      console.error('Error al marcar novedades como leídas:', error)
      return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, lastReadAt: now }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado.' }
  }
}

/**
 * Obtiene la lista completa de actualizaciones para el panel de administración
 */
export async function getAdminAppUpdatesAction() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { updates: [], error: 'No autenticado' }

    const supabase = await createClient()

    // Verificar si es superadmin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return { updates: [], error: 'Sin permisos de superadmin' }
    }

    const { data: updates, error } = await supabase
      .from('app_updates')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) throw error

    return { updates: (updates || []) as AppUpdate[] }
  } catch (err: any) {
    return { updates: [], error: err.message }
  }
}

interface CreateAppUpdatePayload {
  title: string
  content: string
  version?: string
  category: 'feature' | 'improvement' | 'fix' | 'announcement'
  isPublished?: boolean
  sendEmail?: boolean
  sendPush?: boolean
}

/**
 * Crea una nueva actualización (Superadmin) y opcionalmente notifica por Email/Push
 */
export async function createAppUpdateAction(payload: CreateAppUpdatePayload) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { error: 'No autenticado' }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return { error: 'Se requieren permisos de superadmin' }
    }

    // 1. Insertar en la BD
    const { data: updateData, error: insertErr } = await supabase
      .from('app_updates')
      .insert({
        title: payload.title.trim(),
        content: payload.content.trim(),
        version: payload.version?.trim() || null,
        category: payload.category || 'feature',
        is_published: payload.isPublished ?? true,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Error insertando app_update:', insertErr)
      return { error: insertErr.message }
    }

    let emailStats = { sent: 0, errors: 0 }
    const pushStats = { sent: 0 }

    // 2. Enviar emails si está marcado
    if (payload.sendEmail) {
      try {
        const { data: users } = await supabase
          .from('profiles')
          .select('email')
          .neq('id', '00000000-0000-0000-0000-000000000000')

        const emails = (users || [])
          .map((u) => u.email)
          .filter((e): e is string => Boolean(e) && e.includes('@'))

        if (emails.length > 0) {
          const res = await sendUpdateNotificationEmail(
            emails,
            payload.title,
            payload.content,
            payload.version || undefined,
            payload.category
          )
          emailStats = { sent: res.totalSent, errors: res.errorsCount }
        }
      } catch (eErr: any) {
        console.error('Error al enviar correos de novedades:', eErr)
      }
    }

    // 3. Enviar notificaciones Push si está marcado
    if (payload.sendPush) {
      try {
        const pushRes = await sendAppUpdatePushNotificationAction({
          title: payload.title,
          text: payload.content,
          version: payload.version || undefined,
        })
        if (pushRes.success && pushRes.sentCount) {
          pushStats.sent = pushRes.sentCount
        }
      } catch (pErr: any) {
        console.error('Error enviando push de novedades:', pErr)
      }
    }

    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return {
      success: true,
      update: updateData as AppUpdate,
      emailStats,
      pushStats,
    }
  } catch (err: any) {
    console.error('Excepción en createAppUpdateAction:', err)
    return { error: err.message || 'Error al crear la actualización.' }
  }
}

/**
 * Elimina una actualización (Superadmin)
 */
export async function deleteAppUpdateAction(id: string) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { error: 'No autenticado' }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return { error: 'Sin permisos de superadmin' }
    }

    const { error } = await supabase.from('app_updates').delete().eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al eliminar.' }
  }
}
