'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { settlementSchema } from '@/lib/validations'

/**
 * Registra un pago de saldo (liquidación) entre dos miembros
 */
export async function createSettlementAction(
  householdId: string,
  prevState: any,
  formData: FormData
): Promise<any> {
  const payer_id = formData.get('payer_id') as string
  const receiver_id = formData.get('receiver_id') as string
  const amount = formData.get('amount') as string

  const validation = settlementSchema.safeParse({
    payer_id,
    receiver_id,
    amount,
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

  // Insertar la liquidación
  const { error } = await supabase.from('settlements').insert({
    household_id: householdId,
    payer_id,
    receiver_id,
    amount: numericAmount,
  })

  if (error) {
    console.error('CREATE SETTLEMENT ERROR:', error)
    return { error: 'Error al registrar el pago de saldo en la base de datos.' }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  return { success: 'Pago de saldo registrado con éxito.' }
}

/**
 * Elimina una liquidación registrada
 */
export async function deleteSettlementAction(
  settlementId: string,
  householdId: string
): Promise<any> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', settlementId)
    .eq('household_id', householdId)

  if (error) {
    console.error('DELETE SETTLEMENT ERROR:', error)
    return { error: 'Error al eliminar el registro de pago.' }
  }

  revalidatePath('/household')
  revalidatePath('/', 'layout')
  return { success: 'Registro de pago eliminado con éxito.' }
}
