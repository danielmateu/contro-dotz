/**
 * Almacenamiento Local Offline para Control Dotz (IndexedDB)
 * Proporciona lectura en caché y cola de sincronización de mutaciones pendientes.
 */

export interface PendingAction {
  id: string
  type:
    | 'CREATE_EXPENSE'
    | 'UPDATE_EXPENSE'
    | 'DELETE_EXPENSE'
    | 'SEND_CHAT_MESSAGE'
    | 'ADD_SHOPPING_ITEM'
    | 'TOGGLE_SHOPPING_ITEM'
    | 'DELETE_SHOPPING_ITEM'
  payload: Record<string, any>
  createdAt: number
  retryCount: number
  lastError?: string
}

const DB_NAME = 'ControlDotzOfflineDB'
const DB_VERSION = 1
const STORE_QUEUE = 'pending_queue'
const STORE_CACHE = 'cache'

/**
 * Abre o inicializa la base de datos IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este entorno.'))
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Añade una acción a la cola de pendientes
 */
export async function enqueueOfflineAction(
  type: PendingAction['type'],
  payload: Record<string, any>
): Promise<PendingAction> {
  const action: PendingAction = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  }

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_QUEUE)
      const request = store.add(action)

      request.onsuccess = () => resolve(action)
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('Error al guardar acción en cola offline:', err)
    // Fallback a localStorage si falla IndexedDB
    try {
      const existing = getLocalStorageQueue()
      existing.push(action)
      localStorage.setItem('control_dotz_pending_queue', JSON.stringify(existing))
    } catch (lsErr) {
      console.error('Error fallback localStorage:', lsErr)
    }
    return action
  }
}

/**
 * Obtiene todas las acciones pendientes de la cola
 */
export async function getPendingQueue(): Promise<PendingAction[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readonly')
      const store = tx.objectStore(STORE_QUEUE)
      const request = store.getAll()

      request.onsuccess = () => {
        const results = (request.result as PendingAction[]) || []
        // Ordenar por fecha de creación ascendente
        results.sort((a, b) => a.createdAt - b.createdAt)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    return getLocalStorageQueue()
  }
}

/**
 * Elimina una acción procesada de la cola
 */
export async function removePendingAction(id: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_QUEUE)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    const queue = getLocalStorageQueue().filter((a) => a.id !== id)
    localStorage.setItem('control_dotz_pending_queue', JSON.stringify(queue))
  }
}

/**
 * Actualiza el estado o reintentos de una acción en la cola
 */
export async function updatePendingAction(action: PendingAction): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_QUEUE)
      const request = store.put(action)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    const queue = getLocalStorageQueue().map((a) => (a.id === action.id ? action : a))
    localStorage.setItem('control_dotz_pending_queue', JSON.stringify(queue))
  }
}

/**
 * Vacía la cola de pendientes
 */
export async function clearPendingQueue(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_QUEUE)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    localStorage.removeItem('control_dotz_pending_queue')
  }
}

/**
 * Guarda datos en la caché de lectura local (gastos, chat, shopping, etc.)
 */
export async function setOfflineCache<T>(key: string, data: T): Promise<void> {
  const item = { key, data, updatedAt: Date.now() }
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite')
      const store = tx.objectStore(STORE_CACHE)
      const request = store.put(item)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    try {
      localStorage.setItem(`control_dotz_cache_${key}`, JSON.stringify(item))
    } catch (_) {}
  }
}

/**
 * Obtiene datos de la caché de lectura local
 */
export async function getOfflineCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly')
      const store = tx.objectStore(STORE_CACHE)
      const request = store.get(key)

      request.onsuccess = () => {
        if (request.result) resolve(request.result.data as T)
        else resolve(null)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    try {
      const cached = localStorage.getItem(`control_dotz_cache_${key}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        return parsed.data as T
      }
    } catch (_) {}
    return null
  }
}

// Fallback helpers para localStorage
function getLocalStorageQueue(): PendingAction[] {
  try {
    const raw = localStorage.getItem('control_dotz_pending_queue')
    return raw ? JSON.parse(raw) : []
  } catch (_) {
    return []
  }
}
