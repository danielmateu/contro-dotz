'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PetMood } from '@/lib/game/fin-pet-engine'
import { Sparkles, Heart, Zap, AlertTriangle, Coins } from 'lucide-react'
import { useGameState } from '@/lib/game/game-context'

interface TamagotchiAvatarProps {
  mood?: PetMood
  size?: 'sm' | 'md' | 'lg' | 'xl'
  interactive?: boolean
  showSpeechBubble?: boolean
  speechText?: string
  equippedAccessory?: string
  skinColor?: string
  hairstyle?: string
  eatingFood?: string | null
  onClick?: () => void
}

export function TamagotchiAvatar({
  mood = 'happy',
  size = 'md',
  interactive = true,
  showSpeechBubble = false,
  speechText,
  equippedAccessory = 'none',
  skinColor = 'skin_indigo',
  hairstyle = 'hair_none',
  eatingFood = null,
  onClick,
}: TamagotchiAvatarProps) {
  const { registerTap } = useGameState()
  const [isTapped, setIsTapped] = useState(false)
  const [tapPopups, setTapPopups] = useState<{ id: number; x: number; isCoinReward?: boolean; bonusCoins?: number; foodIcon?: string }[]>([])

  // Efecto cuando se le da de comer
  useEffect(() => {
    if (eatingFood) {
      const foodPopup = {
        id: Date.now(),
        x: 0,
        foodIcon: eatingFood,
      }
      setTapPopups((prev) => [...prev.slice(-5), foodPopup])
      setIsTapped(true)
      const timer = setTimeout(() => setIsTapped(false), 600)
      return () => clearTimeout(timer)
    }
  }, [eatingFood])

  const handleTap = async () => {
    if (!interactive) return
    setIsTapped(true)

    // Registrar toque en el estado global
    const result = await registerTap()

    // Crear animación flotante (+1 toque o recompensa de monedas si alcanza un hito)
    const newPopup = {
      id: Date.now(),
      x: (Math.random() - 0.5) * 40,
      isCoinReward: result.earnedCoins,
      bonusCoins: result.bonusCoins,
    }
    setTapPopups((prev) => [...prev.slice(-5), newPopup])

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

  // Esquema de colores según Piel (Skin) o Mood
  const getGradient = () => {
    if (skinColor === 'skin_purple') {
      return {
        body: 'url(#purple-gradient)',
        stroke: '#a855f7',
        shadow: 'rgba(168, 85, 247, 0.4)',
        badgeColor: 'bg-purple-500 text-white',
      }
    }
    if (skinColor === 'skin_cyan') {
      return {
        body: 'url(#cyan-gradient)',
        stroke: '#06b6d4',
        shadow: 'rgba(6, 182, 212, 0.4)',
        badgeColor: 'bg-cyan-500 text-white',
      }
    }
    if (skinColor === 'skin_amber') {
      return {
        body: 'url(#amber-gradient)',
        stroke: '#f59e0b',
        shadow: 'rgba(245, 158, 11, 0.4)',
        badgeColor: 'bg-amber-500 text-white',
      }
    }
    if (skinColor === 'skin_rose') {
      return {
        body: 'url(#rose-gradient)',
        stroke: '#ec4899',
        shadow: 'rgba(236, 72, 153, 0.4)',
        badgeColor: 'bg-pink-500 text-white',
      }
    }

    // Fallbacks por defecto basados en Mood
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
            className="absolute -top-16 z-20 max-w-55 bg-card text-card-foreground border border-border shadow-xl rounded-2xl p-2.5 text-xs font-medium text-center backdrop-blur-md"
          >
            {speechText}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animaciones flotantes al hacer tap o alimentar */}
      <AnimatePresence>
        {tapPopups.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, x: p.x, scale: p.foodIcon ? 0.9 : p.isCoinReward ? 0.8 : 0.6 }}
            animate={{ opacity: 0, y: dim.heartOffset - (p.foodIcon ? 20 : p.isCoinReward ? 15 : 0), scale: p.foodIcon ? 1.4 : p.isCoinReward ? 1.3 : 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.foodIcon ? 1.4 : p.isCoinReward ? 1.2 : 0.8, ease: 'easeOut' }}
            className="absolute top-0 z-30 pointer-events-none flex items-center gap-1 font-extrabold"
          >
            {p.foodIcon ? (
              <span className="bg-emerald-500 text-white text-[11px] px-2.5 py-1 rounded-full shadow-lg border border-white flex items-center gap-1 animate-bounce">
                {p.foodIcon} ¡Mmm! 😋 +15 XP
              </span>
            ) : p.isCoinReward ? (
              <span className="bg-amber-500 text-slate-950 text-[11px] px-2 py-0.5 rounded-full shadow-lg border border-white flex items-center gap-1 animate-bounce">
                <Coins className="w-3.5 h-3.5 fill-current" />
                +{p.bonusCoins || 5} Coins! 🪙
              </span>
            ) : (
              <span className="text-rose-500 text-xs flex items-center gap-0.5 drop-shadow-md">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                +1
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Contenedor Interactivo con Motion */}
      <motion.div
        className={`relative cursor-pointer ${dim.container} flex items-center justify-center`}
        onClick={handleTap}
        whileHover={interactive ? { scale: 1.08, rotate: [0, -3, 3, 0] } : {}}
        whileTap={interactive ? { scale: 0.92 } : {}}
        animate={isTapped ? { y: -12, scale: eatingFood ? 1.18 : 1, rotate: [-5, 5, 0] } : (bodyVariants[mood] as any)}
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
            {/* Gradiente Menta Original / Héroe */}
            <linearGradient id="hero-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Gradiente Índigo Feliz */}
            <linearGradient id="happy-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Gradiente Púrpura Cíber */}
            <linearGradient id="purple-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>

            {/* Gradiente Cian Océano */}
            <linearGradient id="cyan-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0e7490" />
            </linearGradient>

            {/* Gradiente Dorado Ahorrador */}
            <linearGradient id="amber-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Gradiente Rosa Coquette */}
            <linearGradient id="rose-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
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
          {(mood === 'happy' || mood === 'super_hero' || eatingFood) && (
            <>
              <ellipse cx="26" cy="58" rx="6" ry="3.5" fill="#f43f5e" fillOpacity="0.4" />
              <ellipse cx="74" cy="58" rx="6" ry="3.5" fill="#f43f5e" fillOpacity="0.4" />
            </>
          )}

          {/* Ojos según el Mood */}
          {mood === 'super_hero' && (
            <>
              <circle cx="36" cy="46" r="6" fill="#1e1b4b" />
              <circle cx="64" cy="46" r="6" fill="#1e1b4b" />
              <circle cx="34" cy="44" r="2.5" fill="#ffffff" />
              <circle cx="62" cy="44" r="2.5" fill="#ffffff" />
            </>
          )}

          {/* Ojos Felices */}
          {(mood === 'happy' || eatingFood) && (
            <>
              <path d="M 30 46 Q 36 40 42 46" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 58 46 Q 64 40 70 46" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* Ojos Preocupados / Advertencia */}
          {mood === 'warning' && !eatingFood && (
            <>
              <circle cx="36" cy="46" r="5" fill="#451a03" />
              <circle cx="64" cy="46" r="5" fill="#451a03" />
              <circle cx="34" cy="44" r="1.5" fill="#ffffff" />
              <circle cx="62" cy="44" r="1.5" fill="#ffffff" />
              <path d="M 76 34 C 76 34 81 40 78 43 C 75 45 72 43 72 40 Z" fill="#38bdf8" />
            </>
          )}

          {/* Ojos Exhaustos */}
          {mood === 'exhausted' && !eatingFood && (
            <>
              <path d="M 31 41 L 41 51 M 41 41 L 31 51" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 59 41 L 69 51 M 69 41 L 59 51" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" />
              <rect x="42" y="10" width="16" height="6" rx="3" fill="#ffffff" fillOpacity="0.8" />
              <path d="M 45 13 L 55 13" stroke="#e11d48" strokeWidth="2" strokeDasharray="2 2" />
            </>
          )}

          {/* Boca según Mood o Alimentos */}
          {eatingFood ? (
            <path d="M 36 58 Q 50 78 64 58 Z" fill="#1e1b4b" />
          ) : (
            <>
              {mood === 'super_hero' && <path d="M 38 60 Q 50 72 62 60 Z" fill="#1e1b4b" />}
              {mood === 'happy' && <path d="M 38 60 Q 50 70 62 60" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round" fill="none" />}
              {mood === 'warning' && <path d="M 40 62 Q 50 56 60 62" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none" />}
              {mood === 'exhausted' && <path d="M 42 66 Q 50 58 58 66" stroke="#881337" strokeWidth="3.5" strokeLinecap="round" fill="none" />}
            </>
          )}

          {/* PEINADOS (HAIRSTYLES) */}

          {/* 💇‍♂️ Peinado: Copete Cool */}
          {hairstyle === 'hair_copete' && (
            <g transform="translate(0, 0)">
              <path d="M 34 16 C 26 2, 54 0, 66 14 C 58 10, 44 10, 34 16 Z" fill="#1e1b4b" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 38 14 C 32 4, 50 4, 60 12 Z" fill="#312e81" opacity="0.6" />
            </g>
          )}

          {/* 🧑‍🎤 Peinado: Cresta Punk */}
          {hairstyle === 'hair_cresta' && (
            <g transform="translate(0, 0)">
              <path d="M 38 16 L 43 2 L 48 14 L 53 1 L 58 14 L 63 4 L 66 16 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.8" />
            </g>
          )}

          {/* 🧑‍🦱 Peinado: Afro Retro */}
          {hairstyle === 'hair_afro' && (
            <g transform="translate(0, 0)">
              <path d="M 28 18 C 18 8, 30 -4, 46 2 C 54 -6, 72 2, 70 18 C 78 24, 62 30, 50 22 C 38 30, 22 24, 28 18 Z" fill="#451a03" stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}

          {/* 🎀 Peinado: Lazo Coquette */}
          {hairstyle === 'hair_bow' && (
            <g transform="translate(0, 1)">
              <path d="M 34 10 C 26 2, 28 18, 46 14 Z" fill="#f472b6" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 66 10 C 74 2, 72 18, 54 14 Z" fill="#f472b6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="50" cy="13" r="3.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
            </g>
          )}

          {/* ⚡ Peinado: Picos Anime */}
          {hairstyle === 'hair_spikes' && (
            <g transform="translate(0, 0)">
              <path d="M 28 18 L 20 6 L 36 14 L 42 2 L 50 12 L 60 1 L 64 14 L 76 6 L 70 18 Z" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            </g>
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
              <rect x="25" y="38" width="22" height="15" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="53" y="38" width="22" height="15" rx="4" fill="#0f172a" stroke="#e2e8f0" strokeWidth="1.5" />
              <path d="M 47 42 L 53 42" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M 28 40 L 36 40" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
              <path d="M 56 40 L 64 40" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
            </g>
          )}

          {/* 🎧 Auriculares DJ */}
          {equippedAccessory === 'headphones' && (
            <g>
              <path d="M 12 40 C 12 10, 88 10, 88 40" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" fill="none" />
              <rect x="8" y="36" width="10" height="22" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
              <rect x="82" y="36" width="10" height="22" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
            </g>
          )}

          {/* 🎓 Birrete Sabio */}
          {equippedAccessory === 'grad_cap' && (
            <g transform="translate(0, -2)">
              <polygon points="50,2 86,14 50,26 14,14" fill="#1e293b" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 32 20 Q 50 28 68 20 L 68 26 Q 50 34 32 26 Z" fill="#0f172a" />
              <path d="M 50 14 L 78 22 L 78 30" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" />
              <circle cx="78" cy="31" r="2.5" fill="#f59e0b" />
            </g>
          )}

          {/* 🥳 Gorro de Fiesta */}
          {equippedAccessory === 'party_hat' && (
            <g>
              <polygon points="50,2 35,26 65,26" fill="#ec4899" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 42 16 L 58 16" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 38 22 L 62 22" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="50" cy="2" r="3.5" fill="#f59e0b" />
            </g>
          )}

          {/* 🍺 Cerveza Fresca Espumosa */}
          {equippedAccessory === 'beer' && (
            <g transform="translate(70, 48)">
              <rect x="0" y="8" width="20" height="24" rx="3" fill="url(#beer-liquid)" stroke="#ffffff" strokeWidth="1.8" />
              <path d="M 20 12 C 26 12, 26 24, 20 24" stroke="#ffffff" strokeWidth="2.2" fill="none" />
              <ellipse cx="4" cy="7" rx="5" ry="3.5" fill="#ffffff" />
              <ellipse cx="10" cy="6" rx="6" ry="4" fill="#ffffff" />
              <ellipse cx="16" cy="7" rx="5" ry="3.5" fill="#ffffff" />
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

