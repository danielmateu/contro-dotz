'use client'

import React from 'react'
import {
  GAME_QUESTS,
  UserGameState,
  saveUserGameState,
} from '@/lib/game/game-service'
import { PetStats } from '@/lib/game/fin-pet-engine'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Coins, Trophy, Sparkles } from 'lucide-react'

interface TamagotchiQuestsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameState: UserGameState
  onStateChange: (newState: UserGameState) => void
  petStats: PetStats
  locale?: string
}

export function TamagotchiQuestsModal({
  open,
  onOpenChange,
  gameState,
  onStateChange,
  petStats,
  locale = 'es',
}: TamagotchiQuestsModalProps) {
  const isCatalan = locale === 'ca'

  const handleClaim = async (questId: string, coinsReward: number) => {
    if (gameState.completedQuests.includes(questId)) return

    const newCompleted = [...gameState.completedQuests, questId]
    const newCoins = gameState.coins + coinsReward

    const newState: UserGameState = {
      ...gameState,
      coins: newCoins,
      completedQuests: newCompleted,
    }

    onStateChange(newState)
    await saveUserGameState(newState)
  }

  // Comprobar si se cumple la condición de la misión
  const isQuestUnlocked = (conditionType: string) => {
    switch (conditionType) {
      case 'budget_ok':
        return petStats.health >= 70
      case 'has_budget':
        return petStats.spentPercentage <= 100
      case 'streak':
        return petStats.streakDays >= 3
      default:
        return true
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-card border-border shadow-2xl">
        <DialogHeader className="space-y-1 text-left border-b border-border/50 pb-4">
          <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>{isCatalan ? 'Missions i Assoliments' : 'Misiones y Logros'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isCatalan
              ? 'Completa reptes financers reals per guanyar DotzCoins i pujar de nivell.'
              : 'Completa retos financieros reales para ganar DotzCoins y subir de nivel.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-4 max-h-[360px] overflow-y-auto pr-1">
          {GAME_QUESTS.map((quest) => {
            const isCompleted = gameState.completedQuests.includes(quest.id)
            const canClaim = !isCompleted && isQuestUnlocked(quest.conditionType)

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : canClaim
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                    : 'bg-muted/40 border-border/60 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0 select-none">{quest.icon}</span>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-foreground truncate">
                      {isCatalan ? quest.title.ca : quest.title.es}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {isCatalan ? quest.description.ca : quest.description.es}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1 px-2 py-0.5">
                        <Coins className="w-3 h-3 fill-amber-500 text-amber-500" />
                        +{quest.rewardCoins} DotzCoins
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/30 text-indigo-500 bg-indigo-500/10 gap-1 px-2 py-0.5">
                        <Sparkles className="w-3 h-3" />
                        +{quest.rewardXp} XP
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCatalan ? 'Feta' : 'Hecha'}</span>
                    </div>
                  ) : canClaim ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(quest.id, quest.rewardCoins)}
                      className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md animate-bounce"
                    >
                      {isCatalan ? 'Reclamar' : 'Reclamar'}
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-[11px] px-2.5 py-1 rounded-xl text-muted-foreground">
                      {isCatalan ? 'En curs' : 'En curso'}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
