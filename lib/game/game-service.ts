import { createClient } from '@/lib/supabase/client'

export interface ShopItem {
  id: string
  name: { es: string; ca: string }
  description: { es: string; ca: string }
  price: number
  icon: string
  category: 'head' | 'eyes' | 'body' | 'hand'
}

export interface QuestItem {
  id: string
  title: { es: string; ca: string }
  description: { es: string; ca: string }
  rewardCoins: number
  rewardXp: number
  icon: string
  conditionType: 'budget_ok' | 'streak' | 'has_budget' | 'super_hero'
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'beer',
    name: { es: 'Cerveza Fresca', ca: 'Cervesa Fresca' },
    description: { es: '¡Para celebrar la buena gestión del presupuesto!', ca: 'Per celebrar la bona gestió del pressupost!' },
    price: 60,
    icon: '🍺',
    category: 'hand',
  },
  {
    id: 'crown',
    name: { es: 'Corona Dorada', ca: 'Corona Daurada' },
    description: { es: 'Para el rey o la reina del ahorro mensual', ca: 'Per al rei o la reina de l’estalvi mensual' },
    price: 150,
    icon: '👑',
    category: 'head',
  },
  {
    id: 'glasses',
    name: { es: 'Gafas de Sol Cool', ca: 'Ulleres de Sol Cool' },
    description: { es: 'Estilazo financiero impecable', ca: 'Estil financer impecable' },
    price: 80,
    icon: '🕶️',
    category: 'eyes',
  },
  {
    id: 'headphones',
    name: { es: 'Auriculares DJ', ca: 'Auriculars DJ' },
    description: { es: 'Ahorrando a todo ritmo', ca: 'Estalviant a tot ritme' },
    price: 100,
    icon: '🎧',
    category: 'head',
  },
  {
    id: 'grad_cap',
    name: { es: 'Birrete Sabio', ca: 'Birret Sabi' },
    description: { es: 'Graduado con honores en finanzas', ca: 'Graduat amb honors en finances' },
    price: 120,
    icon: '🎓',
    category: 'head',
  },
  {
    id: 'cape',
    name: { es: 'Capa de Héroe', ca: 'Capa d’Heroi' },
    description: { es: 'Protector legendario de los ahorros del hogar', ca: 'Protector llegendari de l’estalvi' },
    price: 200,
    icon: '🦸',
    category: 'body',
  },
  {
    id: 'party_hat',
    name: { es: 'Gorro de Fiesta', ca: 'Barret de Festa' },
    description: { es: '¡Fiesta por no pasarse de presupuesto!', ca: 'Festa per no passar-se de pressupost!' },
    price: 50,
    icon: '🥳',
    category: 'head',
  },
  {
    id: 'pizza',
    name: { es: 'Porción de Pizza', ca: 'Porció de Pizza' },
    description: { es: '¡Para celebrar un capricho dentro de presupuesto!', ca: 'Per celebrar un capritx!' },
    price: 75,
    icon: '🍕',
    category: 'hand', // 'head' | 'eyes' | 'body' | 'hand'
  }
]

export const GAME_QUESTS: QuestItem[] = [
  {
    id: 'quest_first_saving',
    title: { es: 'Primer Control de Gasto', ca: 'Primer Control de Despesa' },
    description: { es: 'Mantén tu presupuesto mensual dentro de los límites', ca: 'Manté el teu pressupost mensual dins dels límits' },
    rewardCoins: 40,
    rewardXp: 30,
    icon: '🎯',
    conditionType: 'budget_ok',
  },
  {
    id: 'quest_budget_master',
    title: { es: 'Maestro del Presupuesto', ca: 'Mestre del Pressupost' },
    description: { es: 'Configura presupuestos para tus categorías clave', ca: 'Configura pressupostos per a les teves categories clau' },
    rewardCoins: 70,
    rewardXp: 50,
    icon: '📊',
    conditionType: 'has_budget',
  },
  {
    id: 'quest_streak_master',
    title: { es: 'Racha Imparable', ca: 'Racha Imparable' },
    description: { es: 'Consigue 3 o más días seguidos de racha positiva', ca: 'Aconsegueix 3 o més dies seguits de racha positiva' },
    rewardCoins: 100,
    rewardXp: 80,
    icon: '🔥',
    conditionType: 'streak',
  },
  {
    id: 'quest_super_saver',
    title: { es: 'Leyenda del Ahorro', ca: 'Llegenda de l’Estalvi' },
    description: { es: 'Alcanza el estado Súper Héroe este mes', ca: 'Aconsegueix l’estat Súper Heroi' },
    rewardCoins: 150,
    rewardXp: 100,
    icon: '⚡',
    conditionType: 'super_hero',
  }

]

export interface UserGameState {
  coins: number
  equippedAccessory: string
  unlockedItems: string[]
  completedQuests: string[]
}

const LOCAL_STORAGE_KEY = 'dotzi_user_game_state'

export const DEFAULT_GAME_STATE: UserGameState = {
  coins: 120, // Bonificación inicial de bienvenida
  equippedAccessory: 'none',
  unlockedItems: ['none'],
  completedQuests: [],
}

export function getLocalGameState(): UserGameState {
  if (typeof window === 'undefined') return DEFAULT_GAME_STATE
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return DEFAULT_GAME_STATE
    return { ...DEFAULT_GAME_STATE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_GAME_STATE
  }
}

export function setLocalGameState(state: UserGameState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Error saving game state locally:', err)
  }
}

export async function fetchUserGameState(): Promise<UserGameState> {
  const local = getLocalGameState()

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return local

    const { data, error } = await supabase
      .from('user_game_state')
      .select('coins, equipped_accessory, unlocked_items, completed_quests')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return local
    }

    const state: UserGameState = {
      coins: data.coins ?? local.coins,
      equippedAccessory: data.equipped_accessory ?? local.equippedAccessory,
      unlockedItems: Array.isArray(data.unlocked_items) ? data.unlocked_items : local.unlockedItems,
      completedQuests: Array.isArray(data.completed_quests) ? data.completed_quests : local.completedQuests,
    }

    setLocalGameState(state)
    return state
  } catch {
    return local
  }
}

export async function saveUserGameState(state: UserGameState): Promise<void> {
  setLocalGameState(state)

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('user_game_state')
      .upsert({
        user_id: user.id,
        coins: state.coins,
        equipped_accessory: state.equippedAccessory,
        unlocked_items: state.unlockedItems,
        completed_quests: state.completedQuests,
        updated_at: new Date().toISOString(),
      })
  } catch (err) {
    console.warn('Could not sync game state to Supabase, saved locally:', err)
  }
}
