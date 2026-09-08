'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'
import { createClient } from '@/lib/supabase/client'
import {
  HouseholdDotziMember,
  fetchHouseholdDotzis,
  sendHouseholdInteraction,
} from '@/lib/game/game-service'
import { motion, AnimatePresence } from 'motion/react'
import { Heart, Sparkles, Home, Hand, Cookie, ShowerHead, RefreshCw } from 'lucide-react'

interface HouseholdDotziRoomProps {
  householdId: string
  currentUserId: string
  locale?: string
}

export function HouseholdDotziRoom({
  householdId,
  currentUserId,
  locale = 'es',
}: HouseholdDotziRoomProps) {
  const isCatalan = locale === 'ca'
  const [dotziMembers, setDotziMembers] = useState<HouseholdDotziMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<HouseholdDotziMember | null>(null)
  const [interactionPopup, setInteractionPopup] = useState<{ id: number; targetUserId: string; text: string }[]>([])
  const [animatingBathUser, setAnimatingBathUser] = useState<string | null>(null)
  const [activeReactions, setActiveReactions] = useState<Record<string, { text: string; actionType: string }>>({})

  const loadHouseholdDotzis = async (showLoader = false) => {
    if (showLoader || dotziMembers.length === 0) {
      setIsLoading(true)
    }
    try {
      const data = await fetchHouseholdDotzis(householdId)
      setDotziMembers(data)
    } finally {
      setIsLoading(false)
    }
  }

  const triggerVisualReaction = (
    targetUserId: string,
    actionType: 'pet' | 'treat' | 'greet' | 'wash',
    isSelfSender: boolean = false
  ) => {
    const actionText =
      actionType === 'treat'
        ? isSelfSender ? '¡Golosina enviada! (+15 pts)' : '¡Golosina recibida! (+15 pts)'
        : actionType === 'pet'
          ? isSelfSender ? '¡Caricia enviada! (+10 pts)' : '¡Caricia recibida! (+10 pts)'
          : actionType === 'wash'
            ? '¡Dotzi bañado con éxito!'
            : '¡Saludo recibido!'

    const reactionDialogue =
      actionType === 'treat'
        ? (isCatalan ? '¡Nyam! ¡Gràcies per la llaminadura! 🍬 (+15 pts)' : '¡Mmm! ¡Gracias por la golosina! 🍬 (+15 pts)')
        : actionType === 'pet'
          ? (isCatalan ? '¡Aww! ¡Quina carícia més dolça! ❤️ (+10 pts)' : '¡Aww! ¡Qué caricia más suave! ❤️ (+10 pts)')
          : actionType === 'wash'
            ? (isCatalan ? '¡Quina frescor! ¡Estic ben net! 🧼' : '¡Qué fresquit@ y limpi@ he quedado! 🧼')
            : (isCatalan ? '¡Hola amic! ¡Quin goig veure\'t! ✋' : '¡Hola amigo! ¡Qué alegría verte por aquí! ✋')

    if (actionType === 'wash') {
      setAnimatingBathUser(targetUserId)
      setTimeout(() => setAnimatingBathUser(null), 2000)
    }

    setInteractionPopup((prev) => [
      ...prev.slice(-4),
      { id: Date.now(), targetUserId, text: actionText },
    ])

    setActiveReactions((prev) => ({
      ...prev,
      [targetUserId]: { text: reactionDialogue, actionType },
    }))

    setTimeout(() => {
      setActiveReactions((prev) => {
        const next = { ...prev }
        delete next[targetUserId]
        return next
      })
    }, 4500)
  }

  // Carga inicial y suscripción a Supabase Realtime para interacciones y estado de juego
  useEffect(() => {
    if (!householdId) return

    loadHouseholdDotzis(dotziMembers.length === 0)

    const supabase = createClient()
    const channel = supabase
      .channel(`household_room_${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dotzi_interactions',
        },
        (payload) => {
          const { sender_id, receiver_id, interaction_type } = payload.new
          // Si el evento viene de otro usuario, activar la reacción visual
          if (sender_id !== currentUserId) {
            triggerVisualReaction(receiver_id, interaction_type as any, false)
          }
          loadHouseholdDotzis(false)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_game_state',
        },
        () => {
          loadHouseholdDotzis(false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId])

  const handleInteraction = async (
    targetUserId: string,
    actionType: 'pet' | 'treat' | 'greet' | 'wash'
  ) => {
    const result = await sendHouseholdInteraction(targetUserId, actionType)

    if (result.success) {
      triggerVisualReaction(targetUserId, actionType, true)

      // Actualizar visualmente los puntos de amistad en estado local
      setDotziMembers((prev) =>
        prev.map((m) => {
          if (m.userId === targetUserId) {
            return {
              ...m,
              gameState: {
                ...m.gameState,
                friendshipPoints: (m.gameState.friendshipPoints || 0) + result.friendshipGained,
                cleanliness: actionType === 'wash' ? 100 : m.gameState.cleanliness,
              },
            }
          }
          return m
        })
      )
    }
  }

  const getGreetingDialogue = (personality: string, ownerName: string, petName: string) => {
    switch (personality) {
      case 'foodie':
        return isCatalan
          ? `¡Hola! Soc en ${petName}. M'encanta estar a la cuina de la llar de ${ownerName}!`
          : `¡Hola! Soy ${petName}. ¡Me encanta compartir golosinas en el hogar de ${ownerName}!`
      case 'adventurer':
        return isCatalan
          ? `¡Misió complerta! En ${petName} i ${ownerName} estem a punt per estalviar!`
          : `¡Misión cumplida! ¡${petName} y ${ownerName} estamos listos para nuevas metas!`
      case 'zen':
        return isCatalan
          ? `Pau i serenitat a la casa de ${ownerName}.`
          : `Paz y armonía presupuestaria en el hogar de ${ownerName}.`
      case 'party':
        return isCatalan
          ? `¡Festa total a la sala de ${ownerName}!`
          : `¡Fiesta total en la sala con ${ownerName}!`
      case 'saver':
      default:
        return isCatalan
          ? `¡Hola! Soc en ${petName}, guardant cada moneda per a ${ownerName}!`
          : `¡Hola! Soy ${petName}, protegiendo la economía de ${ownerName}.`
    }
  }

  return (
    <Card className="border-border/80 bg-linear-to-b from-card/90 to-background/95 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
      <CardHeader className="border-b border-border/40 pb-4 pt-5 px-6 bg-linear-to-r from-emerald-500/10 via-amber-500/5 to-indigo-500/10 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold font-heading flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-500" />
            <span>{isCatalan ? 'El Hogar dels Dotzis' : 'El Hogar de los Dotzis'}</span>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </CardTitle>
          <CardDescription className="text-xs">
            {isCatalan
              ? 'Espai on conviuen les mascotes de tota la família. Fes clic per interactuar i fer amics!'
              : 'Espacio donde conviven las mascotas de toda la familia. ¡Haz clic para interactuar y enviar cariño!'}
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadHouseholdDotzis(true)}
          disabled={isLoading}
          className="h-8 rounded-xl text-xs gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isCatalan ? 'Actualitzar' : 'Refrescar'}</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Escenario de convivencia (Habitación acogedora) */}
        <div className="relative min-h-[260px] sm:min-h-[300px] rounded-3xl bg-linear-to-b from-violet-950/20 via-indigo-900/10 to-amber-500/10 border border-border/60 p-4 sm:p-6 flex flex-col justify-end overflow-hidden shadow-inner">
          {/* Fondo decorativo de alfombra y luz de hogar */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-amber-500/15 via-emerald-500/10 to-transparent rounded-b-3xl" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-4/5 h-16 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs text-muted-foreground animate-pulse">
                {isCatalan ? 'Carregant les mascotes de la llar...' : 'Cargando las mascotas del hogar...'}
              </p>
            </div>
          ) : dotziMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">
                {isCatalan ? 'Encara no hi ha mascotes a la llar.' : 'Aún no hay otras mascotas en el hogar.'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isCatalan
                  ? 'Convida als teus familiars per veure convivir els seus Dotzis aquí!'
                  : '¡Invita a tus familiares para ver convivir a sus Dotzis aquí!'}
              </p>
            </div>
          ) : (
            <div className="relative z-10 flex flex-wrap items-end justify-around gap-6 py-4">
              {dotziMembers.map((member) => {
                const isSelf = member.userId === currentUserId
                const popups = interactionPopup.filter((p) => p.targetUserId === member.userId)
                const isBathingThisMember = animatingBathUser === member.userId

                return (
                  <div
                    key={member.userId}
                    className="relative flex flex-col items-center group cursor-pointer"
                    onClick={() => setSelectedMember(member)}
                  >
                    {/* Popups flotantes de interacción (flotan por encima del bocadillo) */}
                    <AnimatePresence>
                      {popups.map((p) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 1, y: 0, scale: 0.8 }}
                          animate={{ opacity: 0, y: -50, scale: 1.1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.6, ease: 'easeOut' }}
                          className="absolute -top-24 sm:-top-28 z-40 pointer-events-none whitespace-nowrap bg-linear-to-r from-rose-500 via-amber-500 to-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-xl border border-white/80"
                        >
                          {p.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Burbuja de diálogo de convivencia con reacción dinámica */}
                    <motion.div
                      key={activeReactions[member.userId] ? `reaction-${activeReactions[member.userId].text}` : 'default'}
                      initial={{ scale: activeReactions[member.userId] ? 0.9 : 1, opacity: 0.95 }}
                      animate={{ y: [0, -4, 0], scale: 1 }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      className={`mb-3 max-w-[200px] sm:max-w-[250px] w-auto border shadow-lg rounded-2xl p-2.5 sm:p-3 text-xs font-semibold text-center backdrop-blur-md relative z-20 transition-all duration-300 ${activeReactions[member.userId]
                        ? 'bg-linear-to-r from-emerald-500/20 via-amber-500/20 to-rose-500/20 border-amber-500/60 text-foreground ring-2 ring-amber-500/40 shadow-amber-500/10'
                        : 'bg-card/95 text-card-foreground border-border/80'
                        }`}
                    >
                      <span className="leading-snug block whitespace-normal break-words">
                        {activeReactions[member.userId]
                          ? activeReactions[member.userId].text
                          : getGreetingDialogue(member.gameState.personality, member.displayName, member.gameState.petName)}
                      </span>
                      <div
                        className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${activeReactions[member.userId] ? 'bg-amber-500/20 border-amber-500/60' : 'bg-card border-border/80'
                          }`}
                      />
                    </motion.div>

                    {/* Avatar de Dotzi de la mascota */}
                    <div className="relative transition-transform duration-300 group-hover:scale-110">
                      <TamagotchiAvatar
                        size="lg"
                        skinColor={member.gameState.skinColor}
                        hairstyle={member.gameState.hairstyle}
                        equippedAccessory={member.gameState.equippedAccessory}
                        weight={member.gameState.weight}
                        cleanliness={member.gameState.cleanliness}
                        isBathing={isBathingThisMember}
                        interactive={false}
                      />
                    </div>

                    {/* Ficha identificativa de la mascota y dueño */}
                    <div className="mt-2 flex flex-col items-center space-y-0.5">
                      <div className="flex items-center gap-1.5 bg-background/90 px-2.5 py-1 rounded-xl border border-border/60 shadow-xs">
                        <Avatar className="w-4 h-4">
                          {member.avatarUrl ? <AvatarImage src={member.avatarUrl} /> : null}
                          <AvatarFallback className="text-[9px] font-bold">
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-foreground">
                          {member.gameState.petName}
                        </span>
                        {isSelf && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20">
                            Tú
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>{member.gameState.friendshipPoints || 0} pts</span>
                      </div>
                    </div>

                    {/* Panel de Botones de Interacción al pasar el ratón o hacer clic */}
                    {!isSelf && (
                      <div className="mt-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInteraction(member.userId, 'pet')
                          }}
                          title="Cariciar 🖐️"
                          className="h-7 w-7 rounded-full bg-rose-500/10 text-rose-600 border-rose-500/30 hover:bg-rose-500/20"
                        >
                          <Hand className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInteraction(member.userId, 'treat')
                          }}
                          title="Dar Golosina 🍬"
                          className="h-7 w-7 rounded-full bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                        >
                          <Cookie className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInteraction(member.userId, 'wash')
                          }}
                          title="Bañar 🧼"
                          className="h-7 w-7 rounded-full bg-cyan-500/10 text-cyan-600 border-cyan-500/30 hover:bg-cyan-500/20"
                        >
                          <ShowerHead className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
