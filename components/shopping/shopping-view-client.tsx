'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { ShoppingListWindow } from '@/components/shopping/shopping-list-window'

interface ShoppingViewClientProps {
  householdId: string
  householdName: string
  userId: string
  initialItems: any[]
  categories: any[]
  members: any[]
}

export function ShoppingViewClient({
  householdId,
  householdName,
  userId,
  initialItems,
  categories,
  members,
}: ShoppingViewClientProps) {
  const { t, locale } = useI18n()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          {t('common.shoppingList')}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'en'
            ? 'Add household items needed in real time and log them as expenses in one click.'
            : locale === 'ca'
            ? 'Afegeix articles necessaris a la llar en temps real i enregistra\'ls com a despeses en un sol clic.'
            : 'Añade artículos que hacen falta en el hogar en tiempo real y regístralos como gastos con un solo clic.'}
        </p>
      </div>

      <ShoppingListWindow
        householdId={householdId}
        householdName={householdName}
        userId={userId}
        initialItems={initialItems}
        categories={categories}
        members={members}
      />
    </div>
  )
}
