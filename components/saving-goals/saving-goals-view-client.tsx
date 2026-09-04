'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { SavingGoalsClient } from '@/components/saving-goals/saving-goals-client'

interface SavingGoalsViewClientProps {
  householdId: string
  currentUserId: string
  isOwner: boolean
  initialGoals: any[]
  initialContributions: any[]
  members: any[]
  totalMonthlySalary?: number
  totalHouseholdSaved?: number
  currentMonthSavings?: number
}

export function SavingGoalsViewClient({
  householdId,
  currentUserId,
  isOwner,
  initialGoals,
  initialContributions,
  members,
  totalMonthlySalary = 0,
  totalHouseholdSaved = 0,
  currentMonthSavings = 0,
}: SavingGoalsViewClientProps) {
  const { t, locale } = useI18n()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          {locale === 'en'
            ? 'Collaborative Savings & Piggy Banks'
            : locale === 'ca'
              ? 'Guardioles i Estalvis Col·lectius'
              : 'Huchas y Ahorro Colectivo'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'en'
            ? 'Track how much of your salary is allocated to savings, define flexible piggy banks or goals, and level up your Tamagotchi together.'
            : locale === 'ca'
              ? 'Segueix quin percentatge del salari destines a l\'estalvi, crea guardioles lliures o metas, i fa evolucionar el teu Tamagotchi.'
              : 'Analiza qué porcentaje de tu salario destinas al ahorro, crea huchas libres u objetivos, y evoluciona a tu Tamagotchi ahorrando juntos.'}
        </p>
      </div>

      <SavingGoalsClient
        householdId={householdId}
        currentUserId={currentUserId}
        isOwner={isOwner}
        initialGoals={initialGoals}
        initialContributions={initialContributions}
        members={members}
        totalMonthlySalary={totalMonthlySalary}
        totalHouseholdSaved={totalHouseholdSaved}
        currentMonthSavings={currentMonthSavings}
      />
    </div>
  )
}
