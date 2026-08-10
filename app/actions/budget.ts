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
