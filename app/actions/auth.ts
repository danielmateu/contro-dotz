'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { loginSchema, registerSchema, forgotPasswordSchema } from '@/lib/validations'

/**
 * Registra un nuevo usuario
 */
export async function signUpAction(prevState: any, formData: FormData) {
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
  const email = formData.get('email') as string

  const validation = forgotPasswordSchema.safeParse({ email })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/settings`,
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
