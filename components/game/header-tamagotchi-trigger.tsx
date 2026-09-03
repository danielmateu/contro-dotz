'use client'

import React, { useState, useEffect } from 'react'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'
import { TamagotchiCard } from '@/components/game/tamagotchi-card'
import { calculatePetStats, PetStats } from '@/lib/game/fin-pet-engine'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { fetchUserGameState } from '@/lib/game/game-service'
import { Button } from '@/components/ui/button'

interface HeaderTamagotchiTriggerProps {
  householdId?: string
}

export function HeaderTamagotchiTrigger({ householdId }: HeaderTamagotchiTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [equippedAccessory, setEquippedAccessory] = useState('none')
  const [stats, setStats] = useState<PetStats>(() =>
    calculatePetStats({
      currentTotalSpent: 0,
      totalBudgeted: 1000,
      daysPassed: new Date().getDate(),
    })
  )

  useEffect(() => {
    async function loadMonthlyData() {
      try {
        const gameState = await fetchUserGameState()
        setEquippedAccessory(gameState.equippedAccessory)

        const supabase = createClient()
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonthNum = now.getMonth() + 1
        const currentMonthStr = `${currentYear}-${currentMonthNum.toString().padStart(2, '0')}`
        const currentLastDay = new Date(currentYear, currentMonthNum, 0).getDate()
        const currentStartDate = `${currentMonthStr}-01`
        const currentEndDate = `${currentMonthStr}-${currentLastDay.toString().padStart(2, '0')}`

        // Cargar gastos y presupuestos del mes
        const [expensesRes, budgetsRes] = await Promise.all([
          supabase
            .from('expenses')
            .select('amount, is_personal')
            .gte('expense_date', currentStartDate)
            .lte('expense_date', currentEndDate),
          supabase
            .from('budgets')
            .select('amount')
            .eq('month', currentMonthStr),
        ])

        const expenses = expensesRes.data || []
        const budgets = budgetsRes.data || []

        const totalSpent = expenses
          .filter((e) => !e.is_personal)
          .reduce((sum, e) => sum + Number(e.amount), 0)

        const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0)

        const newStats = calculatePetStats({
          currentTotalSpent: totalSpent,
          totalBudgeted: totalBudgeted,
          daysPassed: now.getDate(),
          totalDaysInMonth: currentLastDay,
        })

        setStats(newStats)
      } catch (err) {
        console.error('Error loading pet stats for header:', err)
      }
    }

    loadMonthlyData()
  }, [householdId, isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full hover:bg-accent/50 transition-transform active:scale-95"
            aria-label="Ver Tamagotchi Financiero Dotzi"
          >
            <TamagotchiAvatar mood={stats.mood} size="sm" equippedAccessory={equippedAccessory} interactive={false} />
            {stats.health < 50 && (
              <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
            )}
          </Button>
        }
      />

      <PopoverContent
        align="end"
        sideOffset={8}
        className="min-w-lg p-0 border-0 rounded-3xl overflow-hidden shadow-2xl bg-transparent"
      >
        <TamagotchiCard
          stats={stats}
          variant="popover"
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}
