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
        <CardHeader className="relative border-b border-border/40 pb-4 pt-5 px-6 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background/80 border-primary/30 text-primary font-bold px-2.5 py-0.5 text-xs rounded-xl shadow-2xs">
                <Trophy className="w-3.5 h-3.5 mr-1 text-amber-500" />
                {isCatalan ? `Nv. ${stats.level}` : `Nv. ${stats.level}`}
              </Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 font-semibold text-xs rounded-xl">
                {stats.moodTitle}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón de Monedas & Tienda */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShopOpen(true)}
                className="h-7 rounded-xl bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs px-2.5 gap-1 hover:bg-amber-500/20"
              >
                <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{gameState.coins}</span>
              </Button>

              {/* Racha */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                <span>{stats.streakDays} {isCatalan ? 'd racha' : 'días racha'}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 ">
          {/* Sección de la Mascota y Mensaje */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-muted/40 p-4 rounded-2xl border border-border/50">
            <div className="shrink-0">
              <TamagotchiAvatar
                mood={stats.mood}
                size={variant === 'hero' ? 'lg' : 'md'}
                equippedAccessory={gameState.equippedAccessory}
                interactive={true}
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                  <span>Dotzi</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                "{stats.dialogue}"
              </p>
            </div>
          </div>

          {/* Barras de Estado (Salud & XP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Salud Financiera */}
            <div className="space-y-1.5 bg-background/60 p-3.5 rounded-2xl border border-border/40">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  {isCatalan ? 'Salut Financera' : 'Salud Financiera'}
                </span>
                <span className="font-bold text-foreground">{stats.health}%</span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${getHealthColor(stats.health)}`}
                  style={{ width: `${stats.health}%` }}
                />
              </div>
            </div>

            {/* Experiencia (XP) */}
            <div className="space-y-1.5 bg-background/60 p-3.5 rounded-2xl border border-border/40">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Trophy className="w-3.5 h-3.5 text-indigo-500" />
                  {isCatalan ? 'Experiència (XP)' : 'Experiencia (XP)'}
                </span>
                <span className="font-bold text-foreground">{stats.xp} / 100 XP</span>
              </div>
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 rounded-full"
                  style={{ width: `${stats.xp}%` }}
                />
              </div>
            </div>
          </div>

          {/* Acciones Rápidas (Tienda, Misiones, Gasto, Presupuesto) */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShopOpen(true)}
              className="rounded-xl font-bold gap-1.5 text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isCatalan ? 'Botiga 🛒' : 'Tienda 🛒'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuestsOpen(true)}
              className="rounded-xl font-bold gap-1.5 text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isCatalan ? 'Missions 🎯' : 'Misiones 🎯'}</span>
            </Button>

            <Link href="/expenses" className="w-full">
              <Button variant="default" size="sm" className="w-full rounded-xl font-semibold gap-1.5 text-xs shadow-xs">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isCatalan ? '+ Despesa' : '+ Gasto'}</span>
              </Button>
            </Link>

            <Link href="/budgets" className="w-full">
              <Button variant="outline" size="sm" className="w-full rounded-xl font-semibold gap-1.5 text-xs border-border/80">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isCatalan ? 'Pressupost' : 'Presupuesto'}</span>
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
