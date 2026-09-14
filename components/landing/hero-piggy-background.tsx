'use client'

import React from 'react'

export function HeroPiggyBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Cerdito Flotante 1 (Superior Izquierda) */}
      <div className="absolute top-[15%] left-[5%] sm:left-[8%] opacity-30 dark:opacity-40 animate-float-slow">
        <div className="p-3 sm:p-4 rounded-2xl bg-linear-to-br from-pink-500/20 to-blue-500/10 border border-pink-500/20 shadow-lg transform -rotate-12">
          <span className="text-2xl sm:text-4xl">🐷</span>
        </div>
      </div>

      {/* Moneda de Oro 1 (Central Superior Derecha) */}
      <div className="absolute top-[18%] right-[8%] sm:right-[12%] opacity-40 dark:opacity-50 animate-float-delayed">
        <div className="p-2.5 sm:p-3.5 rounded-full bg-linear-to-br from-amber-400/20 to-yellow-500/10 border border-amber-500/30 shadow-lg transform rotate-12">
          <span className="text-xl sm:text-3xl">🪙</span>
        </div>
      </div>

      {/* Cerdito Flotante Principal (Centro Derecha) */}
      <div className="absolute top-[42%] right-[4%] sm:right-[7%] opacity-35 dark:opacity-45 animate-float-medium hidden xs:block">
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-blue-500/20 via-sky-500/15 to-cyan-500/10 border border-blue-500/25 shadow-xl transform rotate-6">
          <span className="text-3xl sm:text-5xl">🐖</span>
        </div>
      </div>

      {/* Cerdito Flotante (Centro Izquierda) */}
      <div className="absolute top-[48%] left-[3%] sm:left-[6%] opacity-35 dark:opacity-45 animate-float-slow">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-br from-blue-500/20 to-cyan-500/15 border border-blue-500/25 shadow-lg transform -rotate-6">
          <span className="text-2xl sm:text-4xl">🐷</span>
        </div>
      </div>

      {/* Moneda de Oro 2 (Fondo Inferior Izquierda) */}
      <div className="absolute bottom-[22%] left-[10%] sm:left-[15%] opacity-30 dark:opacity-40 animate-float-delayed">
        <div className="p-2 sm:p-3 rounded-full bg-linear-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/20 shadow-md transform -rotate-12">
          <span className="text-lg sm:text-2xl">🪙</span>
        </div>
      </div>

      {/* Badge de Ahorro / Gráfico Flotante (Fondo Inferior Derecha) */}
      <div className="absolute bottom-[18%] right-[8%] sm:right-[12%] opacity-30 dark:opacity-40 animate-float-slow hidden sm:block">
        <div className="p-3 rounded-2xl bg-linear-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/25 shadow-lg transform rotate-6 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
          <span>📈</span>
          <span>+24% Ahorro</span>
        </div>
      </div>

      {/* Tarjeta de Crédito Flotante (Superior Centro-Izquierda) */}
      <div className="absolute top-[28%] left-[7%] sm:left-[12%] opacity-35 dark:opacity-45 animate-float-medium hidden md:block">
        <div className="p-3 rounded-2xl bg-linear-to-br from-cyan-500/20 via-blue-500/15 to-sky-500/10 border border-cyan-500/25 shadow-xl transform -rotate-12 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">💳</span>
          <div className="flex flex-col text-[10px] font-bold text-cyan-600 dark:text-cyan-300 leading-tight">
            <span>•••• 4829</span>
            <span className="text-[8px] opacity-70">Control Dotz</span>
          </div>
        </div>
      </div>
    </div>
  )
}
