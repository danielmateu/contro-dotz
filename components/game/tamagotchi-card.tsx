'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'
import { TamagotchiShopModal } from '@/components/game/tamagotchi-shop-modal'
import { TamagotchiQuestsModal } from '@/components/game/tamagotchi-quests-modal'
import { PetStats } from '@/lib/game/fin-pet-engine'
import {
  UserGameState,
  fetchUserGameState,
  DEFAULT_GAME_STATE,
} from '@/lib/game/game-service'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Flame,
  Heart,
  Trophy,
  PlusCircle,
  PiggyBank,
  Sparkles,
  ShoppingBag,
  Coins,
  Target,
  X,
} from 'lucide-react'

interface TamagotchiCardProps {
  stats: PetStats
  locale?: string
  variant?: 'hero' | 'compact' | 'popover'
  onClose?: () => void
}

export function TamagotchiCard({
  stats,
  locale = 'es',
  variant = 'hero',
  onClose,
}: TamagotchiCardProps) {
  const isCatalan = locale === 'ca'
  const [gameState, setGameState] = useState<UserGameState>(DEFAULT_GAME_STATE)
  const [shopOpen, setShopOpen] = useState(false)
  const [questsOpen, setQuestsOpen] = useState(false)

  useEffect(() => {
    async function loadState() {
      const state = await fetchUserGameState()
      setGameState(state)
    }
    loadState()
  }, [])

  // Color de la barra de salud según el valor
  const getHealthColor = (health: number) => {
    if (health >= 85) return 'bg-emerald-500'
    if (health >= 65) return 'bg-indigo-500'
    if (health >= 45) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  return (
    <>
      <Card className="border-border/80 bg-card/95 backdrop-blur-md text-card-foreground rounded-3xl overflow-hidden shadow-xl transition-all duration-300">
        {/* Header con gradiente decorativo */}
        <CardHeader className="relative border-b border-border/40 pb-3 sm:pb-4 pt-4 sm:pt-5 px-4 sm:px-6 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pr-6 sm:pr-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge variant="outline" className="bg-background/80 border-primary/30 text-primary font-bold px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs rounded-xl shadow-2xs">
                <Trophy className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 text-amber-500" />
                {isCatalan ? `Nv. ${stats.level}` : `Nv. ${stats.level}`}
              </Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-semibold text-[11px] sm:text-xs rounded-xl px-2 sm:px-2.5">
                {stats.moodTitle}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Botón de Monedas & Tienda */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShopOpen(true)}
                className="h-7 rounded-xl bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-[11px] sm:text-xs px-2 sm:px-2.5 gap-1 hover:bg-amber-500/20"
              >
                <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{gameState.coins}</span>
              </Button>

              {/* Racha */}
              <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 sm:px-2.5 py-1 rounded-xl">
                <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{stats.streakDays} {isCatalan ? 'd racha' : 'días racha'}</span>
              </div>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full hover:bg-muted/80 text-muted-foreground"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Sección de la Mascota y Mensaje */}
          <div className="flex flex-row items-center gap-3.5 sm:gap-5 bg-muted/40 p-3.5 sm:p-4 rounded-2xl border border-border/50">
            <div className="shrink-0">
              <TamagotchiAvatar
                mood={stats.mood}
                size={variant === 'hero' ? 'lg' : 'md'}
                equippedAccessory={gameState.equippedAccessory}
                interactive={true}
              />
            </div>

            <div className="space-y-1 sm:space-y-2 text-left flex-1 min-w-0">
              <div className="flex items-center justify-start gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                  <span>Dotzi</span>
                  <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500" />
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed italic line-clamp-3">
                "{stats.dialogue}"
              </p>
            </div>
          </div>

          {/* Barras de Estado (Salud & XP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {/* Salud Financiera */}
            <div className="space-y-1.5 bg-background/60 p-3 sm:p-3.5 rounded-2xl border border-border/40">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                  <span className="truncate">{isCatalan ? 'Salut Financera' : 'Salud Financiera'}</span>
                </span>
                <span className="font-bold text-foreground ml-1 shrink-0">{stats.health}%</span>
              </div>
              <div className="h-2 sm:h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${getHealthColor(stats.health)}`}
                  style={{ width: `${stats.health}%` }}
                />
              </div>
            </div>

            {/* Experiencia (XP) */}
            <div className="space-y-1.5 bg-background/60 p-3 sm:p-3.5 rounded-2xl border border-border/40">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                  <Trophy className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{isCatalan ? 'Experiència (XP)' : 'Experiencia (XP)'}</span>
                </span>
                <span className="font-bold text-foreground ml-1 shrink-0">{stats.xp}/100</span>
              </div>
              <div className="h-2 sm:h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 rounded-full"
                  style={{ width: `${stats.xp}%` }}
                />
              </div>
            </div>
          </div>

          {/* Acciones Rápidas (Tienda, Misiones, Gasto, Presupuesto) */}
          <div className="pt-1 sm:pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShopOpen(true)}
              className="rounded-xl font-bold gap-1 sm:gap-1.5 text-[11px] sm:text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 px-2 sm:px-3 h-8 sm:h-9"
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isCatalan ? 'Botiga 🛒' : 'Tienda 🛒'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuestsOpen(true)}
              className="rounded-xl font-bold gap-1 sm:gap-1.5 text-[11px] sm:text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 px-2 sm:px-3 h-8 sm:h-9"
            >
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isCatalan ? 'Missions 🎯' : 'Misiones 🎯'}</span>
            </Button>

            <Link href="/expenses" className="w-full">
              <Button variant="default" size="sm" className="w-full rounded-xl font-semibold gap-1 sm:gap-1.5 text-[11px] sm:text-xs shadow-xs px-2 sm:px-3 h-8 sm:h-9">
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isCatalan ? '+ Despesa' : '+ Gasto'}</span>
              </Button>
            </Link>

            <Link href="/budgets" className="w-full">
              <Button variant="outline" size="sm" className="w-full rounded-xl font-semibold gap-1 sm:gap-1.5 text-[11px] sm:text-xs border-border/80 px-2 sm:px-3 h-8 sm:h-9">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{isCatalan ? 'Pressupost' : 'Presupuesto'}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Modales de Tienda y Misiones */}
      <TamagotchiShopModal
        open={shopOpen}
        onOpenChange={setShopOpen}
        gameState={gameState}
        onStateChange={setGameState}
        locale={locale}
      />

      <TamagotchiQuestsModal
        open={questsOpen}
        onOpenChange={setQuestsOpen}
        gameState={gameState}
        onStateChange={setGameState}
        petStats={stats}
        locale={locale}
      />
    </>
  )
}
