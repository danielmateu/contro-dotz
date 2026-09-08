/**
 * Motor de Sincronización Offline (Sync Engine)
 * Procesa las mutaciones pendientes guardadas en IndexedDB al restablecer la conexión.
 */

import {
  getPendingQueue,
  removePendingAction,
  updatePendingAction,
  PendingAction,
} from './offline-store'
import { createExpenseAction, updateExpenseAction, deleteExpenseAction } from '@/app/actions/expense'
import { sendMessageAction } from '@/app/actions/chat'
import { createClient } from '@/lib/supabase/client'

export interface SyncProgressReport {
  total: number
  processed: number
  successCount: number
  errorCount: number
}

/**
 * Ejecuta una acción individual de la cola
 */
async function processAction(action: PendingAction): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const { type, payload } = action

  try {
    switch (type) {
      case 'CREATE_EXPENSE': {
        const formData = new FormData()
        Object.entries(payload.fields || {}).forEach(([key, val]) => {
          if (val !== null && val !== undefined) {
            formData.append(key, String(val))
          }
        })
        const res = await createExpenseAction(payload.householdId, {}, formData)
        if (res?.error) return { success: false, error: res.error }
        return { success: true }
      }

      case 'UPDATE_EXPENSE': {
        const formData = new FormData()
        Object.entries(payload.fields || {}).forEach(([key, val]) => {
          if (val !== null && val !== undefined) {
            formData.append(key, String(val))
          }
        })
        const res = await updateExpenseAction(payload.expenseId, {}, formData)
        if (res?.error) return { success: false, error: res.error }
        return { success: true }
      }

      case 'DELETE_EXPENSE': {
        const res = await deleteExpenseAction(payload.expenseId)
        if (res?.error) return { success: false, error: res.error }
        return { success: true }
      }

      case 'SEND_CHAT_MESSAGE': {
        const res = await sendMessageAction(payload.householdId, payload.content)
        if (res?.error) return { success: false, error: res.error }
        return { success: true }
      }

      case 'ADD_SHOPPING_ITEM': {
        const { error } = await supabase.from('shopping_list').insert({
          household_id: payload.householdId,
          name: payload.name,
          quantity: payload.quantity || null,
          bought: false,
          created_by: payload.userId,
        })
        if (error) return { success: false, error: error.message }
        return { success: true }
      }

      case 'TOGGLE_SHOPPING_ITEM': {
        const { error } = await supabase
          .from('shopping_list')
          .update({ bought: payload.bought })
          .eq('id', payload.itemId)
        if (error) return { success: false, error: error.message }
        return { success: true }
      }

      case 'DELETE_SHOPPING_ITEM': {
        const { error } = await supabase
          .from('shopping_list')
          .delete()
          .eq('id', payload.itemId)
        if (error) return { success: false, error: error.message }
        return { success: true }
      }

      default:
        return { success: false, error: 'Acción no soportada' }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Error inesperado de sincronización' }
  }
}

/**
 * Procesa todas las acciones pendientes en la cola de sincronización
 */
export async function runSyncProcess(
  onProgress?: (report: SyncProgressReport) => void
): Promise<SyncProgressReport> {
  const queue = await getPendingQueue()
  const report: SyncProgressReport = {
    total: queue.length,
    processed: 0,
    successCount: 0,
    errorCount: 0,
  }

  if (queue.length === 0) {
    onProgress?.(report)
    return report
  }

  for (const action of queue) {
    const result = await processAction(action)

    report.processed += 1

    if (result.success) {
      report.successCount += 1
      await removePendingAction(action.id)
    } else {
      report.errorCount += 1
      action.retryCount = (action.retryCount || 0) + 1
      action.lastError = result.error

      // Si supera 5 reintentos, podemos conservarlo con marca de error o eliminarlo si es insalvable
      if (action.retryCount >= 5) {
        console.warn(`[SyncEngine] Acción ${action.id} eliminada por exceder reintentos max:`, action.lastError)
        await removePendingAction(action.id)
      } else {
        await updatePendingAction(action)
      }
    }

    onProgress?.(report)
  }

  return report
}
