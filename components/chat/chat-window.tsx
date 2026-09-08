'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { askGeminiAction } from '@/app/actions/gemini'
import { sendMessageAction, updateMessageAction, deleteMessageAction, confirmChatAction, cancelChatAction } from '@/app/actions/chat'
import {
  MessageGroup,
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from '@/components/ui/message'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Users, Smile, MessageSquare, AlertCircle, Bell, BellRing, Pencil, Trash2, Check, X, PiggyBank, ShoppingCart, CreditCard, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  getPushNotificationState,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from '@/lib/push-notifications'
import { sendHouseholdChatPushAction } from '@/app/actions/push'
import { toast } from '@/components/ui/toast'
import { useOfflineSync } from '@/components/providers/offline-sync-provider'

interface Member {
  user_id: string
  role: string
  display_name: string
  avatar_url: string
  status: string
  email: string
}

interface ChatMessage {
  id: string
  content: string
  created_at: string
  created_by: string | null
  updated_at?: string | null
  is_deleted?: boolean | null
  is_bot?: boolean
}

interface ChatWindowProps {
  householdId: string
  householdName: string
  userId: string
  initialMessages: ChatMessage[]
  members: Member[]
}

interface PendingActionPayload {
  action: string
  params: any
  status: 'pending' | 'confirmed' | 'cancelled'
}

function parsePendingAction(content: string): { text: string; actionData: PendingActionPayload | null } {
  if (!content) return { text: '', actionData: null }
  const match = content.match(/<!--PENDING_ACTION:(.*?)-->/)
  if (!match) return { text: content, actionData: null }

  const text = content.replace(/<!--PENDING_ACTION:.*?-->/g, '').trim()
  try {
    const actionData = JSON.parse(match[1]) as PendingActionPayload
    return { text, actionData }
  } catch (e) {
    return { text, actionData: null }
  }
}

function renderFormattedText(text: string) {
  if (!text) return null
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index} className="italic">{part.slice(1, -1)}</em>
    }
    return part
  })
}

function ActionConfirmationCard({
  actionData,
  isExecuting,
  onConfirm,
  onCancel,
}: {
  actionData: PendingActionPayload
  isExecuting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const getActionIcon = () => {
    switch (actionData.action) {
      case 'create_saving_goal':
      case 'add_saving_contribution':
        return <PiggyBank className="w-4 h-4 text-emerald-500" />
      case 'add_shopping_items':
        return <ShoppingCart className="w-4 h-4 text-amber-500" />
      case 'add_expense':
        return <CreditCard className="w-4 h-4 text-blue-500" />
      case 'send_member_reminder':
        return <Bell className="w-4 h-4 text-violet-500" />
      default:
        return <Check className="w-4 h-4 text-primary" />
    }
  }

  const getActionTitle = () => {
    switch (actionData.action) {
      case 'create_saving_goal':
        return `Crear Hucha: "${actionData.params?.name || 'Ahorro'}"`
      case 'add_saving_contribution':
        return `Aportar a Hucha: ${actionData.params?.amount || 0}€`
      case 'add_shopping_items':
        return `Añadir a la Compra: ${actionData.params?.items?.map((i: any) => i.name || i).join(', ') || ''}`
      case 'add_expense':
        return `Registrar Gasto: ${actionData.params?.amount || 0}€ - ${actionData.params?.description || ''}`
      case 'send_member_reminder':
        return `Enviar Aviso a ${actionData.params?.target_user_name || 'Miembro'}`
      default:
        return 'Confirmar Acción'
    }
  }

  if (actionData.status === 'confirmed') {
    return (
      <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
        <Check className="w-3.5 h-3.5" />
        <span>Acción confirmada y ejecutada con éxito</span>
      </div>
    )
  }

  if (actionData.status === 'cancelled') {
    return (
      <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-border/40 text-muted-foreground text-xs font-medium flex items-center gap-1.5">
        <X className="w-3.5 h-3.5" />
        <span>Acción cancelada</span>
      </div>
    )
  }

  return (
    <div className="mt-3 p-3 rounded-2xl bg-background/95 border border-primary/30 shadow-md flex flex-col gap-2.5 transition-all text-foreground">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10 flex items-center justify-center">
          {getActionIcon()}
        </div>
        <span className="text-xs font-bold font-heading">
          {getActionTitle()}
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        ¿Deseas confirmar la ejecución de esta acción en tu hogar?
      </p>

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          disabled={isExecuting}
          onClick={onConfirm}
          className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          {isExecuting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>Confirmar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isExecuting}
          onClick={onCancel}
          className="h-8 px-3 rounded-xl text-xs text-muted-foreground hover:text-destructive border-border hover:border-destructive/30 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          <span>Cancelar</span>
        </Button>
      </div>
    </div>
  )
}

export function ChatWindow({
  householdId,
  householdName,
  userId,
  initialMessages,
  members,
}: ChatWindowProps) {
  const { t, locale } = useI18n()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para Edición de Mensajes
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)

  // Estado para ejecución de acciones propuestas por Gemini
  const [executingActionId, setExecutingActionId] = useState<string | null>(null)

  // Estado de visibilidad de accesos directos IA de Gemini (colapsable a voluntad)
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false)

  // Sincronizar la preferencia en cliente tras la hidratación SSR
  useEffect(() => {
    const saved = localStorage.getItem('control_dotz_chat_show_shortcuts')
    if (saved !== null) {
      setShowShortcuts(saved === 'true')
    } else if (window.innerWidth >= 768) {
      setShowShortcuts(true)
    }
  }, [])

  const toggleShortcuts = () => {
    setShowShortcuts((prev) => {
      const next = !prev
      try {
        localStorage.setItem('control_dotz_chat_show_shortcuts', String(next))
      } catch (_) {}
      return next
    })
  }

  const handleConfirmAction = async (msgId: string, actionData: any) => {
    if (executingActionId) return
    setExecutingActionId(msgId)
    try {
      const res = await confirmChatAction(msgId, actionData)
      if (res.error) {
        toast.add({
          title: 'Error al confirmar la acción',
          description: res.error,
          type: 'error',
        })
      } else {
        toast.add({
          title: '¡Acción ejecutada!',
          description: res.resultMessage || 'La operación se ha realizado con éxito.',
          type: 'success',
        })
      }
    } catch (err: any) {
      toast.add({
        title: 'Error',
        description: err.message || 'No se pudo confirmar la acción.',
        type: 'error',
      })
    } finally {
      setExecutingActionId(null)
    }
  }

  const handleCancelAction = async (msgId: string) => {
    if (executingActionId) return
    setExecutingActionId(msgId)
    try {
      const res = await cancelChatAction(msgId)
      if (res.error) {
        toast.add({
          title: 'Error al cancelar la acción',
          description: res.error,
          type: 'error',
        })
      } else {
        toast.add({
          title: 'Acción cancelada',
          type: 'info',
        })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setExecutingActionId(null)
    }
  }

  // Estado de notificaciones Push PWA
  const [pushState, setPushState] = useState<{
    isSupported: boolean
    permission: string
    isSubscribed: boolean
  }>({ isSupported: false, permission: 'default', isSubscribed: false })
  const [isPushLoading, setIsPushLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Comprobar estado de notificaciones push al cargar el chat
  useEffect(() => {
    getPushNotificationState().then(setPushState)
  }, [])

  const handleTogglePush = async () => {
    setIsPushLoading(true)
    if (pushState.isSubscribed) {
      const res = await unsubscribeUserFromPush()
      if (res.success) {
        setPushState((prev) => ({ ...prev, isSubscribed: false }))
        toast.add({
          title: 'Notificaciones Push desactivadas',
          description: 'Ya no recibirás notificaciones en este dispositivo.',
          type: 'info',
        })
      }
    } else {
      const res = await subscribeUserToPush()
      if (res.success) {
        setPushState((prev) => ({ ...prev, isSubscribed: true, permission: 'granted' }))
        toast.add({
          title: '¡Notificaciones Push activadas! 🔔',
          description: 'Recibirás notificaciones en tu pantalla cuando la familia escriba en el chat.',
          type: 'success',
        })
      } else if (res.error) {
        toast.add({
          title: 'Error al activar notificaciones',
          description: res.error,
          type: 'error',
        })
      }
    }
    setIsPushLoading(false)
  }

  const handleActivateGemini = () => {
    setInputMessage((prev) => {
      const trimmed = prev.trim()
      if (trimmed.toLowerCase().includes('@gemini')) return prev
      return `@gemini ${trimmed}`.trim()
    })
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  // Auto-scroll al final del chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Sincronizar mensajes iniciales cuando la prop se actualiza desde el servidor
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Desplazarse al fondo al cargar por primera vez
  useEffect(() => {
    scrollToBottom('auto')
  }, [])

  // Desplazarse al fondo cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages])

  // Suscribirse a los mensajes en tiempo real (INSERT, UPDATE, DELETE)
  useEffect(() => {
    const channel = supabase
      .channel(`chat_messages_${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          if (newMessage.content?.startsWith('🤖')) {
            setIsBotTyping(false)
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? {
                  ...m,
                  content: updated.content,
                  updated_at: updated.updated_at,
                  is_deleted: updated.is_deleted,
                }
                : m
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          const deletedId = payload.old.id
          setMessages((prev) =>
            prev.map((m) => (m.id === deletedId ? { ...m, is_deleted: true } : m))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, supabase])

  const handleStartEdit = (msg: ChatMessage) => {
    setEditingMessageId(msg.id)
    setEditingContent(msg.content)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim() || isUpdating) return
    const trimmed = editingContent.trim()
    const now = new Date().toISOString()
    setIsUpdating(true)

    // Actualización optimista
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: trimmed, updated_at: now } : m
      )
    )
    setEditingMessageId(null)

    const res = await updateMessageAction(messageId, trimmed)
    if (res.error) {
      toast.add({
        title: 'Error al editar mensaje',
        description: res.error,
        type: 'error',
      })
    } else {
      toast.add({
        title: 'Mensaje actualizado',
        type: 'success',
      })
    }
    setIsUpdating(false)
  }

  const handleDeleteMessage = async (messageId: string) => {
    const now = new Date().toISOString()
    // Eliminación optimista mostrando estado "Este mensaje fue eliminado"
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, is_deleted: true, updated_at: now } : m
      )
    )

    const res = await deleteMessageAction(messageId)
    if (res.error) {
      toast.add({
        title: 'Error al eliminar mensaje',
        description: res.error,
        type: 'error',
      })
    } else {
      toast.add({
        title: 'Mensaje eliminado',
        type: 'info',
      })
    }
  }

  const handleSendSuggestedQuestion = async (questionText: string) => {
    if (isSending || isBotTyping) return
    setIsSending(true)
    setIsBotTyping(true)
    setError(null)

    try {
      const res = await sendMessageAction(householdId, questionText)
      if (res.error) {
        throw new Error(res.error)
      }

      if (res.message) {
        const createdMessage = res.message as ChatMessage
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMessage.id)) return prev
          return [...prev, createdMessage]
        })
      }
    } catch (err: any) {
      console.error('Error al enviar pregunta sugerida:', err)
      setError(err?.message || 'No se pudo enviar la pregunta sugerida. Inténtalo de nuevo.')
    } finally {
      setIsSending(false)
      setIsBotTyping(false)
    }
  }

  const { isOnline, enqueueAction } = useOfflineSync()

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isSending) return

    const messageText = inputMessage.trim()
    const isGeminiQuery = messageText.toLowerCase().includes('@gemini')
    setInputMessage('')
    setIsSending(true)
    if (isGeminiQuery) {
      setIsBotTyping(true)
    }
    setError(null)

    // Manejo cuando se está offline sin conexión a internet
    if (!navigator.onLine || !isOnline) {
      const tempId = `temp_msg_${Date.now()}`
      const offlineMsg: ChatMessage = {
        id: tempId,
        content: `${messageText} (Pendiente de envío ⚡)`,
        created_at: new Date().toISOString(),
        created_by: userId,
      }
      setMessages((prev) => [...prev, offlineMsg])
      await enqueueAction('SEND_CHAT_MESSAGE', { householdId, content: messageText })
      setIsSending(false)
      setIsBotTyping(false)
      return
    }

    try {
      const res = await sendMessageAction(householdId, messageText)
      if (res.error) {
        throw new Error(res.error)
      }

      if (res.message) {
        const createdMessage = res.message as ChatMessage
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMessage.id)) return prev
          return [...prev, createdMessage]
        })

        // Disparar Notificación Push a los miembros del hogar en segundo plano
        const myProfile = members.find((m) => m.user_id === userId)
        const senderName = myProfile?.display_name || 'Miembro del Hogar'
        sendHouseholdChatPushAction({
          householdId,
          senderId: userId,
          senderName,
          text: messageText,
        }).catch((err) => console.error('Error enviando push notification:', err))
      }
    } catch (err: any) {
      console.error('Error al enviar el mensaje:', err)
      setError(err?.message || 'No se pudo enviar el mensaje. Inténtalo de nuevo.')
      setInputMessage(messageText) // restaurar texto
    } finally {
      setIsSending(false)
      setIsBotTyping(false)
    }
  }

  // Ayudante para obtener datos de perfil de un miembro
  const getMemberProfile = (senderId: string | null, isBot?: boolean): Member => {
    if (isBot || !senderId) {
      return {
        user_id: '',
        role: 'member',
        display_name: 'Gemini AI',
        avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&h=80&fit=crop',
        status: 'Asistente Financiero 🤖',
        email: 'gemini@contro-dotz.ai',
      }
    }
    const member = members.find((m) => m.user_id === senderId)
    return member || {
      user_id: senderId,
      role: 'member',
      display_name: 'Usuario',
      avatar_url: '',
      status: '',
      email: '',
    }
  }

  // Formatear hora de un mensaje (ej: 15:30)
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (e) {
      return ''
    }
  }

  // Formatear fecha para cabecera de grupo (ej: "Hoy", "Ayer", "12 de Agosto")
  const formatGroupDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
  }

  // Agrupar mensajes por día
  const groupedMessages: { [key: string]: ChatMessage[] } = {}
  messages.forEach((msg) => {
    const dateKey = new Date(msg.created_at).toDateString()
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = []
    }
    groupedMessages[dateKey].push(msg)
  })

  return (
    <div className="flex flex-col flex-1 border border-border/60 bg-background/50 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
      {/* Cabecera del Chat */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-b border-border/60 bg-muted/20 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base tracking-tight font-heading leading-tight">
              Chat Familiar - {householdName}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mensajes en tiempo real con tu hogar
            </p>
          </div>
        </div>

        {/* Toggle de Notificaciones Push y lista de miembros */}
        <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center">
          {pushState.isSupported && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPushLoading || pushState.permission === 'denied'}
              onClick={handleTogglePush}
              className={`h-8 px-2.5 rounded-xl text-xs gap-1.5 border transition-all ${pushState.isSubscribed
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              title={
                pushState.permission === 'denied'
                  ? 'Permiso de notificaciones denegado en el navegador'
                  : pushState.isSubscribed
                    ? 'Desactivar notificaciones push en este dispositivo'
                    : 'Activar notificaciones push en este dispositivo'
              }
            >
              {pushState.isSubscribed ? (
                <>
                  <BellRing className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline font-bold">Push Activas</span>
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Activar Push</span>
                </>
              )}
            </Button>
          )}

          {/* Lista de avatares de miembros en la cabecera */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full py-1">
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mr-1 font-semibold uppercase tracking-wider hidden xs:flex">
              <Users className="h-3.5 w-3.5" />
              Familia:
            </div>
            {members.map((m) => (
              <div
                key={m.user_id}
                className="relative group"
                title={`${m.display_name} ${m.status ? `(${m.status})` : ''}`}
              >
                <Avatar className="h-7 w-7 border-2 border-background shadow-xs hover:scale-105 transition-transform duration-200">
                  {m.avatar_url ? (
                    <AvatarImage src={m.avatar_url} alt={m.display_name} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                    {m.display_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Indicador de estado si tiene */}
                {m.status && (
                  <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 border border-background h-2 w-2 rounded-full" />
                )}

                {/* Tooltip personalizado */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden bg-slate-950 text-white text-[10px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-50">
                  <p className="font-bold">{m.display_name}</p>
                  {m.status && <p className="text-slate-300 italic mt-0.5">{m.status}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cuerpo del Chat (Mensajes) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="h-14 w-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
              <MessageSquare className="h-7 w-7 stroke-1 text-slate-400" />
            </div>
            <p className="font-semibold text-foreground text-sm font-heading">Sin mensajes todavía</p>
            <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
              ¡Di hola a tu familia y empieza a chatear! Los mensajes se actualizan instantáneamente.
            </p>
          </div>
        ) : (
          Object.keys(groupedMessages).map((dateKey) => (
            <div key={dateKey} className="space-y-4">
              {/* Separador de Fecha */}
              <div className="flex items-center justify-center my-4">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider bg-muted/65 dark:bg-muted/30 px-3 py-1 rounded-full border border-border/30">
                  {formatGroupDate(groupedMessages[dateKey][0].created_at)}
                </span>
              </div>

              {/* Mensajes del día */}
              <MessageGroup className="gap-4">
                {groupedMessages[dateKey].map((msg) => {
                  const isBot = msg.is_bot || msg.created_by === '00000000-0000-0000-0000-000000000000' || msg.content?.startsWith('🤖')
                  const isMe = !isBot && msg.created_by === userId
                  const sender = getMemberProfile(msg.created_by, isBot)
                  const isEditing = editingMessageId === msg.id
                  const { text: cleanText, actionData } = parsePendingAction(msg.content)

                  return (
                    <Message key={msg.id} align={isMe ? 'end' : 'start'} className="px-1 group/msg relative">
                      <MessageAvatar>
                        <Avatar className="h-8 w-8 border border-border/35 shadow-xs">
                          {sender.avatar_url ? (
                            <AvatarImage src={sender.avatar_url} alt={sender.display_name} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                            {sender.display_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </MessageAvatar>
                      <MessageContent>
                        <MessageHeader className={isMe ? 'justify-end' : ''}>
                          {!isMe && (
                            <span className="font-bold text-foreground mr-1.5">
                              {sender.display_name}
                            </span>
                          )}
                          {!isMe && sender.status && (
                            <span
                              className="text-[10px] text-muted-foreground italic mr-2 truncate max-w-30 sm:max-w-45"
                              title={sender.status}
                            >
                              ({sender.status})
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/80 font-normal flex items-center gap-1">
                            {formatMessageTime(msg.created_at)}
                            {msg.updated_at && !msg.is_deleted && (
                              <span className="italic text-[9px] text-muted-foreground/60 font-medium">(editado)</span>
                            )}
                          </span>
                        </MessageHeader>

                        <div className="flex items-center gap-1.5 group/bubble">
                          {/* Botones de acción para el creador del mensaje (Edición / Eliminación) */}
                          {isMe && !isEditing && !msg.is_deleted && (
                            <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(msg)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                                title="Editar mensaje"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Eliminar mensaje"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {msg.is_deleted ? (
                            <div className="px-3 py-1.5 text-xs italic text-muted-foreground/70 bg-muted/30 border border-border/20 rounded-2xl flex items-center gap-1.5 select-none">
                              <Trash2 className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                              <span>Este mensaje fue eliminado</span>
                            </div>
                          ) : isEditing ? (
                            <div className="flex items-center gap-1.5 bg-background border border-primary/40 p-1.5 rounded-2xl shadow-md w-full max-w-xs sm:max-w-md">
                              <input
                                type="text"
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(msg.id)
                                  if (e.key === 'Escape') handleCancelEdit()
                                }}
                                autoFocus
                                className="flex-1 bg-transparent px-2.5 py-1 text-sm outline-none text-foreground"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id)}
                                className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                title="Guardar cambios"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] sm:max-w-[70%] wrap-break-word shadow-xs border ${isMe
                                ? 'bg-primary text-primary-foreground border-primary/20 rounded-2xl rounded-tr-none'
                                : 'bg-muted/60 text-foreground border-border/40 rounded-2xl rounded-tl-none'
                                }`}
                            >
                              <div className="whitespace-pre-wrap">{renderFormattedText(cleanText)}</div>
                              {actionData && (
                                <ActionConfirmationCard
                                  actionData={actionData}
                                  isExecuting={executingActionId === msg.id}
                                  onConfirm={() => handleConfirmAction(msg.id, actionData)}
                                  onCancel={() => handleCancelAction(msg.id)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </MessageContent>
                    </Message>
                  )
                })}
              </MessageGroup>
            </div>
          ))
        )}

        {/* Indicador de escritura del bot Gemini */}
        {isBotTyping && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground italic px-2 animate-pulse mt-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
            <span className="ml-1 font-semibold text-primary">Gemini AI está analizando los datos del hogar... 🤖</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Barra de Entrada de Texto */}
      <div className="p-4 border-t border-border/60 bg-muted/10">
        {/* Cabecera y Preguntas sugeridas a Gemini AI (Colapsable a voluntad) */}
        <div className="mb-2">
          <div className="flex items-center justify-between gap-2 py-0.5">
            <button
              type="button"
              onClick={handleActivateGemini}
              className="text-[10px] uppercase font-bold tracking-widest text-primary/80 hover:text-primary dark:text-violet-400 dark:hover:text-violet-300 select-none flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Haz clic para mencionar a @gemini y empezar a escribir"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>🤖 Consultar a Gemini</span>
            </button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleShortcuts}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground font-semibold rounded-lg flex items-center gap-1 hover:bg-muted/50 cursor-pointer"
            >
              <span>{showShortcuts ? 'Ocultar sugerencias' : 'Ver accesos IA (9)'}</span>
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
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini Crear una hucha para las vacaciones con un objetivo de 1500 €')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-semibold"
                  >
                    + Hucha Vacaciones
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini Añadir leche y huevos a la lista de compra')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-semibold"
                  >
                    + Lista Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini He añadido el recibo de internet de 45€')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-semibold"
                  >
                    + Recibo Internet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini Avisar a la familia de que el seguro vence el viernes')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-semibold"
                  >
                    + Enviar Aviso
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini ¿cómo van nuestros límites y presupuestos de este mes?')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-muted/60 hover:bg-muted dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-border/40 text-foreground px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-medium"
                  >
                    Presupuestos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini ¿quién debe dinero a quién y cuánto en nuestro hogar?')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-muted/60 hover:bg-muted dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-border/40 text-foreground px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-medium"
                  >
                    Saldar Deudas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini dame un consejo financiero para ahorrar este mes')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-muted/60 hover:bg-muted dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-border/40 text-foreground px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-medium"
                  >
                    Consejo Ahorro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini ¿en qué categoría hemos gastado más dinero este mes?')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-muted/60 hover:bg-muted dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-border/40 text-foreground px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-medium"
                  >
                    Top Categorías
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendSuggestedQuestion('@gemini hazme un resumen rápido de las finanzas familiares de la última semana')}
                    disabled={isSending || isBotTyping}
                    className="text-xs bg-muted/60 hover:bg-muted dark:bg-slate-900/60 dark:hover:bg-slate-800 border border-border/40 text-foreground px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 font-medium"
                  >
                    Resumen Semanal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe un mensaje para tu familia..."
            disabled={isSending}
            maxLength={1000}
            className="flex-1 rounded-xl bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm py-5 px-4"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputMessage.trim() || isSending}
            className="rounded-xl h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            <Send className="h-4.5 w-4.5" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
