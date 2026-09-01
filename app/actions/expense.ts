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
  const is_personal = formData.get('is_personal') === 'true'

  const validation = expenseSchema.safeParse({
    amount,
    category_id,
    description,
    expense_date,
    payment_method,
    notes: notes || undefined,
    is_personal,
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

  // Verificar si es propietario para permitir asignar custom created_by
  const customCreatedBy = formData.get('created_by') as string | null
  const { data: memberInfo } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single()
  const isOwner = memberInfo?.role === 'owner'

  let targetCreatedBy: string | null = user.id
  if (isOwner && customCreatedBy) {
    targetCreatedBy = customCreatedBy === 'shared' ? null : customCreatedBy
  }

  const { data: inserted, error } = await supabase
    .from('expenses')
    .insert({
      household_id: householdId,
      created_by: user.id, // Forzar creador a user.id temporalmente por políticas RLS
      amount: numericAmount,
      category_id,
      description: description.trim(),
      expense_date,
      payment_method,
      notes: notes ? notes.trim() : null,
      is_personal,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Error al registrar el gasto en la base de datos.' }
  }

  // Si el pagador final es distinto al usuario actual (incluye 'shared'/null), hacemos el update
  if (inserted && targetCreatedBy !== user.id) {
    const { error: updateError } = await supabase
      .from('expenses')
      .update({ created_by: targetCreatedBy })
      .eq('id', inserted.id)

    if (updateError) {
      console.error('Error al actualizar el pagador final en base de datos:', updateError)
    }
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

  // Enviar mensaje de notificación al chat familiar y comprobar alertas de presupuesto
  try {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', category_id)
      .single()
    const categoryName = category?.name || 'Gasto'
    const formattedAmount = numericAmount.toFixed(2)

    // A. Insertar notificación de gasto en el chat
    await supabase.from('messages').insert({
      household_id: householdId,
      created_by: user.id,
      content: `📢 **Gasto registrado**: **${formattedAmount}€** en *${categoryName}* para "${description.trim()}"`,
    })

    // B. Comprobar alertas de presupuestos establecidos
    const now = new Date()
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`

    const { data: budget } = await supabase
      .from('budgets')
      .select('amount')
      .eq('household_id', householdId)
      .eq('category_id', category_id)
      .eq('month', currentMonthStr)
      .maybeSingle()

    if (budget && Number(budget.amount) > 0) {
      const budgetAmount = Number(budget.amount)

      const currentStartDate = `${currentMonthStr}-01`
      const currentLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const currentEndDate = `${currentMonthStr}-${currentLastDay
        .toString()
        .padStart(2, '0')}`

      // Calcular el acumulado actual de gastos para la categoría en este mes
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('household_id', householdId)
        .eq('category_id', category_id)
        .gte('expense_date', currentStartDate)
        .lte('expense_date', currentEndDate)

      const totalSpent = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0
      const previousSpent = totalSpent - numericAmount

      const previousPercent = (previousSpent / budgetAmount) * 100
      const currentPercent = (totalSpent / budgetAmount) * 100

      if (previousPercent < 100 && currentPercent >= 100) {
        // Alerta de superado
        await supabase.from('messages').insert({
          household_id: householdId,
          created_by: user.id,
          content: `🚨 **Límite de presupuesto superado**: El presupuesto mensual para *${categoryName}* (${budgetAmount.toFixed(
            2
          )}€) ha sido superado. Total gastado: **${totalSpent.toFixed(2)}€**.`,
        })
      } else if (previousPercent < 80 && currentPercent >= 80) {
        // Advertencia del 80%
        await supabase.from('messages').insert({
          household_id: householdId,
          created_by: user.id,
          content: `⚠️ **Presupuesto al límite (80%)**: Se ha consumido el **${currentPercent.toFixed(
            0
          )}%** del presupuesto mensual para *${categoryName}* (${budgetAmount.toFixed(
            2
          )}€). Total gastado: **${totalSpent.toFixed(2)}€**.`,
        })
      }
    }
  } catch (chatError) {
    console.error('Error posting expense chat notification or budget alert:', chatError)
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  revalidatePath('/chat')
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
  const is_personal = formData.get('is_personal') === 'true'

  const validation = expenseSchema.safeParse({
    amount,
    category_id,
    description,
    expense_date,
    payment_method,
    notes: notes || undefined,
    is_personal,
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

  // Obtener el gasto existente para gestionar el ticket y verificar el hogar
  const { data: existing } = await supabase
    .from('expenses')
    .select('receipt_path, household_id')
    .eq('id', expenseId)
    .single()

  if (!existing) return { error: 'Gasto no encontrado.' }

  // Verificar si es propietario del hogar
  const customCreatedBy = formData.get('created_by') as string | null
  const { data: memberInfo } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', existing.household_id)
    .eq('user_id', user.id)
    .single()
  const isOwner = memberInfo?.role === 'owner'

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

  const updateFields: any = {
    amount: numericAmount,
    category_id,
    description: description.trim(),
    expense_date,
    payment_method,
    notes: notes ? notes.trim() : null,
    receipt_path: receiptPath,
    is_personal,
  }

  if (isOwner && customCreatedBy !== null) {
    updateFields.created_by = customCreatedBy === 'shared' ? null : customCreatedBy
  }

  const { error } = await supabase
    .from('expenses')
    .update(updateFields)
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

/**
 * Actualiza el pagador de un gasto directamente
 */
export async function updateExpensePayerAction(
  expenseId: string,
  payerId: string | null
): Promise<any> {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // Obtener el gasto existente para verificar el hogar
  const { data: existing } = await supabase
    .from('expenses')
    .select('household_id')
    .eq('id', expenseId)
    .single()

  if (!existing) return { error: 'Gasto no encontrado.' }

  // Verificar si es propietario del hogar
  const { data: memberInfo } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', existing.household_id)
    .eq('user_id', user.id)
    .single()
  const isOwner = memberInfo?.role === 'owner'

  if (!isOwner) {
    return { error: 'Solo el propietario del hogar puede cambiar el pagador.' }
  }

  const { error } = await supabase
    .from('expenses')
    .update({ created_by: payerId })
    .eq('id', expenseId)

  if (error) {
    return { error: 'Error al actualizar el pagador en la base de datos.' }
  }

  revalidatePath('/expenses')
  revalidatePath('/dashboard')
  return { success: 'Pagador actualizado con éxito.' }
}
