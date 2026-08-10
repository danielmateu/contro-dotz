'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { expenseSchema } from '@/lib/validations'

/**
 * Registra un nuevo gasto diario
 */
export async function createExpenseAction(
  householdId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const amount = formData.get('amount') as string
  const category_id = formData.get('category_id') as string
  const description = formData.get('description') as string
  const expense_date = formData.get('expense_date') as string
  const payment_method = formData.get('payment_method') as string
  const notes = formData.get('notes') as string

  const validation = expenseSchema.safeParse({
    amount,
    category_id,
    description,
    expense_date,
    payment_method,
    notes,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const numericAmount = parseFloat(amount.replace(',', '.'))
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  const { error } = await supabase.from('expenses').insert({
    household_id: householdId,
    created_by: user.id,
    amount: numericAmount,
    category_id,
    description: description.trim(),
    expense_date,
    payment_method,
    notes: notes ? notes.trim() : null,
  })

  if (error) {
    return { error: 'Error al registrar el gasto en la base de datos.' }
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  redirect('/expenses')
}

/**
 * Actualiza un gasto diario existente
 */
export async function updateExpenseAction(
  expenseId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const amount = formData.get('amount') as string
  const category_id = formData.get('category_id') as string
  const description = formData.get('description') as string
  const expense_date = formData.get('expense_date') as string
  const payment_method = formData.get('payment_method') as string
  const notes = formData.get('notes') as string

  const validation = expenseSchema.safeParse({
    amount,
    category_id,
    description,
    expense_date,
    payment_method,
    notes,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const numericAmount = parseFloat(amount.replace(',', '.'))
  const supabase = await createClient()

  const { error } = await supabase
    .from('expenses')
    .update({
      amount: numericAmount,
      category_id,
      description: description.trim(),
      expense_date,
      payment_method,
      notes: notes ? notes.trim() : null,
    })
    .eq('id', expenseId)

  if (error) {
    return { error: 'Error al actualizar el gasto en la base de datos.' }
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  redirect('/expenses')
}

/**
 * Elimina un gasto diario existente
 */
export async function deleteExpenseAction(expenseId: string): Promise<any> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) {
    return { error: 'Error al eliminar el gasto de la base de datos.' }
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { success: 'Gasto eliminado con éxito.' }
}
