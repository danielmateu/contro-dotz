'use client'

import React, { useState, useRef, useEffect } from 'react'
import { TamagotchiAvatar } from '@/components/game/tamagotchi-avatar'
import { PetStats } from '@/lib/game/fin-pet-engine'
import { UserGameState } from '@/lib/game/game-service'
import {
  chatWithDotziAction,
  getDotziChatHistoryAction,
  clearDotziChatHistoryAction,
} from '@/app/actions/gemini'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '@/components/ui/message-scroller'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MessageItem {
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
  locale: propLocale,
}: TamagotchiChatModalProps) {
  const { t, locale: contextLocale } = useI18n()
  const activeLocale = propLocale || contextLocale || 'es'
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cargar historial de chat desde Supabase al abrir la modal
  useEffect(() => {
    if (!open) return

    let isMounted = true
    async function loadHistory() {
      setLoadingHistory(true)
      try {
        const res = await getDotziChatHistoryAction()
        if (!isMounted) return

        if (res.messages && res.messages.length > 0) {
          const loaded = res.messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: new Date(m.timestamp),
          }))
          setMessages(loaded)
        } else {
          // Si no hay mensajes previos en BD, inicializar con saludo dinámico
          const initialGreeting = t('tamagotchiChat.initialGreeting', {
            health: petStats.health,
            moodTitle: petStats.moodTitle,
          })
          setMessages([
            {
              id: 'initial-greeting',
              sender: 'dotzi',
              text: initialGreeting,
              timestamp: new Date(),
            },
          ])
        }
      } catch (err) {
        console.error('Error loading Dotzi chat history:', err)
      } finally {
        if (isMounted) setLoadingHistory(false)
      }
    }

    loadHistory()
    return () => {
      isMounted = false
    }
  }, [open, petStats.health, petStats.moodTitle, t])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, loadingHistory])

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim() || loading || loadingHistory) return

    const now = new Date()
    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(now.getTime())

    const userMessage: MessageItem = {
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
        locale: activeLocale,
      })

      const replyNow = new Date()
      const replyId = res.replyMessageId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(replyNow.getTime() + 1))

      if (res.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: replyId,
            sender: 'dotzi',
            text: t('tamagotchiChat.connectionError'),
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
          text: t('tamagotchiChat.networkError'),
          timestamp: errNow,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    setClearing(true)
    try {
      await clearDotziChatHistoryAction()
      const initialGreeting = t('tamagotchiChat.initialGreeting', {
        health: petStats.health,
        moodTitle: petStats.moodTitle,
      })
      setMessages([
        {
          id: 'initial-greeting',
          sender: 'dotzi',
          text: initialGreeting,
          timestamp: new Date(),
        },
      ])
      setShowConfirmClear(false)
    } catch (err) {
      console.error('Error clearing history:', err)
    } finally {
      setClearing(false)
    }
  }

  // Accesos directos y sugerencias estilizadas idénticas al Chat Familiar
  const promptSnippets = [
    {
      text: t('tamagotchiChat.quickPrompt1'),
      label: '+ Presupuesto',
      colorClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    {
      text: t('tamagotchiChat.quickPrompt2'),
      label: '+ Capricho Finde',
      colorClass: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    },
    {
      text: t('tamagotchiChat.quickPrompt3'),
      label: '+ Conseguir Coins',
      colorClass: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    {
      text: t('tamagotchiChat.quickPrompt4'),
      label: '+ Brindis Ahorro',
      colorClass: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
    },
    {
      text: '¿Cómo estás Dotzi? ¿Cómo van las huchas de ahorro y la racha?',
      label: 'Estado Dotzi',
      colorClass: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30',
    },
    {
      text: 'Dame un consejo financiero para mejorar la racha este mes',
      label: 'Consejo Ahorro',
      colorClass: 'bg-muted/60 hover:bg-muted dark:bg-slate-900/60 border-border/40 text-foreground',
    },
    {
      text: '¿Cuál es nuestra categoría de mayor gasto este mes?',
      label: 'Top Categorías',
      colorClass: 'bg-muted/60 hover:bg-muted dark:bg-slate-900/60 border-border/40 text-foreground',
    },
    {
      text: 'Hazme un resumen rápido del progreso de ahorro esta semana',
      label: 'Resumen Semanal',
      colorClass: 'bg-muted/60 hover:bg-muted dark:bg-slate-900/60 border-border/40 text-foreground',
    },
  ]

  const dateLocale = activeLocale === 'en' ? 'en-US' : activeLocale === 'ca' ? 'ca-ES' : 'es-ES'
  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

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
                <span>{t('tamagotchiChat.title')}</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </DialogTitle>
              <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {petStats.moodTitle} • {t('tamagotchi.level', { level: petStats.level })}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowConfirmClear(true)}
            title={t('tamagotchiChat.clearHistory')}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Modal de confirmación para borrar historial */}
        {showConfirmClear && (
          <div className="p-3.5 sm:p-4 bg-destructive/10 border-b border-destructive/20 text-destructive flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col">
              <span className="font-bold">{t('tamagotchiChat.clearHistoryConfirmTitle')}</span>
              <span className="text-[11px] opacity-90">{t('tamagotchiChat.clearHistoryConfirmDesc')}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmClear(false)}
                disabled={clearing}
                className="h-7 text-xs rounded-xl"
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearHistory}
                disabled={clearing}
                className="h-7 text-xs rounded-xl gap-1"
              >
                {clearing && <Loader2 className="w-3 h-3 animate-spin" />}
                {t('common.delete')}
              </Button>
            </div>
          </div>
        )}

        {/* Hilo de Mensajes con componentes Shadcn MessageScroller & Bubble */}
        <MessageScroller className="flex-1 min-h-0">
          <MessageScrollerViewport className="p-3.5 sm:p-4 space-y-4">
            <MessageScrollerContent className="gap-4">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2 py-12 text-muted-foreground my-auto">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-semibold">{t('tamagotchiChat.loadingHistory')}</span>
                </div>
              ) : (
                <MessageGroup className="gap-3.5">
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user'
                    return (
                      <MessageScrollerItem key={msg.id}>
                        <Message align={isUser ? 'end' : 'start'} className="group/msg">
                          {!isUser && (
                            <MessageAvatar>
                              <TamagotchiAvatar
                                mood={petStats.mood}
                                size="sm"
                                equippedAccessory={gameState.equippedAccessory}
                                skinColor={gameState.skinColor}
                                hairstyle={gameState.hairstyle}
                                interactive={false}
                              />
                            </MessageAvatar>
                          )}

                          <MessageContent>
                            <MessageHeader className={isUser ? 'justify-end' : ''}>
                              <span className="text-[10px] text-muted-foreground/80 font-normal">
                                {formatTime(msg.timestamp)}
                              </span>
                            </MessageHeader>

                            <Bubble
                              variant={isUser ? 'default' : 'tinted'}
                              align={isUser ? 'end' : 'start'}
                            >
                              <BubbleContent className="text-xs sm:text-sm">
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
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    )
                  })}
                </MessageGroup>
              )}

              {/* Indicador de carga cuando Dotzi está pensando */}
              {loading && (
                <MessageScrollerItem>
                  <Message align="start">
                    <MessageAvatar>
                      <TamagotchiAvatar
                        mood={petStats.mood}
                        size="sm"
                        equippedAccessory={gameState.equippedAccessory}
                        skinColor={gameState.skinColor}
                        hairstyle={gameState.hairstyle}
                        interactive={false}
                      />
                    </MessageAvatar>
                    <MessageContent>
                      <Bubble variant="tinted" align="start">
                        <BubbleContent>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-0.5">
                            <span className="text-[11px] font-semibold text-primary">{t('tamagotchiChat.thinking')}</span>
                            <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                            <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              )}

              <div ref={messagesEndRef} />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" className="shadow-lg border border-border/50 bg-background/95 backdrop-blur-md" />
        </MessageScroller>

        {/* Sección de Accesos Rápidos y Sugerencias IA estilizada como en Chat Window */}
        <div className="p-3 border-t border-border/50 bg-muted/10 shrink-0">
          <div className="mb-2">
            <div className="flex items-center justify-between gap-2 py-0.5">
              <div className="text-[10px] uppercase font-bold tracking-widest text-primary/80 select-none flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>CONSULTAR A DOTZI</span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts((prev) => !prev)}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground font-semibold rounded-lg flex items-center gap-1 hover:bg-muted/50 cursor-pointer"
              >
                <span>{showShortcuts ? t('chat.hideSuggestions') : t('chat.showShortcuts')}</span>
                {showShortcuts ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                )}
              </Button>
            </div>

            <AnimatePresence initial={false}>
              {showShortcuts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden pt-2 pb-1"
                >
                  <div className="flex flex-wrap gap-2 items-center">
                    {promptSnippets.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={loading || loadingHistory}
                        onClick={() => handleSend(item.text)}
                        className={`text-xs border px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs ${item.colorClass}`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Formulario e Input estilizados con Shadcn */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('tamagotchiChat.inputPlaceholder')}
              disabled={loading || loadingHistory}
              className="flex-1 rounded-xl bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-xs sm:text-sm py-4 px-3.5 h-10"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || loading || loadingHistory}
              className="rounded-xl h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
