'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/i18n-context'
import {
  HogarCompartidoDemo,
  EscanerIADemo,
  PresupuestosDemo,
  ChatGeminiDemo,
  ListaCompraDemo,
  ProyeccionInformesDemo,
} from '@/components/landing/feature-demos'
import {
  Users2,
  Sparkles,
  PiggyBank,
  MessageSquare,
  ShoppingBasket,
  Mail,
  LucideIcon,
} from 'lucide-react'

interface FeatureItem {
  id: number
  titleKey: string
  descKey: string
  icon: LucideIcon
  colorClass: string
  iconColor: string
  animation: {
    animate: any
    transition?: any
  }
}

const features: FeatureItem[] = [
  {
    id: 1,
    titleKey: 'landing.features.f1Title',
    descKey: 'landing.features.f1Desc',
    icon: Users2,
    colorClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    iconColor: 'stroke-violet-600 dark:stroke-violet-400',
    animation: {
      animate: {
        scale: [1, 1.1, 1],
        y: [0, -3, 0],
      },
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 2,
    titleKey: 'landing.features.f2Title',
    descKey: 'landing.features.f2Desc',
    icon: Sparkles,
    colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    iconColor: 'stroke-emerald-600 dark:stroke-emerald-400',
    animation: {
      animate: {
        scale: [1, 1.25, 0.95, 1.1, 1],
        rotate: [0, 90, 180, 270, 360],
      },
      transition: {
        duration: 1.8,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 3,
    titleKey: 'landing.features.f3Title',
    descKey: 'landing.features.f3Desc',
    icon: PiggyBank,
    colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    iconColor: 'stroke-amber-600 dark:stroke-amber-400',
    animation: {
      animate: {
        y: [0, 3, -5, 0],
        rotate: [0, -5, 5, 0],
      },
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
      },
    },
  },
  {
    id: 4,
    titleKey: 'landing.features.f4Title',
    descKey: 'landing.features.f4Desc',
    icon: MessageSquare,
    colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    iconColor: 'stroke-blue-600 dark:stroke-blue-400',
    animation: {
      animate: {
        scale: [1, 0.85, 1.15, 0.95, 1.05, 1],
        y: [0, -4, 0],
      },
      transition: {
        duration: 0.6,
      },
    },
  },
  {
    id: 5,
    titleKey: 'landing.features.f5Title',
    descKey: 'landing.features.f5Desc',
    icon: ShoppingBasket,
    colorClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    iconColor: 'stroke-cyan-600 dark:stroke-cyan-400',
    animation: {
      animate: {
        rotate: [-8, 8, -6, 6, -3, 3, 0],
        y: [0, -2, 0],
      },
      transition: {
        duration: 0.9,
      },
    },
  },
  {
    id: 6,
    titleKey: 'landing.features.f6Title',
    descKey: 'landing.features.f6Desc',
    icon: Mail,
    colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    iconColor: 'stroke-indigo-600 dark:stroke-indigo-400',
    animation: {
      animate: {
        y: [0, -5, 0],
        scale: [1, 1.1, 1],
      },
      transition: {
        duration: 0.8,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    },
  },
]

// Selector auxiliar de demostraciones
function FeatureDemoId({ id }: { id: number }) {
  switch (id) {
    case 1:
      return <HogarCompartidoDemo />
    case 2:
      return <EscanerIADemo />
    case 3:
      return <PresupuestosDemo />
    case 4:
      return <ChatGeminiDemo />
    case 5:
      return <ListaCompraDemo />
    case 6:
      return <ProyeccionInformesDemo />
    default:
      return null
  }
}

// Componente de sección individual (Alternancia Zig-Zag y animaciones de scroll)
function FeatureSection({ feature, index }: { feature: FeatureItem; index: number }) {
  const { t } = useI18n()
  const [hovered, setHovered] = useState(false)
  const isEven = index % 2 === 0

  // Variantes de entrada vertical segura para el bloque de información
  const infoVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const },
    },
  }

  // Variantes de entrada vertical segura para el bloque de la demo interactiva
  const demoVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' as const, delay: 0.1 },
    },
  }

  const Icon = feature.icon

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-24 items-center justify-between py-8 md:py-24 w-full border-b border-slate-200/10 dark:border-slate-800/40 last:border-b-0 overflow-hidden',
        isEven ? '' : 'md:flex-row-reverse'
      )}
    >
      {/* Columna de Texto explicativo */}
      <motion.div
        variants={infoVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="w-full md:w-1/2 space-y-4 sm:space-y-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl shadow-xs shrink-0 ${feature.colorClass}`}
          >
            <motion.div
              animate={hovered ? feature.animation.animate : { scale: 1, rotate: 0, y: 0 }}
              transition={hovered ? feature.animation.transition : { duration: 0.3 }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary dark:text-violet-400">
            {t('landing.features.badgePrefix')}{feature.id}
          </span>
        </div>

        <h3 className="font-extrabold text-xl sm:text-2xl md:text-4xl font-heading text-slate-900 dark:text-slate-100 leading-tight">
          {t(feature.titleKey)}
        </h3>

        <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
          {t(feature.descKey)}
        </p>

        <div className="pt-1 sm:pt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 select-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t('landing.features.tryDemo')}</span>
        </div>
      </motion.div>

      {/* Columna del Demo Interactivo */}
      <motion.div
        variants={demoVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="w-full md:w-107.5 lg:w-117.5 shrink-0 border border-slate-200/50 dark:border-slate-800 bg-background/55 dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xs relative overflow-hidden group hover:border-violet-500/25 transition-all duration-300 min-w-0"
      >
        {/* Glow sutil en hover sobre la caja del demo */}
        <div className="absolute inset-px rounded-[22px] border border-violet-500/0 group-hover:border-violet-500/10 dark:group-hover:border-violet-500/15 transition-colors duration-300 pointer-events-none" />

        <div className="flex flex-col justify-between min-h-55">
          <FeatureDemoId id={feature.id} />
        </div>
      </motion.div>
    </div>
  )
}

export function FeaturesGrid() {
  return (
    <section className="flex flex-col w-full relative z-10 space-y-6 mt-12" aria-label="Características de la aplicación">
      {features.map((feature, idx) => (
        <FeatureSection key={feature.id} feature={feature} index={idx} />
      ))}
    </section>
  )
}
