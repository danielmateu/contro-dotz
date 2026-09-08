import { createClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

/**
 * Obtiene el usuario autenticado actual con soporte para Modo Offline.
 * Si supabase.auth.getUser() falla por falta de red, intenta recuperar el usuario
 * decodificando la sesión local (JWT) disponible en las cookies del servidor.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const supabase = await createClient()

    // 1. Intentar validar token con los servidores de Supabase
    try {
      const { data } = await supabase.auth.getUser()
      if (data?.user) return data.user
    } catch (_) {}

    // 2. Fallback offline: decodificar sesión JWT desde cookies si no hay red
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user) {
        return sessionData.session.user
      }
    } catch (_) {}

    return null
  } catch (err) {
    console.error('Error en getAuthenticatedUser:', err)
    return null
  }
}
