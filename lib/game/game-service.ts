import { createClient } from '@/lib/supabase/client'

export interface ShopItem {
  id: string
  name: { es: string; ca: string }
  description: { es: string; ca: string }
  price: number
  icon: string
  category: 'head' | 'eyes' | 'body' | 'hand' | 'skin' | 'hair' | 'food'
  restoreHealth?: number
  rewardXp?: number
}

export interface QuestItem {
  id: string
  title: { es: string; ca: string }
  description: { es: string; ca: string }
  rewardCoins: number
  rewardXp: number
  icon: string
  conditionType: 'budget_ok' | 'streak' | 'has_budget' | 'super_hero' | 'saving_contribution'
}

export const SHOP_ITEMS: ShopItem[] = [
  // --- ACCESORIOS Y ROPA ---
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
    category: 'hand',
  },

  // --- COLORES / PIEL ---
  {
    id: 'skin_indigo',
    name: { es: 'Menta Clásico', ca: 'Menta Clàssic' },
    description: { es: 'El color verde suave original de Dotzi', ca: 'El color verd suau original de Dotzi' },
    price: 0,
    icon: '🟩',
    category: 'skin',
  },
  {
    id: 'skin_purple',
    name: { es: 'Púrpura Cíber', ca: 'Púrpura Cíber' },
    description: { es: 'Un tono morado neón futurista', ca: 'Un to lila neó futurista' },
    price: 50,
    icon: '🟪',
    category: 'skin',
  },
  {
    id: 'skin_cyan',
    name: { es: 'Cian Océano', ca: 'Cian Oceà' },
    description: { es: 'Color azul turquesa brillante y fresco', ca: 'Color blau turquesa brillant i fresc' },
    price: 60,
    icon: '🟦',
    category: 'skin',
  },
  {
    id: 'skin_amber',
    name: { es: 'Dorado Ahorrador', ca: 'Daurat Estalviador' },
    description: { es: '¡Destaca como una hucha de oro puro!', ca: 'Destaca com una guardiola d’or pur!' },
    price: 100,
    icon: '🟨',
    category: 'skin',
  },
  {
    id: 'skin_rose',
    name: { es: 'Rosa Coquette', ca: 'Rosa Coquette' },
    description: { es: 'Estilo pastel súper dulce y entrañable', ca: 'Estil pastel súper dolç i entranyable' },
    price: 50,
    icon: '🌸',
    category: 'skin',
  },

  // --- PEINADOS ---
  {
    id: 'hair_none',
    name: { es: 'Sin Peinado', ca: 'Sense Capell' },
    description: { es: 'Suave y redondito al natural', ca: 'Suau i rodonet al natural' },
    price: 0,
    icon: '👶',
    category: 'hair',
  },
  {
    id: 'hair_copete',
    name: { es: 'Copete Cool', ca: 'Tufeig Cool' },
    description: { es: 'Un peinado elegante y con mucho estilo', ca: 'Un peinat elegant i amb molt d’estil' },
    price: 40,
    icon: '💇‍♂️',
    category: 'hair',
  },
  {
    id: 'hair_cresta',
    name: { es: 'Cresta Punk', ca: 'Cresta Punk' },
    description: { es: '¡Actitud rebelde contra las compras compulsivas!', ca: 'Actitud rebel contra les compres compulsives!' },
    price: 60,
    icon: '🧑‍🎤',
    category: 'hair',
  },
  {
    id: 'hair_afro',
    name: { es: 'Afro Retro', ca: 'Afro Retro' },
    description: { es: 'Volumen esponjoso y ritmo setentero', ca: 'Volum esponjós i ritme setenter' },
    price: 70,
    icon: '🧑‍🦱',
    category: 'hair',
  },
  {
    id: 'hair_bow',
    name: { es: 'Lazo Coquette', ca: 'Llaç Coquette' },
    description: { es: 'Un lacito coqueto en la cabeza', ca: 'Un llaç bonic al cap' },
    price: 50,
    icon: '🎀',
    category: 'hair',
  },
  {
    id: 'hair_spikes',
    name: { es: 'Picos Anime', ca: 'Panti Anime' },
    description: { es: 'Peinado de protagonista de anime', ca: 'Peinat de protagonista d’anime' },
    price: 80,
    icon: '⚡',
    category: 'hair',
  },

  // --- COMIDAS / ALIMENTACIÓN ---
  {
    id: 'food_pizza',
    name: { es: 'Porción de Pizza 🍕', ca: 'Porció de Pizza 🍕' },
    description: { es: 'Alimenta a Dotzi y aumenta su felicidad (+15 XP)', ca: 'Alimenta en Dotzi i augmenta la seva felicitat (+15 XP)' },
    price: 15,
    icon: '🍕',
    category: 'food',
    rewardXp: 15,
  },
  {
    id: 'food_salad',
    name: { es: 'Ensalada Fresca 🥗', ca: 'Amanida Fresca 🥗' },
    description: { es: 'Comida equilibrada para mantener a Dotzi sano (+10 XP)', ca: 'Menjar equilibrat per mantenir en Dotzi sa (+10 XP)' },
    price: 10,
    icon: '🥗',
    category: 'food',
    rewardXp: 10,
  },
  {
    id: 'food_ramen',
    name: { es: 'Ramen Calientito 🍜', ca: 'Ramen Calentet 🍜' },
    description: { es: 'Un tazón reconfortante lleno de energía (+20 XP)', ca: 'Un bol reconfortant ple d’energia (+20 XP)' },
    price: 20,
    icon: '🍜',
    category: 'food',
    rewardXp: 20,
  },
  {
    id: 'food_icecream',
    name: { es: 'Helado Delicioso 🍦', ca: 'Gelat Deliciós 🍦' },
    description: { es: 'Un capricho dulce irresistible (+12 XP)', ca: 'Un capritx dolç irresistible (+12 XP)' },
    price: 12,
    icon: '🍦',
    category: 'food',
    rewardXp: 12,
  },
  {
    id: 'food_donut',
    name: { es: 'Donut Glaseado 🍩', ca: 'Donut Glassejat 🍩' },
    description: { es: 'Energía azucarada instantánea (+12 XP)', ca: 'Energia sucrejada instantània (+12 XP)' },
    price: 12,
    icon: '🍩',
    category: 'food',
    rewardXp: 12,
  },
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
    id: 'quest_saving_contribution',
    title: { es: 'Ahorrador Activo', ca: 'Estalviador Actiu' },
    description: { es: 'Añade fondos a una hucha de ahorro', ca: 'Afegeix fons a una guardiola d’estalvi' },
    rewardCoins: 50,
    rewardXp: 40,
    icon: '🐷',
    conditionType: 'saving_contribution',
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
  skinColor: string
  hairstyle: string
  unlockedItems: string[]
  completedQuests: string[]
  tapCount: number
}

const LOCAL_STORAGE_KEY = 'dotzi_user_game_state'

export const DEFAULT_GAME_STATE: UserGameState = {
  coins: 120, // Bonificación inicial de bienvenida
  equippedAccessory: 'none',
  skinColor: 'skin_indigo',
  hairstyle: 'hair_none',
  unlockedItems: ['none', 'skin_indigo', 'hair_none'],
  completedQuests: [],
  tapCount: 0,
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
      .select('coins, equipped_accessory, skin_color, hairstyle, unlocked_items, completed_quests, tap_count')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return local
    }

    const state: UserGameState = {
      coins: data.coins ?? local.coins,
      equippedAccessory: data.equipped_accessory ?? local.equippedAccessory,
      skinColor: data.skin_color ?? local.skinColor ?? 'skin_indigo',
      hairstyle: data.hairstyle ?? local.hairstyle ?? 'hair_none',
      unlockedItems: Array.isArray(data.unlocked_items) ? data.unlocked_items : local.unlockedItems,
      completedQuests: Array.isArray(data.completed_quests) ? data.completed_quests : local.completedQuests,
      tapCount: data.tap_count ?? local.tapCount ?? 0,
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

    const { error } = await supabase
      .from('user_game_state')
      .upsert({
        user_id: user.id,
        coins: state.coins,
        equipped_accessory: state.equippedAccessory,
        skin_color: state.skinColor,
        hairstyle: state.hairstyle,
        unlocked_items: state.unlockedItems,
        completed_quests: state.completedQuests,
        tap_count: state.tapCount,
        updated_at: new Date().toISOString(),
      })

    // Si Supabase devuelve error (ej. si la migración de skin_color/hairstyle aún no se ha ejecutado), hacemos fallback a las columnas base
    if (error) {
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
    }
  } catch (err) {
    console.warn('Could not sync game state to Supabase, saved locally:', err)
  }
}
