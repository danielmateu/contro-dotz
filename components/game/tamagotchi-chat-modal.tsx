'use client'

import React, { useState, useRef, useEffect } from 'react'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'
import { PetStats } from '@/lib/game/fin-pet-engine'
import { UserGameState } from '@/lib/game/game-service'
import { chatWithDotziAction } from '@/app/actions/gemini'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles } from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'dotzi'
  text: string
  timestamp: Date
}

interface TamagotchiChatModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  petStats: PetStats
  gameState: UserGameState
  householdId?: string
  locale?: string
}

export function TamagotchiChatModal({
  open,
  onOpenChange,
  petStats,
  gameState,
  householdId = '',
  locale = 'es',
}: TamagotchiChatModalProps) {
  const isCatalan = locale === 'ca'
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Inicializar conversación con saludo dinámico de Dotzi
  useEffect(() => {
    if (open && messages.length === 0) {
      const initialGreeting = isCatalan
        ? `¡Hola! Soc en **Dotzi**, el teu Tamagotchi financer. 🌱\n\nActualment la nostra salut financera està al **${petStats.health}%** (${petStats.moodTitle}). De què et ve de gust parlar avui?`
        : `¡Hola! Soy **Dotzi**, tu Tamagotchi financiero. 🌱\n\nActualmente nuestra salud financiera está al **${petStats.health}%** (${petStats.moodTitle}). ¿De qué te apetece hablar hoy?`

      setMessages([
        {
          id: '1',
          sender: 'dotzi',
          text: initialGreeting,
          timestamp: new Date(),
        },
      ])
    }
  }, [open, isCatalan, petStats, messages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || loading) return

    const now = new Date()
    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(now.getTime())

    const userMessage: Message = {
      id: msgId,
      sender: 'user',
      text: query.trim(),
      timestamp: now,
    }

    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      const res = await chatWithDotziAction({
        householdId,
        userPrompt: query.trim(),
        petStats: {
          health: petStats.health,
          moodTitle: petStats.moodTitle,
          level: petStats.level,
          streakDays: petStats.streakDays,
          spentPercentage: petStats.spentPercentage,
        },
        gameState: {
          coins: gameState.coins,
          equippedAccessory: gameState.equippedAccessory,
        },
        locale,
      })

      const replyNow = new Date()
      const replyId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(replyNow.getTime() + 1)

      if (res.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: replyId,
            sender: 'dotzi',
            text: isCatalan
              ? 'Uf... he tingut un petit tall de connexió! Torna a provar en un moment.'
              : 'Uf... ¡he tenido un pequeño despiste! Prueba a preguntarme otra vez.',
            timestamp: replyNow,
          },
        ])
      } else if (res.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: replyId,
            sender: 'dotzi',
            text: res.reply!,
            timestamp: replyNow,
          },
        ])
      }
    } catch {
      const errNow = new Date()
      const errId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(errNow.getTime() + 2)

      setMessages((prev) => [
        ...prev,
        {
          id: errId,
          sender: 'dotzi',
          text: '¡Ups! No he podido conectarme en este instante.',
          timestamp: errNow,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Fichas de preguntas rápidas
  const quickPrompts = isCatalan
    ? [
      'Com anem de pressupost aquest mes?',
      'Em puc donar un capritx el cap de setmana?',
      'Com aconsegueixo més DotzCoins?',
      'Brindem per l’estalvi del llar!',
    ]
    : [
      '¿Cómo vamos de presupuesto este mes?',
      '¿Puedo darme un capricho el fin de semana?',
      '¿Cómo consigo más DotzCoins?',
      '¡Brindemos por el ahorro del hogar!',
    ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[calc(100vw-1.5rem)] p-0 rounded-3xl bg-card border-border shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-145 max-h-155">
        {/* Cabecera del Chat con Dotzi */}
        <DialogHeader className="p-3.5 sm:p-4 border-b border-border/50 bg-linear-to-r from-indigo-500/10 via-violet-500/10 to-emerald-500/10 flex items-center justify-between shrink-0 pr-10">
          <div className="flex items-center gap-3">
            <TamagotchiAvatar
              mood={petStats.mood}
              size="sm"
              equippedAccessory={gameState.equippedAccessory}
              skinColor={gameState.skinColor}
              hairstyle={gameState.hairstyle}
              interactive={false}
            />
            <div className="flex flex-col text-left">
              <DialogTitle className="text-base font-extrabold flex items-center gap-1.5">
                <span>Dotzi AI</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </DialogTitle>
              <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {petStats.moodTitle} • Nv. {petStats.level}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Hilo de Mensajes */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {msg.sender === 'dotzi' && (
                <div className="shrink-0 mb-1">
                  <TamagotchiAvatar
                    mood={petStats.mood}
                    size="sm"
                    equippedAccessory={gameState.equippedAccessory}
                    skinColor={gameState.skinColor}
                    hairstyle={gameState.hairstyle}
                    interactive={false}
                  />
                </div>
              )}

              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground font-medium rounded-br-none'
                  : 'bg-muted/70 text-foreground border border-border/50 rounded-bl-none'
                  }`}
              >
                {msg.text.split('\n').map((line, idx) => (
                  <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                    {line.includes('**') ? (
                      line.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i} className="font-extrabold text-amber-500">{part}</strong> : part
                      )
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* Indicador de carga cuando Dotzi está pensando */}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
              <TamagotchiAvatar
                mood={petStats.mood}
                size="sm"
                equippedAccessory={gameState.equippedAccessory}
                skinColor={gameState.skinColor}
                hairstyle={gameState.hairstyle}
                interactive={false}
              />
              <div className="bg-muted p-2.5 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                <span className="text-[11px] font-semibold">{isCatalan ? 'Dotzi pensant...' : 'Dotzi pensando...'}</span>
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fichas de preguntas rápidas (Quick Prompts) - Carrusel horizontal suave */}
        <div className="p-2.5 sm:p-3 border-t border-border/40 bg-muted/20 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              type="button"
              disabled={loading}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap shrink-0 text-[11px] sm:text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border/60 px-3 py-1.5 rounded-xl transition-all active:scale-95 text-left disabled:opacity-50 shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Barra de entrada de texto */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="p-3 border-t border-border/50 bg-background flex items-center gap-2 shrink-0"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isCatalan ? 'Escriu un missatge per a en Dotzi...' : 'Escribe tu mensaje para Dotzi...'}
            disabled={loading}
            className="rounded-xl text-xs sm:text-sm bg-muted/30 border-border/70 focus-visible:ring-1 h-9 sm:h-10"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            className="rounded-xl shrink-0 h-9 w-9 sm:h-10 sm:w-10 bg-primary text-primary-foreground shadow-xs"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )

}
