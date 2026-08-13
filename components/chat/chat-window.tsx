'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { Send, Users, Smile, MessageSquare, AlertCircle } from 'lucide-react'

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
  created_by: string
}

interface ChatWindowProps {
  householdId: string
  householdName: string
  userId: string
  initialMessages: ChatMessage[]
  members: Member[]
}

export function ChatWindow({
  householdId,
  householdName,
  userId,
  initialMessages,
  members,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Auto-scroll al final del chat
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Desplazarse al fondo al cargar por primera vez
  useEffect(() => {
    scrollToBottom('auto')
  }, [])

  // Desplazarse al fondo cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages])

  // Suscribirse a los mensajes en tiempo real
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
          setMessages((prev) => {
            // Evitar duplicados si el mensaje ya fue insertado optimistamente
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isSending) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setIsSending(true)
    setError(null)

    try {
      // Insertar en la base de datos (Supabase)
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          household_id: householdId,
          content: messageText,
          created_by: userId,
        })
        .select()

      if (insertError) {
        throw insertError
      }

      if (data && data.length > 0) {
        const createdMessage = data[0] as ChatMessage
        setMessages((prev) => {
          if (prev.some((m) => m.id === createdMessage.id)) return prev
          return [...prev, createdMessage]
        })
      }
    } catch (err: any) {
      console.error('Error al enviar el mensaje:', err)
      setError('No se pudo enviar el mensaje. Inténtalo de nuevo.')
      setInputMessage(messageText) // restaurar texto
    } finally {
      setIsSending(false)
    }
  }

  // Ayudante para obtener datos de perfil de un miembro
  const getMemberProfile = (senderId: string): Member => {
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

        {/* Lista de avatares de miembros en la cabecera */}
        <div className="flex items-center gap-1.5 self-start sm:self-center overflow-x-auto max-w-full pb-1 sm:pb-0">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mr-1 font-semibold uppercase tracking-wider">
            <Users className="h-3.5 w-3.5" />
            Familia:
          </div>
          {members.map((m) => (
            <div
              key={m.user_id}
              className="relative group flex-shrink-0"
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
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-950 text-white text-[10px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-50">
                <p className="font-bold">{m.display_name}</p>
                {m.status && <p className="text-slate-300 italic mt-0.5">{m.status}</p>}
              </div>
            </div>
          ))}
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
                  const isMe = msg.created_by === userId
                  const sender = getMemberProfile(msg.created_by)

                  return (
                    <Message key={msg.id} align={isMe ? 'end' : 'start'} className="px-1">
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
                              className="text-[10px] text-muted-foreground italic mr-2 truncate max-w-[120px] sm:max-w-[180px]"
                              title={sender.status}
                            >
                              ({sender.status})
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/80 font-normal">
                            {formatMessageTime(msg.created_at)}
                          </span>
                        </MessageHeader>
                        <div
                          className={`px-3.5 py-2.5 text-sm leading-relaxed max-w-[75%] sm:max-w-[60%] break-words shadow-xs border ${
                            isMe
                              ? 'bg-primary text-primary-foreground border-primary/20 rounded-2xl rounded-tr-none'
                              : 'bg-muted/60 text-foreground border-border/40 rounded-2xl rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </MessageContent>
                    </Message>
                  )
                })}
              </MessageGroup>
            </div>
          ))
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
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <Input
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
