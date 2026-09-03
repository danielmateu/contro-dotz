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

  it('debe calcular la cuota justa basada en aportaciones acordadas (40% / 60%)', () => {
    const coupleMembers = [
      { user_id: 'daniel', monthly_contribution: 600, profiles: { display_name: 'Daniel', email: 'd@test.com' } },
      { user_id: 'pareja', monthly_contribution: 900, profiles: { display_name: 'Pareja', email: 'p@test.com' } },
    ]
    const expenses = [
      { created_by: 'daniel', amount: 500, is_personal: false }, // Daniel pagó 500€ de hogar
      { created_by: 'daniel', amount: 100, is_personal: true },  // 100€ es personal, debe ignorarse en el bote
      { created_by: 'pareja', amount: 1000, is_personal: false }, // Pareja pagó 1000€ de hogar
    ]
    const settlements: any[] = []

    const balances = calculateBalances(coupleMembers, expenses, settlements)

    const daniel = balances.find((b: any) => b.user_id === 'daniel')
    const pareja = balances.find((b: any) => b.user_id === 'pareja')

    // Gastos totales compartidos = 500 + 1000 = 1500€
    // Aportación total = 600 + 900 = 1500€
    // Cuota Daniel (600/1500 = 40%) = 600€
    // Cuota Pareja (900/1500 = 60%) = 900€
    expect(daniel!.spent).toBe(500)
    expect(daniel!.fairShare).toBe(600)
    expect(daniel!.balance).toBe(-100) // Debe 100€ a Pareja

    expect(pareja!.spent).toBe(1000)
    expect(pareja!.fairShare).toBe(900)
    expect(pareja!.balance).toBe(100) // Le deben 100€
  })

  it('debe calcular la cuota justa proporcional basada en ingresos (39.72% / 60.28%) cuando no hay aportación fija', () => {
    const familyMembers = [
      { user_id: 'papi', monthly_income: 2011, profiles: { display_name: 'Papi Dotz', email: 'papi@test.com' } },
      { user_id: 'mamona', monthly_income: 3052, profiles: { display_name: 'Mamona', email: 'mamona@test.com' } },
    ]
    const expenses = [
      { created_by: 'papi', amount: 161.58, is_personal: false },
      { created_by: 'mamona', amount: 218.06 + 670.75, is_personal: false },
    ]
    const settlements: any[] = []

    const balances = calculateBalances(familyMembers, expenses, settlements)

    const papi = balances.find((b: any) => b.user_id === 'papi')
    const mamona = balances.find((b: any) => b.user_id === 'mamona')

    // Gastos totales = 161.58 + 888.81 = 1050.39€
    // Ingresos totales = 2011 + 3052 = 5063€
    // Papi peso = 2011 / 5063 = 39.72%
    // Mamona peso = 3052 / 5063 = 60.28%
    expect(papi!.weight).toBe(39.72)
    expect(mamona!.weight).toBe(60.28)

    // Cuota justa Papi = 1050.39 * (2011 / 5063) = 417.21€
    // Cuota justa Mamona = 1050.39 * (3052 / 5063) = 633.18€
    expect(papi!.fairShare).toBe(417.21)
    expect(mamona!.fairShare).toBe(633.18)
  })
})

