'use client'

import React, { useState, useEffect } from 'react'
import {
  HouseholdChallenge,
  fetchHouseholdChallenges,
  claimHouseholdChallengeReward,
} from '@/lib/game/game-service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Coins, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react'

interface HouseholdChallengesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  userId: string
  locale?: string
}

export function HouseholdChallengesModal({
  open,
  onOpenChange,
  householdId,
  userId,
  locale = 'es',
}: HouseholdChallengesModalProps) {
  const isCatalan = locale === 'ca'
  const isEnglish = locale === 'en'

  const [challenges, setChallenges] = useState<HouseholdChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  const loadChallenges = async () => {
    if (!householdId || !userId) return
    setLoading(true)
    try {
      const data = await fetchHouseholdChallenges(householdId, userId)
      setChallenges(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadChallenges()
    }
  }, [open, householdId, userId])

  const handleClaim = async (challenge: HouseholdChallenge) => {
    if (challenge.isClaimed || !challenge.isCompleted) return

    setClaimingId(challenge.id)
    try {
      const success = await claimHouseholdChallengeReward(
        householdId,
        challenge.id,
        userId,
        challenge.rewardCoins
      )

      if (success) {
        setChallenges((prev) =>
          prev.map((c) => (c.id === challenge.id ? { ...c, isClaimed: true } : c))
        )
      }
    } finally {
      setClaimingId(null)
    }
  }

  const getLangText = (titleObj: { es: string; ca: string; en: string }) => {
    if (isCatalan) return titleObj.ca
    if (isEnglish) return titleObj.en
    return titleObj.es
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-md p-4 sm:p-6 rounded-3xl bg-card border-border shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-1 text-left border-b border-border/50 pb-3 sm:pb-4 pr-6 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0 animate-bounce" />
              <span>
                {isCatalan
                  ? 'Reptes Familiars d\'Estalvi'
                  : isEnglish
                  ? 'Household Saving Challenges'
                  : 'Retos Familiares de Ahorro'}
              </span>
            </DialogTitle>

            <Button
              variant="ghost"
              size="icon"
              onClick={loadChallenges}
              disabled={loading}
              className="h-8 w-8 rounded-full"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <DialogDescription className="text-xs text-muted-foreground">
            {isCatalan
              ? 'Col·laboreu en família per complir objectius comunitaris i aconseguir DotzCoins per a les vostres meves.'
              : isEnglish
              ? 'Work together as a family to complete shared goals and earn DotzCoins for your pets.'
              : 'Colaborad en familia para cumplir objetivos comunitarios y ganar DotzCoins para vuestras mascotas.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-3.5 py-3 sm:py-4 overflow-y-auto pr-1 flex-1 min-h-0">
          {loading ? (
            <div className="space-y-3 animate-pulse py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted/30 rounded-2xl border border-border/40" />
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <p className="text-xs text-center text-muted-foreground py-6">
              {isCatalan
                ? 'No s\'han trobat reptes actualment.'
                : 'No se encontraron retos actualmente.'}
            </p>
          ) : (
            challenges.map((challenge) => {
              const percent = Math.min(
                100,
                Math.round((challenge.currentValue / challenge.targetValue) * 100)
              )

              return (
                <div
                  key={challenge.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                    challenge.isClaimed
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : challenge.isCompleted
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-xs'
                      : 'bg-muted/30 border-border/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl shrink-0 select-none">{challenge.icon}</span>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-sm font-extrabold text-foreground truncate">
                          {getLangText(challenge.title)}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {getLangText(challenge.description)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-0.5">
                      {challenge.isClaimed ? (
                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold gap-1 text-[11px] px-2.5 py-1 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isCatalan ? 'Reclamat' : 'Reclamado'}</span>
                        </Badge>
                      ) : challenge.isCompleted ? (
                        <Button
                          size="sm"
                          disabled={claimingId === challenge.id}
                          onClick={() => handleClaim(challenge)}
                          className="rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md animate-bounce gap-1.5"
                        >
                          <Coins className="w-3.5 h-3.5 fill-slate-950" />
                          <span>
                            {claimingId === challenge.id
                              ? '...'
                              : `+${challenge.rewardCoins}`}
                          </span>
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-muted-foreground">
                          {challenge.currentValue}/{challenge.targetValue}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1 px-1.5 py-0">
                          <Coins className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          +{challenge.rewardCoins} DotzCoins
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-bold border-indigo-500/30 text-indigo-500 bg-indigo-500/10 gap-1 px-1.5 py-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          +{challenge.rewardXp} XP
                        </Badge>
                      </div>
                      <span>{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-2 rounded-full bg-muted/60" />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
