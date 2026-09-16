'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Member {
  user_id: string
  display_name: string
}

interface MessageReactionsProps {
  reactions?: Record<string, string[]> | null
  currentUserId: string
  members?: Member[]
  onToggleReaction: (emoji: string) => void
  isUserMessage?: boolean
}

export function MessageReactions({
  reactions,
  currentUserId,
  members = [],
  onToggleReaction,
  isUserMessage = false,
}: MessageReactionsProps) {
  if (!reactions || Object.keys(reactions).length === 0) {
    return null
  }

  // Filter out any emojis with zero users
  const entries = Object.entries(reactions).filter(
    ([_, userIds]) => Array.isArray(userIds) && userIds.length > 0
  )

  if (entries.length === 0) return null

  // Map member names for tooltip
  const getMemberNames = (userIds: string[]) => {
    const names = userIds.map((id) => {
      if (id === currentUserId) return 'Tú'
      const found = members.find((m) => m.user_id === id)
      return found?.display_name || 'Miembro'
    })
    return names.join(', ')
  }

  return (
    <div
      className={cn(
        'absolute -bottom-3 z-20 flex flex-wrap gap-1 items-center bg-background/95 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-border/80 shadow-md ring-1 ring-black/5',
        isUserMessage ? 'right-2' : 'left-2'
      )}
    >
      {entries.map(([emoji, userIds]) => {
        const hasReacted = userIds.includes(currentUserId)
        const count = userIds.length

        return (
          <Tooltip key={emoji}>
            <TooltipTrigger
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleReaction(emoji)
              }}
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-150 select-none active:scale-90 cursor-pointer',
                hasReacted
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'hover:bg-muted text-foreground'
              )}
            >
              <span className="text-sm leading-none">{emoji}</span>
              {count > 1 && <span className="text-[10px] font-bold">{count}</span>}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs z-50">
              {getMemberNames(userIds)}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
