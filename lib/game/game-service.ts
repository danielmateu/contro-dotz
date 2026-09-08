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

export type DotziGender = 'boy' | 'girl' | 'neutral'
export type DotziPersonality = 'saver' | 'foodie' | 'adventurer' | 'zen' | 'party'

export interface HouseholdDotziMember {
  userId: string
  displayName: string
  avatarUrl: string | null
  gameState: UserGameState
}

export interface UserGameState {
  petName: string
  gender: DotziGender
  personality: DotziPersonality
  weight: number // 0 to 100, 50 is balanced, >70 is chubby, <30 is slim
  cleanliness: number // 0 to 100, 100 is squeaky clean, <40 dirty
  friendshipPoints: number
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
  petName: 'Dotzi',
  gender: 'neutral',
  personality: 'saver',
  weight: 50,
  cleanliness: 100,
  friendshipPoints: 0,
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
      .select('coins, equipped_accessory, skin_color, hairstyle, unlocked_items, completed_quests, tap_count, pet_name, gender, personality, weight, cleanliness, friendship_points')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return local
    }

    const state: UserGameState = {
      petName: data.pet_name ?? local.petName ?? 'Dotzi',
      gender: (data.gender as DotziGender) ?? local.gender ?? 'neutral',
      personality: (data.personality as DotziPersonality) ?? local.personality ?? 'saver',
      weight: data.weight ?? local.weight ?? 50,
      cleanliness: data.cleanliness ?? local.cleanliness ?? 100,
      friendshipPoints: data.friendship_points ?? local.friendshipPoints ?? 0,
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

    const payload = {
      user_id: user.id,
      coins: state.coins,
      equipped_accessory: state.equippedAccessory,
      skin_color: state.skinColor,
      hairstyle: state.hairstyle,
      unlocked_items: state.unlockedItems,
      completed_quests: state.completedQuests,
      tap_count: state.tapCount,
      pet_name: state.petName,
      gender: state.gender,
      personality: state.personality,
      weight: state.weight,
      cleanliness: state.cleanliness,
      friendship_points: state.friendshipPoints,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('user_game_state')
      .upsert(payload)

    if (error) {
      // Fallback si algunas columnas nuevas no existen en BD previa
      await supabase
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
    }
  } catch (err) {
    console.warn('Could not sync game state to Supabase, saved locally:', err)
  }
}

export async function fetchHouseholdDotzis(householdId: string): Promise<HouseholdDotziMember[]> {
  try {
    const supabase = createClient()
    
    // Obtener todos los miembros del hogar con su perfil
    const { data: members, error: membersError } = await supabase
      .from('household_members')
      .select('user_id, profiles(display_name, avatar_url)')
      .eq('household_id', householdId)

    if (membersError || !members) return []

    const userIds = members.map((m: any) => m.user_id)
    
    // Obtener los estados de juego de estos usuarios
    const { data: gameStates } = await supabase
      .from('user_game_state')
      .select('*')
      .in('user_id', userIds)

    const gameStateMap = new Map<string, any>()
    if (gameStates) {
      gameStates.forEach((gs: any) => gameStateMap.set(gs.user_id, gs))
    }

    return members.map((m: any) => {
      const gs = gameStateMap.get(m.user_id)
      const parsedGameState: UserGameState = gs ? {
        petName: gs.pet_name || 'Dotzi',
        gender: gs.gender || 'neutral',
        personality: gs.personality || 'saver',
        weight: gs.weight ?? 50,
        cleanliness: gs.cleanliness ?? 100,
        friendshipPoints: gs.friendship_points ?? 0,
        coins: gs.coins ?? 100,
        equippedAccessory: gs.equipped_accessory || 'none',
        skinColor: gs.skin_color || 'skin_indigo',
        hairstyle: gs.hairstyle || 'hair_none',
        unlockedItems: Array.isArray(gs.unlocked_items) ? gs.unlocked_items : ['none'],
        completedQuests: Array.isArray(gs.completed_quests) ? gs.completed_quests : [],
        tapCount: gs.tap_count ?? 0,
      } : { ...DEFAULT_GAME_STATE }

      return {
        userId: m.user_id,
        displayName: m.profiles?.display_name || 'Familiar',
        avatarUrl: m.profiles?.avatar_url || null,
        gameState: parsedGameState,
      }
    })
  } catch (err) {
    console.error('Error fetching household dotzis:', err)
    return []
  }
}

export async function sendHouseholdInteraction(
  receiverUserId: string,
  interactionType: 'pet' | 'treat' | 'greet' | 'wash'
): Promise<{ success: boolean; friendshipGained: number }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, friendshipGained: 0 }

    const friendshipGained = interactionType === 'treat' ? 15 : interactionType === 'pet' ? 10 : 5

    // Registrar interacción en BD
    await supabase.from('dotzi_interactions').insert({
      sender_id: user.id,
      receiver_id: receiverUserId,
      interaction_type: interactionType,
    })

    // Incrementar puntos de amistad del destinatario
    const { data: targetGs, error: selectErr } = await supabase
      .from('user_game_state')
      .select('friendship_points, cleanliness')
      .eq('user_id', receiverUserId)
      .maybeSingle()

    if (selectErr) {
      console.error('Error fetching target game state:', selectErr)
    }

    const currentPoints = targetGs?.friendship_points || 0
    const currentCleanliness = targetGs?.cleanliness ?? 100
    const newPoints = currentPoints + friendshipGained
    const newCleanliness = interactionType === 'wash' ? 100 : currentCleanliness

    if (targetGs) {
      const { error: updateErr } = await supabase
        .from('user_game_state')
        .update({
          friendship_points: newPoints,
          cleanliness: newCleanliness,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', receiverUserId)

      if (updateErr) {
        console.error('Error updating target game state:', updateErr)
      }
    } else {
      const { error: upsertErr } = await supabase
        .from('user_game_state')
        .upsert({
          user_id: receiverUserId,
          friendship_points: newPoints,
          cleanliness: newCleanliness,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (upsertErr) {
        console.error('Error upserting target game state:', upsertErr)
      }
    }

    return { success: true, friendshipGained }
  } catch (err) {
    console.error('Error sending household interaction:', err)
    return { success: false, friendshipGained: 0 }
  }
}

// --------------------------------------------------
// RETOS FAMILIARES DE AHORRO (HOUSEHOLD CHALLENGES)
// --------------------------------------------------

export interface HouseholdChallenge {
  id: string
  icon: string
  title: { es: string; ca: string; en: string }
  description: { es: string; ca: string; en: string }
  targetValue: number
  currentValue: number
  rewardCoins: number
  rewardXp: number
  isCompleted: boolean
  isClaimed: boolean
}

export const HOUSEHOLD_CHALLENGES_DEF = [
  {
    id: 'dotzi_family_love',
    icon: '❤️',
    title: {
      es: 'Cariño Familiar',
      ca: 'Afecte Familiar',
      en: 'Family Love',
    },
    description: {
      es: 'Realizad al menos 5 interacciones con las mascotas familiares.',
      ca: 'Feu almenys 5 interaccions amb les meves familiars.',
      en: 'Perform at least 5 interactions with household pets.',
    },
    targetValue: 5,
    rewardCoins: 150,
    rewardXp: 50,
  },
  {
    id: 'saving_hero',
    icon: '🐖',
    title: {
      es: 'Superahorradores del Hogar',
      ca: 'Superestalviadors de la Llar',
      en: 'Household Saving Heroes',
    },
    description: {
      es: 'Tener al menos 1 meta de ahorro activa en el hogar.',
      ca: 'Tenir almenys 1 meta d\'estalvi activa a la llar.',
      en: 'Have at least 1 active saving goal in the household.',
    },
    targetValue: 1,
    rewardCoins: 200,
    rewardXp: 75,
  },
  {
    id: 'pantry_master',
    icon: '🛒',
    title: {
      es: 'Despensa Organizada',
      ca: 'Despensa Organitzada',
      en: 'Organized Pantry',
    },
    description: {
      es: 'Añadir al menos 3 artículos a la lista de la compra del hogar.',
      ca: 'Afegir almenys 3 articles a la llista de la compra de la llar.',
      en: 'Add at least 3 items to the household shopping list.',
    },
    targetValue: 3,
    rewardCoins: 120,
    rewardXp: 40,
  },
]

export async function fetchHouseholdChallenges(
  householdId: string,
  userId: string
): Promise<HouseholdChallenge[]> {
  try {
    const supabase = createClient()

    // 1. Obtener miembros del hogar
    const { data: members } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', householdId)

    const userIds = members?.map((m: any) => m.user_id) || []

    let interactionsCount = 0
    if (userIds.length > 0) {
      const { count } = await supabase
        .from('dotzi_interactions')
        .select('*', { count: 'exact', head: true })
        .in('receiver_id', userIds)

      interactionsCount = count || 0
    }

    // 2. Obtener metas de ahorro del hogar
    const { count: goalsCount } = await supabase
      .from('saving_goals')
      .select('*', { count: 'exact', head: true })
      .eq('household_id', householdId)

    // 3. Obtener lista de la compra del hogar
    const { count: shoppingCount } = await supabase
      .from('shopping_list')
      .select('*', { count: 'exact', head: true })
      .eq('household_id', householdId)

    // 4. Obtener reclamaciones del usuario actual
    const { data: claims } = await supabase
      .from('household_challenge_claims')
      .select('challenge_key')
      .eq('household_id', householdId)
      .eq('user_id', userId)

    const claimedKeys = new Set((claims || []).map((c: any) => c.challenge_key))

    return HOUSEHOLD_CHALLENGES_DEF.map((def) => {
      let currentValue = 0
      if (def.id === 'dotzi_family_love') currentValue = interactionsCount
      else if (def.id === 'saving_hero') currentValue = goalsCount || 0
      else if (def.id === 'pantry_master') currentValue = shoppingCount || 0

      const isCompleted = currentValue >= def.targetValue
      const isClaimed = claimedKeys.has(def.id)

      return {
        id: def.id,
        icon: def.icon,
        title: def.title,
        description: def.description,
        targetValue: def.targetValue,
        currentValue: Math.min(currentValue, def.targetValue),
        rewardCoins: def.rewardCoins,
        rewardXp: def.rewardXp,
        isCompleted,
        isClaimed,
      }
    })
  } catch (err) {
    console.error('Error fetching household challenges:', err)
    return []
  }
}

export async function claimHouseholdChallengeReward(
  householdId: string,
  challengeId: string,
  userId: string,
  rewardCoins: number
): Promise<boolean> {
  try {
    const supabase = createClient()

    // 1. Insertar reclamación
    const { error: claimError } = await supabase
      .from('household_challenge_claims')
      .insert({
        challenge_key: challengeId,
        household_id: householdId,
        user_id: userId,
      })

    if (claimError) {
      console.error('Error inserting challenge claim:', claimError)
      return false
    }

    // 2. Sumar monedas al estado del usuario
    const { data: gs } = await supabase
      .from('user_game_state')
      .select('coins')
      .eq('user_id', userId)
      .maybeSingle()

    const currentCoins = gs?.coins ?? 100
    const newCoins = currentCoins + rewardCoins

    if (gs) {
      await supabase
        .from('user_game_state')
        .update({
          coins: newCoins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('user_game_state')
        .upsert({
          user_id: userId,
          coins: newCoins,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
    }

    // 3. Notificar logro en el chat familiar
    try {
      const challengeDef = HOUSEHOLD_CHALLENGES_DEF.find((c) => c.id === challengeId)
      const challengeTitle = challengeDef?.title?.es || 'Reto Familiar'
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', userId).single()
      const userName = profile?.display_name || 'Miembro'

      await supabase.from('messages').insert({
        household_id: householdId,
        created_by: userId,
        content: `🏆 **¡Reto Familiar Completado!** **${userName}** ha reclamado el premio del reto **"${challengeTitle}"** (+${rewardCoins} Monedas Dotzi) 💰🐷`,
      })
    } catch (chatErr) {
      console.error('Error posting challenge claim chat message:', chatErr)
    }

    return true
  } catch (err) {
    console.error('Error claiming household challenge reward:', err)
    return false
  }
}

