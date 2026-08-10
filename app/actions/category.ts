'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Crea una nueva categoría en el hogar del usuario
 */
export async function createCategoryAction(
  householdId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const name = formData.get('name') as string
  const color = formData.get('color') as string
  const icon = formData.get('icon') as string

  if (!name || name.trim().length < 2) {
    return {
      error: 'El nombre de la categoría debe tener al menos 2 caracteres.',
    }
  }

  const supabase = await createClient()

  // Verificar que el usuario pertenece al hogar
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { data: membership } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return { error: 'No tienes autorización para añadir categorías en este hogar.' }
  }

  const { error } = await supabase.from('categories').insert({
    household_id: householdId,
    name: name.trim(),
    color: color || '#64748b',
    icon: icon || 'Tag',
  })

  if (error) {
    if (error.code === '23505') {
      return {
        error: 'Ya existe una categoría con este nombre en tu hogar.',
      }
    }
    return { error: 'Error al crear la categoría.' }
  }

  revalidatePath('/categories')
  return { success: 'Categoría creada con éxito.' }
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategoryAction(
  categoryId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const name = formData.get('name') as string
  const color = formData.get('color') as string
  const icon = formData.get('icon') as string

  if (!name || name.trim().length < 2) {
    return {
      error: 'El nombre de la categoría debe tener al menos 2 caracteres.',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .update({
      name: name.trim(),
      color: color || '#64748b',
      icon: icon || 'Tag',
    })
    .eq('id', categoryId)

  if (error) {
    return { error: 'Error al actualizar la categoría.' }
  }

  revalidatePath('/categories')
  return { success: 'Categoría actualizada con éxito.' }
}

/**
 * Elimina una categoría del hogar
 */
export async function deleteCategoryAction(categoryId: string): Promise<any> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    // Código de violación de clave foránea en PostgreSQL (gastos que dependen de la categoría)
    if (error.code === '23503') {
      return {
        error:
          'No se puede eliminar la categoría porque tiene gastos asociados. Reasigna o elimina los gastos primero.',
      }
    }
    return { error: 'Error al eliminar la categoría.' }
  }

  revalidatePath('/categories')
  return { success: 'Categoría eliminada con éxito.' }
}
