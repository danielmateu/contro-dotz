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
}

const GameContext = createContext<GameContextType>({
  gameState: DEFAULT_GAME_STATE,
  updateGameState: async () => {},
  refreshGameState: async () => {},
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

  return (
    <GameContext.Provider value={{ gameState, updateGameState, refreshGameState }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameState() {
  return useContext(GameContext)
}
