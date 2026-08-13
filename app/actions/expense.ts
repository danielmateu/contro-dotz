'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
  const receipt = formData.get('receipt') as File | null

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

  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert({
      household_id: householdId,
      created_by: user.id,
      amount: numericAmount,
      category_id,
      description: description.trim(),
      expense_date,
      payment_method,
      notes: notes ? notes.trim() : null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Error al registrar el gasto en la base de datos.' }
  }

  if (receipt && receipt.size > 0) {
    const fileExtension = receipt.name.split('.').pop()
    const path = `${householdId}/${inserted.id}/${Date.now()}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, receipt, {
        contentType: receipt.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error al subir ticket a storage:', uploadError)
    } else {
      await supabase
        .from('expenses')
        .update({ receipt_path: path })
        .eq('id', inserted.id)
    }
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { success: 'Gasto registrado con éxito.' }
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
  const receipt = formData.get('receipt') as File | null
  const deleteReceipt = formData.get('delete_receipt') === 'true'

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

  // Obtener el gasto existente para gestionar el ticket
  const { data: existing } = await supabase
    .from('expenses')
    .select('receipt_path, household_id')
    .eq('id', expenseId)
    .single()

  let receiptPath = existing?.receipt_path || null

  // Si se solicita borrar el ticket actual o se está subiendo uno nuevo, se borra el anterior
  if (deleteReceipt || (receipt && receipt.size > 0)) {
    if (existing?.receipt_path) {
      await supabase.storage.from('receipts').remove([existing.receipt_path])
      receiptPath = null
    }
  }

  // Si se subió un nuevo ticket, lo subimos
  if (receipt && receipt.size > 0) {
    const fileExtension = receipt.name.split('.').pop()
    const householdId = existing?.household_id || 'unknown'
    const path = `${householdId}/${expenseId}/${Date.now()}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(path, receipt, {
        contentType: receipt.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error al subir nuevo ticket:', uploadError)
    } else {
      receiptPath = path
    }
  }

  const { error } = await supabase
    .from('expenses')
    .update({
      amount: numericAmount,
      category_id,
      description: description.trim(),
      expense_date,
      payment_method,
      notes: notes ? notes.trim() : null,
      receipt_path: receiptPath,
    })
    .eq('id', expenseId)

  if (error) {
    return { error: 'Error al actualizar el gasto en la base de datos.' }
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { success: 'Gasto actualizado con éxito.' }
}

/**
 * Elimina un gasto diario existente
 */
export async function deleteExpenseAction(expenseId: string): Promise<any> {
  const supabase = await createClient()

  // Buscar si tiene ticket asociado y borrarlo de storage
  const { data: existing } = await supabase
    .from('expenses')
    .select('receipt_path')
    .eq('id', expenseId)
    .single()

  if (existing?.receipt_path) {
    await supabase.storage.from('receipts').remove([existing.receipt_path])
  }

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
