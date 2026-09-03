'use server'

import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configuración resiliente de claves VAPID en servidor
function ensureVapidDetails(): boolean {
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:mail@danielmateudev.es'

  if (pubKey && privKey) {
    try {
      webpush.setVapidDetails(subject, pubKey, privKey)
      return true
    } catch (err) {
      console.error('Error al configurar VAPID details:', err)
      return false
    }
  }
  return false
}

interface SaveSubscriptionPayload {
  endpoint: string
  p256dh: string
  auth: string
}

/**
  Guarda o actualiza una suscripción PushManager en Supabase para el usuario actual
 */
export async function savePushSubscriptionAction(subscription: SaveSubscriptionPayload) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Usuario no autenticado.' }
    }

    if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
      return { error: 'Datos de suscripción incompletos.' }
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      { onConflict: 'endpoint' }
    )

    if (error) {
      console.error('Error guardando push_subscription:', error)
      return { error: 'Error al registrar suscripción Push en la base de datos.' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Excepción en savePushSubscriptionAction:', err)
    return { error: err.message || 'Error inesperado.' }
  }
}

/**
  Elimina una suscripción Push específica del usuario
 */
export async function removePushSubscriptionAction(endpoint: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Usuario no autenticado.' }
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    if (error) {
      return { error: 'Error al eliminar suscripción.' }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado.' }
  }
}

interface SendChatPushPayload {
  householdId: string
  senderId: string
  senderName: string
  text: string
}

/**
  Envía notificaciones Push a todos los miembros del hogar (excepto al remitente)
 */
export async function sendHouseholdChatPushAction({
  householdId,
  senderId,
  senderName,
  text,
}: SendChatPushPayload) {
  try {
    if (!ensureVapidDetails()) {
      console.warn('VAPID keys no configuradas, omitiendo push notification.')
      return { success: false, reason: 'VAPID keys no disponibles.' }
    }

    const supabase = await createClient()

    // 1. Obtener los IDs de los miembros del hogar
    const { data: members, error: membersErr } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId)

    if (membersErr || !members || members.length === 0) {
      return { success: false, reason: 'No se encontraron miembros en el hogar.' }
    }

    // Filtrar al remitente
    const targetUserIds = members
      .map((m) => m.user_id)
      .filter((uid) => uid !== senderId)

    if (targetUserIds.length === 0) {
      return { success: true, count: 0 }
    }

    // 2. Obtener todas las suscripciones push activas para esos usuarios
    const { data: subscriptions, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', targetUserIds)

    if (subErr || !subscriptions || subscriptions.length === 0) {
      return { success: true, count: 0 }
    }

    // 3. Formatear payload de la notificación
    const payload = JSON.stringify({
      title: `💬 ${senderName}`,
      body: text.length > 100 ? `${text.substring(0, 100)}...` : text,
      icon: '/icon-192.png',
      url: '/chat',
      tag: `chat-${householdId}`,
    })

    // 4. Enviar notificaciones en paralelo a cada dispositivo
    const expiredSubIds: string[] = []

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, payload)
        } catch (err: any) {
          // Si el endpoint ya no existe (404 / 410 Gone), marcarlo para eliminar
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredSubIds.push(sub.id)
          } else {
            console.error(`Error enviando push a sub ${sub.id}:`, err.message || err)
          }
        }
      })
    )

    // 5. Limpieza automática de suscripciones caducadas
    if (expiredSubIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredSubIds)
    }

    return { success: true, sentCount: subscriptions.length - expiredSubIds.length }
  } catch (err: any) {
    console.error('Excepción en sendHouseholdChatPushAction:', err)
    return { error: err.message || 'Error enviando notificaciones push.' }
  }
}
