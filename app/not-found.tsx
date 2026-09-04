'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  ArrowLeft,
  Receipt,
  LayoutDashboard,
  PieChart,
  PiggyBank,
  Search,
  Sparkles,
  FileQuestion,
  ShieldAlert
} from 'lucide-react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()
  const { t } = useI18n()

  const quickLinks = [
    {
      label: t('notFound.dashboard') !== 'notFound.dashboard' ? t('notFound.dashboard') : 'Panel Principal',
      href: '/dashboard',
      icon: LayoutDashboard,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-500 dark:text-blue-400',
    },
    {
      label: t('notFound.expenses') !== 'notFound.expenses' ? t('notFound.expenses') : 'Gastos',
      href: '/expenses',
      icon: Receipt,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-500 dark:text-emerald-400',
    },
    {
      label: t('notFound.budgets') !== 'notFound.budgets' ? t('notFound.budgets') : 'Presupuestos',
      href: '/budgets',
      icon: PieChart,
      color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-500 dark:text-purple-400',
    },
    {
      label: t('notFound.savingGoals') !== 'notFound.savingGoals' ? t('notFound.savingGoals') : 'Huchas Ahorro',
      href: '/saving-goals',
      icon: PiggyBank,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-500 dark:text-amber-400',
    },
  ]

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      {/* Background Decorative Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 size-150 rounded-full bg-linear-to-tr from-primary/20 via-purple-500/10 to-emerald-500/20 blur-3xl opacity-70 dark:opacity-50 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] size-125 rounded-full bg-linear-to-br from-indigo-500/15 via-emerald-500/15 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Main Glass Container */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl rounded-3xl border border-border/60 bg-card/60 p-6 sm:p-10 shadow-2xl backdrop-blur-xl dark:bg-card/40 dark:border-white/10 text-center"
      >
        {/* Ticket & 404 Illustration Hero */}
        <div className="relative mx-auto mb-8 flex h-48 w-full max-w-xs items-center justify-center">
          {/* Animated Glowing Dotz */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute size-40 rounded-full bg-primary/20 blur-2xl"
          />

          {/* Ticket/Receipt Graphic Card */}
          <motion.div
            initial={{ rotate: -4 }}
            animate={{ rotate: [-4, 3, -4], y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="relative flex flex-col items-center justify-between rounded-2xl border border-dashed border-primary/40 bg-background/90 p-5 shadow-xl backdrop-blur-md dark:bg-background/80 w-52 h-44"
          >
            {/* Header of Ticket */}
            <div className="flex w-full items-center justify-between border-b border-dashed border-border/80 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Receipt className="size-4" />
                <span>Control Dotz</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                ERR-404
              </span>
            </div>

            {/* Ticket Center Badge */}
            <div className="my-auto flex flex-col items-center gap-1">
              <div className="relative flex items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight bg-linear-to-r from-primary via-purple-500 to-emerald-500 bg-clip-text text-transparent">
                  404
                </span>
                <Sparkles className="absolute -top-2 -right-4 size-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {t('notFound.badge') !== 'notFound.badge' ? t('notFound.badge') : '404 • Registro no encontrado'}
              </span>
            </div>

            {/* Ticket Barcode Pattern */}
            <div className="w-full pt-2 border-t border-dashed border-border/80 flex justify-between items-center opacity-60">
              <div className="h-3 w-full bg-[repeating-linear-gradient(90deg,currentColor,currentColor_2px,transparent_2px,transparent_4px)] text-foreground/40" />
            </div>
          </motion.div>
        </div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="space-y-3"
        >
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('notFound.title') !== 'notFound.title'
              ? t('notFound.title')
              : '¡Ups! Este movimiento no está en los registros'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t('notFound.subtitle') !== 'notFound.subtitle'
              ? t('notFound.subtitle')
              : 'La página que buscas no existe, se ha trasladado o el enlace introducido no es válido.'}
          </p>
        </motion.div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="default"
              size="lg"
              className="w-full sm:w-auto gap-2 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Home className="size-4" />
              <span>
                {t('notFound.backHome') !== 'notFound.backHome'
                  ? t('notFound.backHome')
                  : 'Ir al Panel Principal'}
              </span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            onClick={() => router.back()}
            className="w-full sm:w-auto gap-2 px-6 border-border/80 hover:bg-accent/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="size-4" />
            <span>
              {t('notFound.goBack') !== 'notFound.goBack'
                ? t('notFound.goBack')
                : 'Volver atrás'}
            </span>
          </Button>
        </motion.div>

        {/* Quick Links Chips Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-10 pt-6 border-t border-border/50"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t('notFound.quickLinks') !== 'notFound.quickLinks'
              ? t('notFound.quickLinks')
              : 'Accesos recomendados'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <div className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border bg-linear-to-b ${link.color} transition-all duration-200 hover:scale-105 hover:shadow-md group cursor-pointer`}>
                    <Icon className="size-5 transition-transform group-hover:scale-110" />
                    <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground">
                      {link.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
