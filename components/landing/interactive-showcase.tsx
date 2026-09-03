'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function InteractiveShowcase() {
  const [chatStep, setChatStep] = useState(0)

  // Bucle infinito del chat para simular actividad
  useEffect(() => {
    const interval = setInterval(() => {
      setChatStep((prev) => (prev + 1) % 4)
    }, 4000) // Cambiar de paso cada 4 segundos (ciclo completo de 16s)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 sm:mt-16 p-1.5 sm:p-2 border border-slate-200/40 bg-slate-200/20 dark:border-slate-800/80 dark:bg-slate-900/50 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-md transform hover:scale-[1.005] transition-all duration-350 overflow-hidden">
      <div className="bg-background rounded-[18px] sm:rounded-[22px] p-4 sm:p-6 text-left border border-slate-200/50 dark:border-slate-950 shadow-inner">
        {/* Header del Mockup */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 sm:pb-4 mb-4 sm:mb-5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-rose-500/80 shrink-0"></div>
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-amber-500/80 shrink-0"></div>
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500/80 shrink-0"></div>
            <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground ml-1.5 sm:ml-3 truncate select-none">
              control-dotz.app/dashboard
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden xs:flex -space-x-1.5">
              <div className="h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-full border border-background bg-violet-600 text-white text-[8px] font-bold flex items-center justify-center select-none shadow-xs">
                MA
              </div>
              <div className="h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-full border border-background bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center select-none shadow-xs">
                PA
              </div>
              <div
                className="h-5 w-5 sm:h-5.5 sm:w-5.5 rounded-full border border-background bg-slate-950 text-violet-400 text-[8px] font-bold flex items-center justify-center select-none shadow-xs"
                title="Gemini AI"
              >
                🤖
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] sm:text-[10px] text-primary font-bold select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Dotzi House
            </div>
          </div>
        </div>

        {/* Grid del Mockup */}
        <div className="grid gap-5 md:grid-cols-3">
          {/* Columna 1: KPIs y Presupuestos */}
          <div className="space-y-4">
            {/* KPI Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl relative overflow-hidden"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Gasto mensual (agosto)
              </span>
              
              {/* Animación del valor de gasto */}
              <div className="text-2xl font-extrabold mt-1 text-foreground font-heading">
                1.450,20 €
              </div>

              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10">
                  ▲ +12.4%
                </span>
                <span>vs. mes anterior</span>
              </div>

              {/* Proyección predictiva Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                className="mt-3.5 text-[9.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded-lg inline-flex items-center gap-1 select-none"
              >
                <TrendingUp className="h-3.5 w-3.5 animate-bounce" />
                Proyectado al cierre: ~1.680 €
              </motion.div>
            </motion.div>

            {/* Presupuestos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Límites Mensuales
                </span>
              </div>

              {/* Categoría A (Alimentación) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground text-[11px]">🛒 Alimentación</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">82%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '82%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>

              {/* Categoría B (Ocio) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground text-[11px]">🍕 Ocio / Cenas</span>
                  <span className="text-[10px] font-bold text-rose-500">105%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.45 }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
                
                {/* Advertencia animada (Aparece tras cargar la barra) */}
                <div className="h-4 overflow-hidden relative">
                  <AnimatePresence>
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.5, type: 'spring', stiffness: 120 }}
                      className="text-[9px] text-rose-500 font-bold absolute"
                    >
                      ⚠️ ¡Presupuesto superado!
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Columna 2: Chat en Tiempo Real */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl flex flex-col h-[290px] justify-between overflow-hidden"
          >
            <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-900">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Chat Familiar
              </span>
              <span className="text-[8.5px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider select-none">
                En vivo
              </span>
            </div>

            {/* Contenedor de burbujas animadas */}
            <div className="flex-1 overflow-y-auto space-y-3.5 py-2.5 pr-0.5 scrollbar-none text-[11px] flex flex-col justify-end">
              <AnimatePresence mode="popLayout">
                {chatStep >= 1 && (
                  <motion.div
                    key="msg1"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="text-[8.5px] text-muted-foreground font-bold">Mateu</span>
                    <div className="bg-muted/70 text-foreground px-3 py-1.5 rounded-2xl rounded-tl-none max-w-[90%]">
                      Chicos, acabo de pagar la cena familiar 🍕
                    </div>
                  </motion.div>
                )}

                {chatStep >= 2 && (
                  <motion.div
                    key="msg2"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    className="flex flex-col items-start gap-0.5 w-full"
                  >
                    <span className="text-[8.5px] text-muted-foreground font-bold flex items-center gap-1">
                      📢 Bot de Sistema
                    </span>
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-[10.5px] px-3 py-1.5 rounded-xl text-muted-foreground leading-normal w-full">
                      📢 **Gasto registrado**: **25,00€** en *Alimentación* para "Cena familiar"
                    </div>
                  </motion.div>
                )}

                {chatStep >= 3 && (
                  <motion.div
                    key="msg3"
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                    className="flex flex-col items-end gap-0.5 w-full align-self-end"
                  >
                    <span className="text-[8.5px] text-primary font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary animate-pulse" /> Gemini Assistant
                    </span>
                    <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-2xl rounded-tr-none max-w-[90%] leading-normal text-[10.5px] text-left">
                      ¡Alimentación está al **82%**! Os quedan **90,00€** este mes. 👍
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {chatStep === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] text-muted-foreground text-center italic py-8 select-none"
                >
                  Esperando actividad familiar...
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Columna 3: Lista de la Compra Compartida */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="p-4 border border-slate-100 dark:border-slate-900 bg-slate-500/5 rounded-2xl flex flex-col h-[290px] justify-between"
          >
            <div className="border-b pb-2 border-slate-100 dark:border-slate-900">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Lista de la Compra
              </span>
            </div>

            {/* Lista de artículos */}
            <div className="flex-1 space-y-3 py-2 text-xs overflow-y-auto scrollbar-none">
              {/* Artículo pendiente */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-2 rounded-xl bg-background border border-slate-100 dark:border-slate-900/60 shadow-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-4 w-4 rounded-md border border-border flex items-center justify-center shrink-0"></div>
                  <div className="truncate">
                    <p className="font-semibold text-foreground leading-tight text-[11px] truncate">
                      Tomates cherry
                    </p>
                    <p className="text-[8.5px] text-muted-foreground">2 packs • por Papi</p>
                  </div>
                </div>
                <button className="text-[8.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shrink-0">
                  Gasto
                </button>
              </motion.div>

              {/* Artículo comprado (Animación de tachado y check) */}
              <motion.div
                initial={{ opacity: 0.6 }}
                whileInView={{ opacity: 0.8 }}
                viewport={{ once: true }}
                className="flex items-center justify-between p-2 rounded-xl bg-background/55 border border-dashed border-border opacity-70"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Animación del checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', delay: 0.6, stiffness: 150 }}
                    className="h-4 w-4 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0"
                  >
                    <Check className="h-2.5 w-2.5 font-bold" />
                  </motion.div>
                  <div className="truncate">
                    <p className="font-medium text-muted-foreground line-through leading-tight text-[11px] truncate">
                      Detergente lavadora
                    </p>
                    <p className="text-[8.5px] text-muted-foreground/80">1 bote • por Mamá</p>
                  </div>
                </div>
                <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-muted-foreground px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                  Comprado
                </span>
              </motion.div>

              {/* Mensaje de info */}
              <p className="text-[9px] text-muted-foreground text-center italic leading-normal pt-4 select-none">
                "Tacha los artículos que faltan en casa y regístralos como gastos con un solo clic."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
