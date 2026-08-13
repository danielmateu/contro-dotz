import { describe, it, expect } from 'vitest'
import {
  calculateDailyAverage,
  calculatePercentageChange,
  calculateBalances,
  calculateDebts,
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

describe('Saldos y Deudas', () => {
  const members = [
    { user_id: 'userA', profiles: { display_name: 'Alice', email: 'alice@test.com' } },
    { user_id: 'userB', profiles: { display_name: 'Bob', email: 'bob@test.com' } },
    { user_id: 'userC', profiles: { display_name: 'Charlie', email: 'charlie@test.com' } },
  ]

  it('debe calcular balances correctos sin liquidaciones', () => {
    const expenses = [
      { created_by: 'userA', amount: 90 }, // Alice pagó 90 (cuota justa: 30)
    ]
    const settlements: any[] = []

    const balances = calculateBalances(members, expenses, settlements)

    const alice = balances.find((b: any) => b.user_id === 'userA')
    const bob = balances.find((b: any) => b.user_id === 'userB')
    const charlie = balances.find((b: any) => b.user_id === 'userC')

    expect(alice!.balance).toBe(60) // +60
    expect(bob!.balance).toBe(-30) // -30
    expect(charlie!.balance).toBe(-30) // -30

    const debts = calculateDebts(balances)
    expect(debts.length).toBe(2)
    expect(debts).toContainEqual({
      from_user_id: 'userB',
      from_name: 'Bob',
      to_user_id: 'userA',
      to_name: 'Alice',
      amount: 30,
    })
    expect(debts).toContainEqual({
      from_user_id: 'userC',
      from_name: 'Charlie',
      to_user_id: 'userA',
      to_name: 'Alice',
      amount: 30,
    })
  })

  it('debe calcular balances correctos con liquidaciones intermedias', () => {
    const expenses = [
      { created_by: 'userA', amount: 90 },
    ]
    const settlements = [
      { payer_id: 'userB', receiver_id: 'userA', amount: 20 }, // Bob paga 20 a Alice
    ]

    const balances = calculateBalances(members, expenses, settlements)

    const alice = balances.find((b: any) => b.user_id === 'userA')
    const bob = balances.find((b: any) => b.user_id === 'userB')
    const charlie = balances.find((b: any) => b.user_id === 'userC')

    expect(alice!.balance).toBe(40) // +40 (90 spent - 20 received - 30 fair)
    expect(bob!.balance).toBe(-10) // -10 (0 spent + 20 paid - 30 fair)
    expect(charlie!.balance).toBe(-30) // -30

    const debts = calculateDebts(balances)
    expect(debts.length).toBe(2)
    expect(debts).toContainEqual({
      from_user_id: 'userB',
      from_name: 'Bob',
      to_user_id: 'userA',
      to_name: 'Alice',
      amount: 10,
    })
    expect(debts).toContainEqual({
      from_user_id: 'userC',
      from_name: 'Charlie',
      to_user_id: 'userA',
      to_name: 'Alice',
      amount: 30,
    })
  })
})
