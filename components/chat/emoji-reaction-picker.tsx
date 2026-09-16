'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Theme, EmojiClickData } from 'emoji-picker-react'

// Dynamically import EmojiPicker to avoid SSR hydration mismatches in Next.js
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[350px] w-[320px] bg-popover text-muted-foreground text-sm">
      Cargando emojis...
    </div>
  ),
})

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

interface EmojiReactionPickerProps {
  onSelectEmoji: (emoji: string) => void
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export function EmojiReactionPicker({
  onSelectEmoji,
  side = 'top',
  align = 'end',
}: EmojiReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { theme } = useTheme()

  const pickerTheme =
    theme === 'dark' ? Theme.DARK : theme === 'light' ? Theme.LIGHT : Theme.AUTO

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelectEmoji(emojiData.emoji)
    setIsOpen(false)
  }

  const handleQuickEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji)
  }

  return (
    <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md border rounded-full px-2 py-1 shadow-md hover:shadow-lg transition-all">
      {/* Quick Emoji Reaction Buttons */}
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleQuickEmojiClick(emoji)}
          className="hover:scale-125 active:scale-95 transition-transform text-base sm:text-lg leading-none p-1 rounded-full hover:bg-muted/80 cursor-pointer"
          title={`Reaccionar con ${emoji}`}
        >
          {emoji}
        </button>
      ))}

      {/* Full Emoji Picker Popover */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center justify-center transition-colors cursor-pointer"
          title="Ver más emojis"
        >
          <Plus className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          sideOffset={8}
          className="w-[320px] max-w-[calc(100vw-32px)] p-0 border-none shadow-2xl bg-transparent z-50"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={pickerTheme}
            lazyLoadEmojis
            searchPlaceHolder="Buscar emoji..."
            width="100%"
            height={380}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
