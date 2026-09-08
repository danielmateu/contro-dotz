'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { budgetSchema } from '@/lib/validations'

/**
 * Guarda (crea o actualiza) un presupuesto mensual para una categoría
 */
export async function saveBudgetAction(
  householdId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const category_id = formData.get('category_id') as string
  const amount = formData.get('amount') as string
  const month = formData.get('month') as string // Formato 'YYYY-MM'

  const validation = budgetSchema.safeParse({
    category_id,
    amount,
    month,
  })

  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const numericAmount = parseFloat(amount.replace(',', '.'))
  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  // Realizar upsert (insertar o actualizar en conflicto de clave única)
  const { error } = await supabase.from('budgets').upsert(
    {
      household_id: householdId,
      category_id,
      amount: numericAmount,
      month,
    },
    {
      onConflict: 'household_id,category_id,month',
    }
  )

  if (error) {
    return { error: 'Error al guardar el presupuesto en la base de datos.' }
  }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { success: 'Presupuesto guardado con éxito.' }
}

/**
 * Elimina un presupuesto mensual existente
 */
export async function deleteBudgetAction(budgetId: string): Promise<any> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)

  if (error) {
    return { error: 'Error al eliminar el presupuesto.' }
  }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { success: 'Presupuesto eliminado con éxito.' }
}

/**
 * Importa los presupuestos de un mes anterior al mes destino especificado
 */
export async function importPreviousBudgetsAction(
  householdId: string,
  targetMonth: string,
  sourceMonth?: string
): Promise<{ success?: string; error?: string; count?: number }> {
  const supabase = await createClient()

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no iniciada.' }

  let fromMonth = sourceMonth

  // Si no se especifica el mes origen, buscar el mes con presupuestos más reciente anterior a targetMonth
  if (!fromMonth) {
    const { data: latestWithBudgets } = await supabase
      .from('budgets')
      .select('month')
      .eq('household_id', householdId)
      .lt('month', targetMonth)
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latestWithBudgets?.month) {
      return { error: 'No se encontraron presupuestos en meses anteriores para importar.' }
    }
    fromMonth = latestWithBudgets.month
  }

  // Obtener los presupuestos del mes origen
  const { data: sourceBudgets, error: fetchError } = await supabase
    .from('budgets')
    .select('category_id, amount')
    .eq('household_id', householdId)
    .eq('month', fromMonth)

  if (fetchError || !sourceBudgets || sourceBudgets.length === 0) {
    return { error: 'No hay presupuestos para copiar en el mes de origen.' }
  }

  // Mapear los presupuestos al mes destino
  const payload = sourceBudgets.map((b) => ({
    household_id: householdId,
    category_id: b.category_id,
    amount: Number(b.amount),
    month: targetMonth,
  }))

  // Upsert en el mes destino
  const { error: upsertError } = await supabase.from('budgets').upsert(payload, {
    onConflict: 'household_id,category_id,month',
  })

  if (upsertError) {
    return { error: 'Error al clonar los presupuestos en el mes actual.' }
  }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  return { success: 'Presupuestos importados con éxito.', count: payload.length }
}

