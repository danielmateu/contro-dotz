'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  UserGameState,
  DEFAULT_GAME_STATE,
  fetchUserGameState,
  saveUserGameState,
} from '@/lib/game/game-service'

interface GameContextType {
  gameState: UserGameState
  updateGameState: (newState: UserGameState) => Promise<void>
  refreshGameState: () => Promise<void>
  registerTap: () => Promise<{ earnedCoins: boolean; bonusCoins: number; newTapCount: number }>
}

const GameContext = createContext<GameContextType>({
  gameState: DEFAULT_GAME_STATE,
  updateGameState: async () => {},
  refreshGameState: async () => {},
  registerTap: async () => ({ earnedCoins: false, bonusCoins: 0, newTapCount: 0 }),
})

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<UserGameState>(DEFAULT_GAME_STATE)

  const refreshGameState = async () => {
    const state = await fetchUserGameState()
    setGameState(state)
  }

  useEffect(() => {
    refreshGameState()
  }, [])

  const updateGameState = async (newState: UserGameState) => {
    setGameState(newState)
    await saveUserGameState(newState)
  }

  const registerTap = async () => {
    const currentTaps = gameState.tapCount || 0
    const newTapCount = currentTaps + 1

    // Cálculo de escalado progresivo de hitos de caricias:
    // Hito 1 (20 toques acumulados): +5 Coins
    // Hito 2 (50 toques acumulados, +30 más): +10 Coins
    // Hito 3 (90 toques acumulados, +40 más): +15 Coins
    // Hito 4 (140 toques acumulados, +50 más): +20 Coins...
    let milestoneTarget = 20
    let rewardLevel = 1
    let cumulative = 0

    while (cumulative + milestoneTarget < newTapCount) {
      cumulative += milestoneTarget
      rewardLevel++
      milestoneTarget = 20 + (rewardLevel - 1) * 10
    }

    const isExactMilestone = cumulative + milestoneTarget === newTapCount
    const bonusCoins = isExactMilestone ? 5 + (rewardLevel - 1) * 5 : 0
    const earnedCoins = isExactMilestone

    const newCoins = gameState.coins + bonusCoins

    const newState: UserGameState = {
      ...gameState,
      tapCount: newTapCount,
      coins: newCoins,
    }

    setGameState(newState)
    await saveUserGameState(newState)

    return { earnedCoins, bonusCoins, newTapCount }
  }

  return (
    <GameContext.Provider value={{ gameState, updateGameState, refreshGameState, registerTap }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameState() {
  return useContext(GameContext)
}
