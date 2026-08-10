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
