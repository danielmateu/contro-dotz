'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * Obtiene la IP del cliente
 */
async function getClientIp() {
  const headersList = await headers()
  return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
}

/**
 * Registra un nuevo usuario
 */
export async function signUpAction(prevState: any, formData: FormData) {
  const ip = await getClientIp()
  const rateLimit = await checkRateLimit(`signup:${ip}`, 5, 60000)
  if (!rateLimit.success) {
    return { error: `Demasiados intentos de registro. Vuelve a intentarlo en ${rateLimit.reset} segundos.` }
  }
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const displayName = formData.get('displayName') as string

  const validation = registerSchema.safeParse({
    email,
    password,
    confirmPassword,
    displayName,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.status === 422) {
      return { error: 'Este correo electrónico ya está registrado.' }
    }
    return { error: error.message }
  }

  return {
    success:
      'Registro completado. Por favor, verifica tu correo electrónico para confirmar tu cuenta.',
  }
}

/**
 * Inicia sesión del usuario
 */
export async function signInAction(prevState: any, formData: FormData) {
  const ip = await getClientIp()
  const rateLimit = await checkRateLimit(`login:${ip}`, 7, 60000)
  if (!rateLimit.success) {
    return { error: `Demasiados intentos fallidos de inicio de sesión. Espera ${rateLimit.reset} segundos.` }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validation = loginSchema.safeParse({ email, password })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Correo electrónico o contraseña incorrectos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Cierra sesión del usuario
 */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/**
 * Solicita recuperación de contraseña
 */
export async function resetPasswordRequestAction(prevState: any, formData: FormData) {
  const ip = await getClientIp()
  const rateLimit = await checkRateLimit(`reset:${ip}`, 3, 60000)
  if (!rateLimit.success) {
    return { error: `Has superado el límite de solicitudes de recuperación. Inténtalo en ${rateLimit.reset} segundos.` }
  }

  const email = formData.get('email') as string

  const validation = forgotPasswordSchema.safeParse({ email })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return {
      error:
        'Error al enviar el correo de recuperación. Por favor, inténtalo de nuevo.',
    }
  }

  return {
    success:
      'Te hemos enviado un correo con instrucciones para restablecer tu contraseña.',
  }
}

/**
 * Restablece o cambia la contraseña del usuario actualmente autenticado
 */
export async function updatePasswordAction(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const validation = resetPasswordSchema.safeParse({ password, confirmPassword })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    if (error.message.includes('same password') || error.status === 422) {
      return { error: 'La nueva contraseña no puede ser igual a la anterior.' }
    }
    return { error: error.message }
  }

  return {
    success: 'Tu contraseña ha sido actualizada con éxito.',
  }
}
