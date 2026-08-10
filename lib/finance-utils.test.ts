import { describe, it, expect } from 'vitest'
import {
  calculateDailyAverage,
  calculatePercentageChange,
} from './finance-utils'

describe('calculateDailyAverage', () => {
  it('debe calcular el promedio diario correctamente', () => {
    expect(calculateDailyAverage(300, 10)).toBe(30)
    expect(calculateDailyAverage(150.5, 5)).toBe(30.1)
  })

  it('debe retornar 0 si los días transcurridos son 0 o negativos', () => {
    expect(calculateDailyAverage(300, 0)).toBe(0)
    expect(calculateDailyAverage(300, -5)).toBe(0)
  })

  it('debe retornar 0 si el gasto total es 0 o negativo', () => {
    expect(calculateDailyAverage(0, 10)).toBe(0)
    expect(calculateDailyAverage(-100, 10)).toBe(0)
  })
})

describe('calculatePercentageChange', () => {
  it('debe calcular la variación porcentual correctamente', () => {
    expect(calculatePercentageChange(150, 100)).toBe(50) // +50%
    expect(calculatePercentageChange(75, 100)).toBe(-25) // -25%
    expect(calculatePercentageChange(100, 100)).toBe(0) // 0%
  })

  it('debe retornar 0 si el mes anterior no tuvo gastos (anterior total <= 0)', () => {
    expect(calculatePercentageChange(100, 0)).toBe(0)
    expect(calculatePercentageChange(100, -50)).toBe(0)
  })
})
