'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface CTASectionProps {
  isAuthenticated: boolean
}

export function CTASection({ isAuthenticated }: CTASectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 60, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ type: 'spring', stiffness: 50, damping: 15 }}
      className="w-full max-w-5xl mx-auto mt-24 p-8 md:p-14 rounded-[32px] border border-slate-200/35 dark:border-slate-800/80 bg-slate-200/10 dark:bg-slate-900/30 backdrop-blur-md relative overflow-hidden flex flex-col items-center text-center space-y-7 shadow-2xl"
    >
      {/* Elementos decorativos de fondo de luz radial */}
      <div className="absolute inset-0 bg-radial from-violet-600/10 to-transparent dark:from-violet-600/15 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808003_1px,transparent_1px),linear-gradient(to_bottom,#80808003_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none" />

      {/* Badge Superior */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25, type: 'spring' }}
        className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-primary dark:text-violet-400 font-extrabold uppercase tracking-widest select-none relative z-10"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary dark:text-violet-400 animate-pulse" />
        <span>Toma el control</span>
      </motion.div>

      {/* Título Principal */}
      <h2 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight text-slate-900 dark:text-slate-100 max-w-3xl leading-tight relative z-10">
        Empieza a gestionar las finanzas de tu hogar hoy mismo
      </h2>

      {/* Descripción */}
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl font-medium leading-relaxed relative z-10">
        Únete a las familias que ya utilizan Control Dotz para coordinar presupuestos,
        escanear tickets de compra con IA y liquidar saldos de forma transparente y segura.
      </p>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 relative z-10 w-full sm:w-auto">
        {isAuthenticated ? (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'w-full sm:w-auto px-8 py-6 rounded-xl text-base font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/95 transition-all duration-200 flex items-center justify-center'
              )}
            >
              Ir a mi Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'w-full sm:w-auto px-8 py-6 rounded-xl text-base font-bold bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center'
                )}
              >
                Crear cuenta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'w-full sm:w-auto px-8 py-6 rounded-xl text-base font-bold border border-slate-350 dark:border-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-foreground transition-all duration-200 flex items-center justify-center'
                )}
              >
                Iniciar sesión
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </motion.section>
  )
}
