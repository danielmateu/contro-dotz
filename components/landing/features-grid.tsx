'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
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
  title: string
  description: string
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
    title: 'Hogar Compartido',
    description:
      'Invita a tu familia al hogar. Registrad gastos y liquidaciones de deudas de forma conjunta con sincronización en tiempo real.',
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
    title: 'Escáner de Tickets con IA',
    description:
      'Sube tus tickets de compra y deja que la IA de Gemini extraiga automáticamente el importe, la fecha y clasifique la categoría del gasto.',
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
    title: 'Presupuestos y Límites',
    description:
      'Establece límites mensuales por categoría y recibe alertas de presupuesto automáticas directamente en el chat familiar al superar el 80%.',
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
    title: 'Chat Familiar y Gemini Bot',
    description:
      'Comunícate con tu familia y habla con @gemini en el chat para obtener análisis rápidos y resúmenes de vuestras finanzas al instante.',
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
    title: 'Lista de Compra Inteligente',
    description:
      'Añade artículos faltantes en tiempo real y regístralos como gastos financieros en el hogar con un solo clic una vez comprados.',
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
    title: 'Proyección e Informes',
    description:
      'Gráficos de proyección de gastos a final de mes y envío manual o programado de reportes detallados en HTML a toda la familia.',
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
  const [hovered, setHovered] = useState(false)
  const isEven = index % 2 === 0

  // Variantes de entrada lateral para el bloque de información
  const infoVariants = {
    hidden: { opacity: 0, x: isEven ? -60 : 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring' as const, stiffness: 70, damping: 14 },
    },
  }

  // Variantes de entrada lateral para el bloque de la demo interactiva
  const demoVariants = {
    hidden: { opacity: 0, x: isEven ? 60 : -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring' as const, stiffness: 70, damping: 14, delay: 0.15 },
    },
  }

  const Icon = feature.icon

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'flex flex-col md:flex-row gap-12 lg:gap-24 items-center justify-between py-12 md:py-24 w-full border-b border-slate-200/10 dark:border-slate-800/40 last:border-b-0 overflow-hidden',
        isEven ? '' : 'md:flex-row-reverse'
      )}
    >
      {/* Columna de Texto explicativo */}
      <motion.div
        variants={infoVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="w-full md:w-1/2 space-y-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 flex items-center justify-center rounded-xl shadow-xs shrink-0 ${feature.colorClass}`}
          >
            <motion.div
              animate={hovered ? feature.animation.animate : { scale: 1, rotate: 0, y: 0 }}
              transition={hovered ? feature.animation.transition : { duration: 0.3 }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary dark:text-violet-400">
            Característica #0{feature.id}
          </span>
        </div>

        <h3 className="font-extrabold text-2xl md:text-4xl font-heading text-slate-900 dark:text-slate-100 leading-tight">
          {feature.title}
        </h3>

        <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium">
          {feature.description}
        </p>

        <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 select-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Prueba el demo interactivo en vivo</span>
        </div>
      </motion.div>

      {/* Columna del Demo Interactivo */}
      <motion.div
        variants={demoVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="w-full md:w-107.5 lg:w-117.5 shrink-0 border border-slate-200/50 dark:border-slate-800 bg-background/55 dark:bg-slate-900/50 rounded-3xl p-6 shadow-2xl backdrop-blur-xs relative overflow-hidden group hover:border-violet-500/25 transition-all duration-300"
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
    <div className="flex flex-col w-full relative z-10 space-y-6 mt-12">
      {features.map((feature, idx) => (
        <FeatureSection key={feature.id} feature={feature} index={idx} />
      ))}
    </div>
  )
}
