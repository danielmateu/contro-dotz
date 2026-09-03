/**
 * Calcula el promedio diario de gasto
 */
export function calculateDailyAverage(
  totalSpent: number,
  daysPassed: number
): number {
  if (daysPassed <= 0 || totalSpent <= 0) return 0
  return totalSpent / daysPassed
}

/**
 * Calcula el cambio porcentual de gastos entre dos meses (variación porcentual)
 */
export function calculatePercentageChange(
  currentTotal: number,
  previousTotal: number
): number {
  if (previousTotal <= 0) return 0
  const diffAbsolute = currentTotal - previousTotal
  return (diffAbsolute / previousTotal) * 100
}

export interface Member {
  user_id: string
  monthly_income?: number
  monthly_contribution?: number
  profiles?: {
    display_name: string | null
    email: string
  } | null
}

export interface Expense {
  created_by: string | null
  amount: number
  is_personal?: boolean
}

export interface Settlement {
  id?: string
  payer_id: string
  receiver_id: string
  amount: number
  settled_at?: string
}

export interface MemberBalance {
  user_id: string
  name: string
  email: string
  spent: number
  paid: number
  received: number
  fairShare: number
  balance: number
  contribution?: number
  income?: number
  weight?: number
}

export interface Debt {
  from_user_id: string
  from_name: string
  to_user_id: string
  to_name: string
  amount: number
}

/**
 * Calcula el balance neto de cada miembro del hogar teniendo en cuenta los gastos del hogar (no personales) y las liquidaciones
 */
export function calculateBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): MemberBalance[] {
  const spentMap = new Map<string, number>()
  const paidMap = new Map<string, number>()
  const receivedMap = new Map<string, number>()

  // Inicializar mapas
  members.forEach((m) => {
    spentMap.set(m.user_id, 0)
    paidMap.set(m.user_id, 0)
    receivedMap.set(m.user_id, 0)
  })

  // Acumular gastos compartidos del hogar (excluyendo gastos marcados como is_personal)
  let totalSpent = 0
  expenses.forEach((e) => {
    if (!e.is_personal && e.created_by && spentMap.has(e.created_by)) {
      const current = spentMap.get(e.created_by) || 0
      spentMap.set(e.created_by, current + Number(e.amount))
      totalSpent += Number(e.amount)
    }
  })

  // Acumular liquidaciones (pagos directos entre miembros)
  settlements.forEach((s) => {
    if (paidMap.has(s.payer_id)) {
      const currentPaid = paidMap.get(s.payer_id) || 0
      paidMap.set(s.payer_id, currentPaid + Number(s.amount))
    }
    if (receivedMap.has(s.receiver_id)) {
      const currentReceived = receivedMap.get(s.receiver_id) || 0
      receivedMap.set(s.receiver_id, currentReceived + Number(s.amount))
    }
  })

  // Calcular la cuota justa basada en aportaciones o ingresos si están configurados, sino división equitativa
  const totalContributions = members.reduce((sum, m) => sum + Number(m.monthly_contribution || 0), 0)
  const totalIncomes = members.reduce((sum, m) => sum + Number(m.monthly_income || 0), 0)
  const numMembers = members.length

  return members.map((m) => {
    const spent = spentMap.get(m.user_id) || 0
    const paid = paidMap.get(m.user_id) || 0
    const received = receivedMap.get(m.user_id) || 0
    const contribution = Number(m.monthly_contribution || 0)
    const income = Number(m.monthly_income || 0)

    let memberWeight = 0
    if (totalContributions > 0) {
      memberWeight = contribution / totalContributions
    } else if (totalIncomes > 0) {
      memberWeight = income / totalIncomes
    } else {
      memberWeight = numMembers > 0 ? 1 / numMembers : 0
    }

    const memberFairShare = totalSpent * memberWeight
    const balance = spent + paid - received - memberFairShare

    return {
      user_id: m.user_id,
      name: m.profiles?.display_name || m.profiles?.email.split('@')[0] || 'Miembro',
      email: m.profiles?.email || '',
      spent,
      paid,
      received,
      fairShare: Math.round(memberFairShare * 100) / 100,
      balance: Math.round(balance * 100) / 100, // Redondear a 2 decimales
      contribution,
      income,
      weight: Math.round(memberWeight * 10000) / 100,
    }
  })
}

/**
 * Algoritmo Greedy para simplificar las deudas cruzadas al número mínimo de transacciones
 */
export function calculateDebts(balances: MemberBalance[]): Debt[] {
  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ ...b }))
  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ ...b }))

  // Ordenar deudores de forma que los que deben más queden al inicio
  debtors.sort((a, b) => a.balance - b.balance)
  // Ordenar acreedores de forma que a los que se les debe más queden al inicio
  creditors.sort((a, b) => b.balance - a.balance)

  const debts: Debt[] = []

  let dIdx = 0
  let cIdx = 0

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx]
    const creditor = creditors[cIdx]

    const debtVal = Math.min(Math.abs(debtor.balance), creditor.balance)

    if (debtVal > 0.01) {
      debts.push({
        from_user_id: debtor.user_id,
        from_name: debtor.name,
        to_user_id: creditor.user_id,
        to_name: creditor.name,
        amount: Math.round(debtVal * 100) / 100,
      })
    }

    debtor.balance += debtVal
    creditor.balance -= debtVal

    if (Math.abs(debtor.balance) < 0.01) dIdx++
    if (Math.abs(creditor.balance) < 0.01) cIdx++
  }

  return debts
}
