'use client'

import React from 'react'

export function HeroPiggyBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none select-none"
    >
      {/* Cerdito Flotante 1 (Superior Izquierda) */}
      <div className="absolute top-[15%] left-[5%] sm:left-[8%] opacity-30 dark:opacity-40 animate-float-slow transition-transform">
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-500/10 border border-pink-500/20 backdrop-blur-xs shadow-lg transform -rotate-12 hover:scale-110 transition-transform duration-300">
          <span className="text-2xl sm:text-4xl">🐷</span>
        </div>
      </div>

      {/* Moneda de Oro 1 (Central Superior Derecha) */}
      <div className="absolute top-[18%] right-[8%] sm:right-[12%] opacity-40 dark:opacity-50 animate-float-delayed">
        <div className="p-2.5 sm:p-3.5 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-500/10 border border-amber-500/30 backdrop-blur-xs shadow-lg transform rotate-12">
          <span className="text-xl sm:text-3xl">🪙</span>
        </div>
      </div>

      {/* Cerdito Flotante Principal (Centro Derecha) */}
      <div className="absolute top-[42%] right-[4%] sm:right-[7%] opacity-35 dark:opacity-45 animate-float-medium hidden xs:block">
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-violet-500/20 via-pink-500/15 to-indigo-500/10 border border-violet-500/25 backdrop-blur-xs shadow-xl transform rotate-6">
          <span className="text-3xl sm:text-5xl">🐖</span>
        </div>
      </div>

      {/* Cerdito Flotante (Centro Izquierda) */}
      <div className="absolute top-[48%] left-[3%] sm:left-[6%] opacity-35 dark:opacity-45 animate-float-slow">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-pink-500/15 border border-indigo-500/25 backdrop-blur-xs shadow-lg transform -rotate-6">
          <span className="text-2xl sm:text-4xl">🐷</span>
        </div>
      </div>

      {/* Moneda de Oro 2 (Fondo Inferior Izquierda) */}
      <div className="absolute bottom-[22%] left-[10%] sm:left-[15%] opacity-30 dark:opacity-40 animate-float-delayed">
        <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/20 backdrop-blur-xs shadow-md transform -rotate-12">
          <span className="text-lg sm:text-2xl">🪙</span>
        </div>
      </div>

      {/* Badge de Ahorro / Gráfico Flotante (Fondo Inferior Derecha) */}
      <div className="absolute bottom-[18%] right-[8%] sm:right-[12%] opacity-30 dark:opacity-40 animate-float-slow hidden sm:block">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/25 backdrop-blur-xs shadow-lg transform rotate-6 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <span>📈</span>
          <span>+24% Ahorro</span>
        </div>
      </div>

      {/* Estilos CSS Inline de Flotación Ultra-Fluida */}
      <style jsx global>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translateY(0px) rotate(6deg); }
          50% { transform: translateY(-18px) rotate(-3deg); }
        }
        @keyframes floatDelayed {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        .animate-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-medium {
          animation: floatMedium 5.5s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-delayed {
          animation: floatDelayed 6.5s ease-in-out 1.5s infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  )
}
