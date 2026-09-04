export type PetMood = 'super_hero' | 'happy' | 'warning' | 'exhausted' | 'sleeping'

export interface PetStats {
  health: number // 0 - 100
  mood: PetMood
  level: number
  xp: number
  streakDays: number
  spentPercentage: number
  paceStatus: 'excellent' | 'good' | 'warning' | 'critical'
  dialogue: string
  moodTitle: string
}

export interface CalculatePetStatsParams {
  currentTotalSpent: number
  totalBudgeted: number
  daysPassed: number
  totalDaysInMonth?: number
  totalHouseholdFund?: number
  totalSavingsThisMonth?: number
  locale?: string
}

export function calculatePetStats({
  currentTotalSpent,
  totalBudgeted,
  daysPassed,
  totalDaysInMonth = 30,
  totalHouseholdFund = 0,
  totalSavingsThisMonth = 0,
  locale = 'es',
}: CalculatePetStatsParams): PetStats {
  const isCatalan = locale === 'ca'
  const effectiveDays = Math.max(1, daysPassed)
  const effectiveTotalDays = Math.max(1, totalDaysInMonth)
  
  // Referencia presupuestaria principal (presupuesto global o fondo aportado)
  const referenceBudget = totalBudgeted > 0 ? totalBudgeted : (totalHouseholdFund > 0 ? totalHouseholdFund : 1000)
  
  // Porcentaje del presupuesto gastado hasta la fecha
  const spentPercentage = Math.round((currentTotalSpent / referenceBudget) * 100)

  // Evaluamos la salud base según el % global de presupuesto consumido
  let baseHealth = 100

  if (spentPercentage > 100) {
    // Sobregasto real: cae rápidamente la salud
    const over = spentPercentage - 100
    baseHealth = Math.max(10, 55 - over * 1.5)
  } else if (spentPercentage >= 90) {
    baseHealth = 50
  } else if (spentPercentage >= 75) {
    baseHealth = 65
  } else if (spentPercentage >= 50) {
    baseHealth = 80
  } else if (spentPercentage >= 30) {
    baseHealth = 90
  } else {
    baseHealth = 98
  }

  // Ritmo de gasto respecto al progreso del mes
  const monthProgressRatio = effectiveDays / effectiveTotalDays
  const expectedMaxSpent = referenceBudget * monthProgressRatio

  let paceStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'good'

  // A principios de mes (días 1 al 7), los pagos fijos o compras iniciales son habituales,
  // por lo que no penalizamos si el gasto total sigue por debajo del 60% del presupuesto.
  const isEarlyMonthBuffer = effectiveDays <= 7 && spentPercentage <= 60

  if (currentTotalSpent <= expectedMaxSpent * 0.85 || isEarlyMonthBuffer) {
    paceStatus = 'excellent'
  } else if (currentTotalSpent <= expectedMaxSpent * 1.15) {
    paceStatus = 'good'
  } else if (currentTotalSpent <= expectedMaxSpent * 1.40) {
    paceStatus = 'warning'
  } else {
    paceStatus = 'critical'
  }

  // Ajuste fino por ritmo y bonificación por ahorro activo (+5 salud por tener ahorros guardados este mes)
  let paceAdjustment = totalSavingsThisMonth > 0 ? 5 : 0
  if (!isEarlyMonthBuffer) {
    if (paceStatus === 'excellent') paceAdjustment += 5
    else if (paceStatus === 'warning') paceAdjustment -= 8
    else if (paceStatus === 'critical') paceAdjustment -= 15
  }

  const health = Math.min(100, Math.max(10, Math.round(baseHealth + paceAdjustment)))

  // Determinar estado de ánimo (mood)
  let mood: PetMood = 'happy'
  if (health >= 88 && (paceStatus === 'excellent' || spentPercentage <= 40 || totalSavingsThisMonth > 0)) {
    mood = 'super_hero'
  } else if (health >= 70) {
    mood = 'happy'
  } else if (health >= 45) {
    mood = 'warning'
  } else {
    mood = 'exhausted'
  }

  // Calcular Nivel y XP
  const baseLevel = 3
  const levelBonus = health >= 90 ? 2 : health >= 75 ? 1 : 0
  const level = baseLevel + levelBonus
  const xp = Math.min(100, Math.round(health * 0.95 + (paceStatus === 'excellent' ? 5 : 0) + (totalSavingsThisMonth > 0 ? 5 : 0)))
  const streakDays = health >= 70 ? Math.min(30, effectiveDays) : Math.max(1, Math.floor(effectiveDays / 2))

  // Generar títulos y frases dinámicas según estado e idioma
  let moodTitle = ''
  let dialogue = ''

  if (isCatalan) {
    switch (mood) {
      case 'super_hero':
        moodTitle = 'Súper Estalviador!'
        dialogue = totalSavingsThisMonth > 0
          ? 'Quina meravella d’estalvis! La teva guardiola i jo estem plens d’energia! 🐷✨'
          : spentPercentage < 50
            ? 'Increïble ritme d’estalvi! El teu patrimoni està volant alt avui! 🚀'
            : 'Ets un mestre de les finances! Segueixes molt per sota del teu límit.'
        break
      case 'happy':
        moodTitle = 'En plena forma'
        dialogue = totalSavingsThisMonth > 0
          ? 'M\'encanta veure créixer les teves guardioles! Cada aportació compta. 💰'
          : 'Tot sota control! Les finances de la llar estan en equilibri perfecte. 🌱'
        break
      case 'warning':
        moodTitle = 'Atenció al despesa'
        dialogue = 'Compte! Portem un ritme de despesa lleugerament superior al recomanat per a aquest dia del mes. ⚠️'
        break
      case 'exhausted':
      default:
        moodTitle = 'Necesita descans financer'
        dialogue = 'Uf... Hem superat el límit previst! Toca reduir despeses superflues per recuperar forces. 🩹'
        break
    }
  } else {
    switch (mood) {
      case 'super_hero':
        moodTitle = '¡Súper Ahorrador!'
        dialogue = totalSavingsThisMonth > 0
          ? '¡Qué maravilla de ahorros! ¡Mi hucha y yo estamos llenos de energía! 🐷✨'
          : spentPercentage < 50
            ? '¡Increíble ritmo de ahorro! ¡Tu salud financiera está volando alto hoy! 🚀'
            : '¡Eres un maestro de las finanzas! Te mantienes muy por debajo de tu límite.'
        break
      case 'happy':
        moodTitle = 'En plena forma'
        dialogue = totalSavingsThisMonth > 0
          ? '¡Me encanta ver crecer tus huchas! Cada aportación cuenta para el futuro. 💰'
          : '¡Todo bajo control! Las finanzas del hogar están en perfecto equilibrio. 🌱'
        break
      case 'warning':
        moodTitle = 'Alerta de gasto'
        dialogue = '¡Cuidado! Llevamos un ritmo de gasto algo superior al recomendado para este día del mes. ⚠️'
        break
      case 'exhausted':
      default:
        moodTitle = 'Enfermito por sobregasto'
        dialogue = 'Uf... ¡Hemos superado el límite previsto! Toca pausar caprichos para recuperar fuerzas. 🩹'
        break
    }
  }

  return {
    health,
    mood,
    level,
    xp,
    streakDays,
    spentPercentage,
    paceStatus,
    dialogue,
    moodTitle,
  }
}
