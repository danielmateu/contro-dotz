'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PetMood } from '@/lib/game/fin-pet-engine'
import { Sparkles, Heart, Zap, AlertTriangle } from 'lucide-react'

interface TamagotchiAvatarProps {
  mood?: PetMood
  size?: 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  showSpeechBubble?: boolean
  speechText?: string
  equippedAccessory?: string
  onClick?: () => void
}

export function TamagotchiAvatar({
  mood = 'happy',
  size = 'md',
  interactive = true,
  showSpeechBubble = false,
  speechText,
  equippedAccessory = 'none',
  onClick,
}: TamagotchiAvatarProps) {
  const [isTapped, setIsTapped] = useState(false)
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([])

  const handleTap = () => {
    if (!interactive) return
    setIsTapped(true)

    // Crear animación de corazones/estrellas flotantes al tocar
    const newHeart = { id: Date.now(), x: (Math.random() - 0.5) * 40 }
    setHearts((prev) => [...prev.slice(-4), newHeart])

    setTimeout(() => setIsTapped(false), 400)
    if (onClick) onClick()
  }

  // Dimensiones según tamaño
  const sizeMap = {
    sm: { container: 'w-10 h-10', svg: 40, heartOffset: -20 },
    md: { container: 'w-16 h-16', svg: 64, heartOffset: -30 },
    lg: { container: 'w-24 h-24', svg: 96, heartOffset: -45 },
    xl: { container: 'w-36 h-36', svg: 144, heartOffset: -65 },
  }

  const dim = sizeMap[size]

  // Esquema de colores según el humor
  const getGradient = () => {
    switch (mood) {
      case 'super_hero':
        return {
          body: 'url(#hero-gradient)',
          stroke: '#10b981',
          shadow: 'rgba(16, 185, 129, 0.4)',
          badgeColor: 'bg-emerald-500 text-white',
        }
      case 'happy':
        return {
          body: 'url(#happy-gradient)',
          stroke: '#6366f1',
          shadow: 'rgba(99, 102, 241, 0.3)',
          badgeColor: 'bg-indigo-500 text-white',
        }
      case 'warning':
        return {
          body: 'url(#warning-gradient)',
          stroke: '#f59e0b',
          shadow: 'rgba(245, 158, 11, 0.35)',
          badgeColor: 'bg-amber-500 text-white',
        }
      case 'exhausted':
      default:
        return {
          body: 'url(#exhausted-gradient)',
          stroke: '#f43f5e',
          shadow: 'rgba(244, 63, 94, 0.35)',
          badgeColor: 'bg-rose-500 text-white',
        }
    }
  }

  const style = getGradient()

  // Variantes de animación corporal
  const bodyVariants = {
    super_hero: {
      y: [0, -6, 0],
      scale: [1, 1.04, 1],
      transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
    },
    happy: {
      y: [0, -4, 0],
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    },
    warning: {
      rotate: [-1, 1, -1],
      y: [0, -2, 0],
      transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
    },
    exhausted: {
      y: [0, 2, 0],
      scaleY: [1, 0.96, 1],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    sleeping: {
      scale: [1, 0.98, 1],
      transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
    },
  }

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Burbuja de diálogo opcional */}
      <AnimatePresence>
        {showSpeechBubble && speechText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute -top-16 z-20 max-w-[220px] bg-card text-card-foreground border border-border shadow-xl rounded-2xl p-2.5 text-xs font-medium text-center backdrop-blur-md"
          >
            {speechText}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corazones/estrellas flotantes al hacer tap */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 1, y: 0, x: h.x, scale: 0.6 }}
            animate={{ opacity: 0, y: dim.heartOffset, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute top-0 z-30 pointer-events-none text-rose-500"
          >
            {mood === 'super_hero' ? <Sparkles className="w-4 h-4 fill-amber-400 text-amber-500" /> : <Heart className="w-4 h-4 fill-rose-500" />}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Contenedor Interactivo con Motion */}
      <motion.div
        className={`relative cursor-pointer ${dim.container} flex items-center justify-center`}
        onClick={handleTap}
        whileHover={interactive ? { scale: 1.08, rotate: [0, -3, 3, 0] } : {}}
        whileTap={interactive ? { scale: 0.92 } : {}}
        animate={isTapped ? { y: -12, rotate: [-5, 5, 0] } : (bodyVariants[mood] as any)}
      >
        {/* Glow de fondo */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-60 transition-all duration-500"
          style={{ backgroundColor: style.shadow }}
        />

        {/* SVG de Dotzi */}
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-md overflow-visible"
        >
          <defs>
            {/* Gradiente Super Héroe */}
            <linearGradient id="hero-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Gradiente Feliz */}
            <linearGradient id="happy-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Gradiente Advertencia */}
            <linearGradient id="warning-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>

            {/* Gradiente Exhausto */}
            <linearGradient id="exhausted-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>

            {/* Gradiente Cerveza */}
            <linearGradient id="beer-liquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>

          {/* ACCESORIO: Capa (Superhéroe o equipada) */}
          {(mood === 'super_hero' || equippedAccessory === 'cape') && (
            <motion.path
              d="M 22 45 C 10 55, 12 85, 30 82 C 40 80, 26 55, 25 45 Z"
              fill={equippedAccessory === 'cape' ? '#ef4444' : '#fbbf24'}
              animate={{ d: ["M 22 45 C 10 55, 12 85, 30 82 C 40 80, 26 55, 25 45 Z", "M 22 45 C 5 60, 8 90, 32 84 C 42 82, 26 55, 25 45 Z", "M 22 45 C 10 55, 12 85, 30 82 C 40 80, 26 55, 25 45 Z"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}

          {/* Cuerpo Principal de Dotzi */}
          <rect
            x="12"
            y="14"
            width="76"
            height="72"
            rx="36"
            fill={style.body}
            stroke="#ffffff"
            strokeWidth="3.5"
          />

          {/* Brillo especular superior */}
          <ellipse cx="34" cy="28" rx="14" ry="7" fill="#ffffff" fillOpacity="0.35" transform="rotate(-20 34 28)" />

          {/* Mejillas sonrojadas */}
          {(mood === 'happy' || mood === 'super_hero') && (
            <>
              <ellipse cx="26" cy="58" rx="6" ry="3.5" fill="#f43f5e" fillOpacity="0.4" />
              <ellipse cx="74" cy="58" rx="6" ry="3.5" fill="#f43f5e" fillOpacity="0.4" />
            </>
          )}

          {/* Ojos según el Mood */}
          {mood === 'super_hero' && (
            <>
              {/* Ojos con chispas estrelladas */}
              <circle cx="36" cy="46" r="6" fill="#1e1b4b" />
              <circle cx="64" cy="46" r="6" fill="#1e1b4b" />
              <circle cx="34" cy="44" r="2.5" fill="#ffffff" />
              <circle cx="62" cy="44" r="2.5" fill="#ffffff" />
            </>
          )}

          {/* Ojos Felices */}
          {mood === 'happy' && (
            <>
              <path d="M 30 46 Q 36 40 42 46" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 58 46 Q 64 40 70 46" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* Ojos Preocupados / Advertencia */}
          {mood === 'warning' && (
            <>
              <circle cx="36" cy="46" r="5" fill="#451a03" />
              <circle cx="64" cy="46" r="5" fill="#451a03" />
              <circle cx="34" cy="44" r="1.5" fill="#ffffff" />
              <circle cx="62" cy="44" r="1.5" fill="#ffffff" />
              {/* Gota de sudor */}
              <path d="M 76 34 C 76 34 81 40 78 43 C 75 45 72 43 72 40 Z" fill="#38bdf8" />
            </>
          )}

          {/* Ojos Exhaustos */}
          {mood === 'exhausted' && (
            <>
              <path d="M 31 41 L 41 51 M 41 41 L 31 51" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 59 41 L 69 51 M 69 41 L 59 51" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" />
              {/* Taza o tirita */}
              <rect x="42" y="10" width="16" height="6" rx="3" fill="#ffffff" fillOpacity="0.8" />
              <path d="M 45 13 L 55 13" stroke="#e11d48" strokeWidth="2" strokeDasharray="2 2" />
            </>
          )}

          {/* Boca según Mood */}
          {mood === 'super_hero' && (
            <path d="M 38 60 Q 50 72 62 60 Z" fill="#1e1b4b" />
          )}
          {mood === 'happy' && (
            <path d="M 38 60 Q 50 70 62 60" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          )}
          {mood === 'warning' && (
            <path d="M 40 62 Q 50 56 60 62" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none" />
          )}
          {mood === 'exhausted' && (
            <path d="M 42 66 Q 50 58 58 66" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          )}

          {/* ACCESORIOS EQUIPABLES EN CAPA SUPERIOR */}

          {/* 👑 Corona Dorada */}
          {(equippedAccessory === 'crown' || (mood === 'super_hero' && equippedAccessory === 'none')) && (
            <g transform="translate(0, 0)">
              <path d="M 34 14 L 41 4 L 50 11 L 59 4 L 66 14 Z" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.8" />
              <circle cx="41" cy="4" r="2" fill="#ef4444" />
              <circle cx="50" cy="11" r="2" fill="#3b82f6" />
              <circle cx="59" cy="4" r="2" fill="#ef4444" />
            </g>
          )}

          {/* 🕶️ Gafas de Sol Cool */}
          {equippedAccessory === 'glasses' && (
            <g transform="translate(0, 2)">
              {/* Lentes oscuras */}
              <rect x="25" y="38" width="22" height="15" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="53" y="38" width="22" height="15" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.5" />
              {/* Puente */}
              <path d="M 47 42 L 53 42" stroke="#e2e8f0" strokeWidth="2" />
              {/* Brillo en las gafas */}
              <path d="M 28 40 L 36 40" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
              <path d="M 56 40 L 64 40" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
            </g>
          )}

          {/* 🎧 Auriculares DJ */}
          {equippedAccessory === 'headphones' && (
            <g>
              {/* Diadema superior */}
              <path d="M 12 40 C 12 10, 88 10, 88 40" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" fill="none" />
              {/* Auricular Izquierdo */}
              <rect x="8" y="36" width="10" height="22" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
              {/* Auricular Derecho */}
              <rect x="82" y="36" width="10" height="22" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
            </g>
          )}

          {/* 🎓 Birrete Sabio */}
          {equippedAccessory === 'grad_cap' && (
            <g transform="translate(0, -2)">
              {/* Gorro rombo */}
              <polygon points="50,2 86,14 50,26 14,14" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
              {/* Base */}
              <path d="M 32 20 Q 50 28 68 20 L 68 26 Q 50 34 32 26 Z" fill="#0f172a" />
              {/* Borla dorada */}
              <path d="M 50 14 L 78 22 L 78 30" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="78" cy="31" r="2.5" fill="#f59e0b" />
            </g>
          )}

          {/* 🥳 Gorro de Fiesta */}
          {equippedAccessory === 'party_hat' && (
            <g>
              <polygon points="50,2 35,26 65,26" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5" />
              {/* Franjas amarillas */}
              <path d="M 42 16 L 58 16" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 38 22 L 62 22" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              {/* Pom-pom de arriba */}
              <circle cx="50" cy="2" r="3.5" fill="#f59e0b" />
            </g>
          )}

          {/* 🍺 Cerveza Fresca Espumosa */}
          {equippedAccessory === 'beer' && (
            <g transform="translate(70, 48)">
              {/* Jarra de cristal */}
              <rect x="0" y="8" width="20" height="24" rx="3" fill="url(#beer-liquid)" stroke="#ffffff" strokeWidth="1.8" />
              {/* Asa de la jarra */}
              <path d="M 20 12 C 26 12, 26 24, 20 24" stroke="#ffffff" strokeWidth="2.2" fill="none" />
              {/* Espuma blanca abundante */}
              <ellipse cx="4" cy="7" rx="5" ry="3.5" fill="#ffffff" />
              <ellipse cx="10" cy="6" rx="6" ry="4" fill="#ffffff" />
              <ellipse cx="16" cy="7" rx="5" ry="3.5" fill="#ffffff" />
              {/* Burbujitas en la cerveza */}
              <circle cx="6" cy="18" r="1" fill="#ffffff" opacity="0.7" />
              <circle cx="12" cy="22" r="1.2" fill="#ffffff" opacity="0.8" />
              <circle cx="14" cy="14" r="0.9" fill="#ffffff" opacity="0.6" />
            </g>
          )}

          {/* 🍕 Porción de Pizza */}
          {equippedAccessory === 'pizza' && (
            <g transform="translate(68, 50)">
              <path d="M 0 0 L 20 -10 L 15 15 Z" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="8" cy="2" r="2" fill="#ef4444" />
              <circle cx="12" cy="8" r="2" fill="#ef4444" />
            </g>
          )}
        </svg>

        {/* Badge flotante de icono */}
        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full text-[10px] font-bold shadow-md border border-background ${style.badgeColor}`}>
          {mood === 'super_hero' && <Zap className="w-3 h-3 fill-current" />}
          {mood === 'happy' && <Sparkles className="w-3 h-3 fill-current" />}
          {mood === 'warning' && <AlertTriangle className="w-3 h-3" />}
          {mood === 'exhausted' && <span className="text-[10px] font-extrabold">!</span>}
        </div>
      </motion.div>
    </div>
  )
}
