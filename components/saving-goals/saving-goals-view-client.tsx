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
}

export function SavingGoalsViewClient({
  householdId,
  currentUserId,
  isOwner,
  initialGoals,
  initialContributions,
  members,
}: SavingGoalsViewClientProps) {
  const { t, locale } = useI18n()

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          {locale === 'en'
            ? 'Collaborative Savings Goals'
            : locale === 'ca'
              ? 'Guardioles d\'Estalvi Col·lectiu'
              : 'Huchas de Ahorro Colectivo'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'en'
            ? 'Set collaborative financial goals with your family, make contributions and track your savings progress in real time.'
            : locale === 'ca'
              ? 'Defineix fites financeres col·laboratives amb la teva família, fes aportacions i segueix el progrés en temps real.'
              : 'Define metas financieras colaborativas con tu familia, realiza aportaciones y sigue el progreso de vuestro ahorro en tiempo real.'}
        </p>
      </div>

      <SavingGoalsClient
        householdId={householdId}
        currentUserId={currentUserId}
        isOwner={isOwner}
        initialGoals={initialGoals}
        initialContributions={initialContributions}
        members={members}
      />
    </div>
  )
}
