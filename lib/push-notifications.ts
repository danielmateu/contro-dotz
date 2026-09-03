import {
  savePushSubscriptionAction,
  removePushSubscriptionAction,
} from '@/app/actions/push'

/**
 * Convierte una clave VAPID pública en formato Base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Verifica si el navegador actual soporta Web Push y cuál es el estado del permiso
 */
export async function getPushNotificationState(): Promise<{
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
}> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return { isSupported: false, permission: 'unsupported', isSubscribed: false }
  }

  const permission = Notification.permission

  if (permission !== 'granted') {
    return { isSupported: true, permission, isSubscribed: false }
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return { isSupported: true, permission, isSubscribed: !!subscription }
  } catch (err) {
    console.error('Error comprobando estado de suscripción Push:', err)
    return { isSupported: true, permission, isSubscribed: false }
  }
}

/**
 * Solicita permiso y suscribe al usuario a Notificaciones Push
 */
export async function subscribeUserToPush(): Promise<{ success: boolean; error?: string }> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return { success: false, error: 'Tu navegador no soporta notificaciones Push.' }
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  if (!vapidPublicKey) {
    return { success: false, error: 'Clave VAPID pública no configurada.' }
  }

  try {
    // 1. Pedir permiso al usuario
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso de notificaciones denegado por el usuario.' }
    }

    // 2. Esperar a que el Service Worker esté activo
    const registration = await navigator.serviceWorker.ready

    // 3. Obtener o crear suscripción Push
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      })
    }

    const subJson = subscription.toJSON()
    const endpoint = subJson.endpoint
    const p256dh = subJson.keys?.p256dh
    const auth = subJson.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      return { success: false, error: 'No se pudieron extraer las claves del navegador.' }
    }

    // 4. Guardar suscripción en Supabase
    const res = await savePushSubscriptionAction({ endpoint, p256dh, auth })

    if (res.error) {
      return { success: false, error: res.error }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error suscribiendo a Push:', err)
    return { success: false, error: err.message || 'Error inesperado suscribiendo a Push.' }
  }
}

/**
 * Desregistra al usuario de Notificaciones Push
 */
export async function unsubscribeUserFromPush(): Promise<{ success: boolean; error?: string }> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return { success: false, error: 'Navegador no compatible.' }
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      await removePushSubscriptionAction(endpoint)
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error desuscribiendo Push:', err)
    return { success: false, error: err.message || 'Error al desuscribir.' }
  }
}
