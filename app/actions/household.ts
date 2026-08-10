'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { householdSchema, inviteSchema } from '@/lib/validations'

/**
 * Crea un nuevo hogar y asocia al usuario como creador (owner)
 */
export async function createHouseholdAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string

  const validation = householdSchema.safeParse({ name })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  // Llama a la función RPC de PostgreSQL que crea el hogar e inserta la membresía
  const { data: householdId, error } = await supabase.rpc('create_household', {
    household_name: name,
  })

  if (error) {
    return { error: 'Error al crear el hogar. Por favor, inténtalo de nuevo.' }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Envía una invitación para unirse a un hogar (Solo owners)
 */
export async function inviteUserAction(
  householdId: string,
  prevState: any,
  formData: FormData
) {
  const email = formData.get('email') as string
  const role = formData.get('role') as string

  const validation = inviteSchema.safeParse({ email, role })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { error } = await supabase.from('invitations').insert({
    household_id: householdId,
    email: email.toLowerCase().trim(),
    role,
    invited_by: user.id,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return {
        error:
          'Ya existe una invitación pendiente para este correo en este hogar.',
      }
    }
    return {
      error:
        'Error al enviar la invitación. Asegúrate de tener permisos de propietario (owner) y que el hogar sea válido.',
    }
  }

  revalidatePath('/household')
  return { success: 'Invitación enviada con éxito.' }
}

/**
 * Acepta una invitación pendiente
 */
export async function acceptInvitationAction(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId)

  if (error) {
    return { error: 'Error al aceptar la invitación.' }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  return { success: 'Invitación aceptada con éxito.' }
}

/**
 * Rechaza una invitación pendiente
 */
export async function rejectInvitationAction(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'rejected' })
    .eq('id', invitationId)

  if (error) {
    return { error: 'Error al rechazar la invitación.' }
  }

  revalidatePath('/household')
  return { success: 'Invitación rechazada con éxito.' }
}

/**
 * Elimina a un miembro del hogar (Solo owners, o uno mismo para salir)
 */
export async function removeMemberAction(memberId: string, householdId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId)

  if (error) {
    return {
      error:
        'Error al eliminar al miembro. Comprueba que tengas permisos suficientes.',
    }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  return { success: 'Miembro eliminado con éxito.' }
}

/**
 * Actualiza el nombre para mostrar del perfil del usuario
 */
export async function updateProfileNameAction(prevState: any, formData: FormData) {
  const displayName = formData.get('displayName') as string

  if (!displayName || displayName.trim().length < 2) {
    return { error: 'El nombre debe tener al menos 2 caracteres.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim() })
    .eq('id', user.id)

  if (error) {
    return { error: 'Error al actualizar el nombre de perfil.' }
  }

  revalidatePath('/settings')
  return { success: 'Perfil actualizado con éxito.' }
}
