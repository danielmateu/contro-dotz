'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { signOutAction } from '@/app/actions/auth'
import { AppUpdatesWidget } from '@/components/updates/app-updates-widget'
import { ShareAppModal } from '@/components/share-app-modal'
import { FeatureBaseWidget } from '@/components/feedback/featurebase-widget'
import {
  ChevronsUpDown,
  MegaphoneIcon,
  Share2,
  MessageSquarePlus,
  LogOut,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'

interface SidebarUserFooterProps {
  userEmail?: string
  displayName?: string
  avatarUrl?: string | null
  status?: string | null
}

export function SidebarUserFooter({
  userEmail,
  displayName,
  avatarUrl,
  status,
}: SidebarUserFooterProps) {
  const { t, locale } = useI18n()

  const shareText =
    locale === 'en'
      ? 'Share App'
      : locale === 'ca'
      ? 'Compartir App'
      : 'Compartir App'

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button className="w-full text-left outline-none rounded-xl hover:bg-sidebar-accent/70 transition-colors p-2 flex items-center justify-between gap-2.5 group cursor-pointer border border-transparent hover:border-sidebar-border/40 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto">
            <div className="flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:gap-0">
              <Avatar className="h-8 w-8 border border-sidebar-border/50 shrink-0">
                {avatarUrl ? (
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName || 'Usuario'}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {(displayName || 'U').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 truncate group-data-[collapsible=icon]:hidden">
                <span className="text-xs font-bold text-sidebar-foreground truncate leading-tight">
                  {displayName || 'Usuario'}
                </span>
                {status ? (
                  <span className="text-[10px] text-muted-foreground truncate italic leading-tight">
                    {status}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground truncate leading-tight">
                    {userEmail}
                  </span>
                )}
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/70 group-data-[collapsible=icon]:hidden shrink-0" />
          </button>
        }
      />

      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-64 rounded-2xl bg-card border-border shadow-2xl p-2.5 z-50"
      >
        {/* User Profile Header inside Popover */}
        <div className="flex items-center gap-3 p-2 border-b border-border/50 pb-3 mb-1">
          <Avatar className="h-10 w-10 border border-primary/20 shrink-0">
            {avatarUrl ? (
              <AvatarImage
                src={avatarUrl}
                alt={displayName || 'Usuario'}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {(displayName || 'U').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 truncate">
            <span className="text-sm font-extrabold text-foreground truncate">
              {displayName || 'Usuario'}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {userEmail}
            </span>
            {status && (
              <span className="text-[10px] text-emerald-500 font-medium truncate italic pt-0.5">
                ✨ {status}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions List */}
        <div className="space-y-0.5 py-1">
          {/* Novedades & Updates */}
          <AppUpdatesWidget
            trigger={(hasUnread) => (
              <button className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-accent rounded-xl transition-all cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <MegaphoneIcon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{t('updates.title')}</span>
                </div>
                {hasUnread && (
                  <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>
            )}
          />

          {/* Share App */}
          <ShareAppModal
            trigger={
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-accent rounded-xl transition-all cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <span className="truncate">{shareText}</span>
              </button>
            }
          />

          {/* Feedback & Suggestions */}
          <FeatureBaseWidget
            userEmail={userEmail}
            userName={displayName}
            trigger={
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-accent rounded-xl transition-all cursor-pointer">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <span className="truncate">{t('feedback.title')}</span>
              </button>
            }
          />
        </div>

        <Separator className="my-1.5" />

        {/* Logout action */}
        <form action={signOutAction} className="w-full">
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span>{t('common.logout')}</span>
          </button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
