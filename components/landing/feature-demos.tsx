'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users2,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ShoppingBasket,
  Check,
  Send,
  Plus,
  AlertTriangle,
  Mail,
  Loader2,
} from 'lucide-react'
import { MorphIcon } from '@/components/ui/client-morph-icon'
// @ts-ignore
import { __iconNode as StickerData } from 'lucide-react/dist/esm/icons/sticker.mjs'
// @ts-ignore
import { __iconNode as ScanFaceData } from 'lucide-react/dist/esm/icons/scan-face.mjs'

// --- 1. HOGAR COMPARTIDO DEMO ---
export function HogarCompartidoDemo() {
  const [balances, setBalances] = useState([
    { name: 'Mateu', amount: 12.5, status: 'cobrar' },
    { name: 'Mamá', amount: -8.2, status: 'debe' },
    { name: 'Papi', amount: -4.3, status: 'debe' },
  ])
  const [settled, setSettled] = useState(false)
  const [animating, setAnimating] = useState(false)

  const handleSettle = () => {
    setAnimating(true)
    setTimeout(() => {
      setBalances([
        { name: 'Mateu', amount: 0, status: 'saldado' },
        { name: 'Mamá', amount: 0, status: 'saldado' },
        { name: 'Papi', amount: 0, status: 'saldado' },
      ])
      setSettled(true)
      setAnimating(false)
    }, 1500)
  }

  const handleReset = () => {
    setBalances([
      { name: 'Mateu', amount: 12.5, status: 'cobrar' },
      { name: 'Mamá', amount: -8.2, status: 'debe' },
      { name: 'Papi', amount: -4.3, status: 'debe' },
    ])
    setSettled(false)
  }

  return (
    <div className="flex flex-col h-full justify-between text-xs space-y-4">
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-muted-foreground border-b border-slate-200 dark:border-slate-800 pb-1.5 font-bold uppercase tracking-wider text-[10px]">
          <span>Miembro</span>
          <span>Balance Familiar</span>
        </div>
        {balances.map((b) => (
          <div key={b.name} className="flex justify-between items-center py-0.5">
            <div className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[9px] ${b.name === 'Mateu'
                  ? 'bg-violet-600 text-white'
                  : b.name === 'Mamá'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                  }`}
              >
                {b.name.substring(0, 2)}
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{b.name}</span>
            </div>
            <motion.span
              key={b.amount}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`font-bold ${b.amount > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : b.amount < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
                }`}
            >
              {b.amount > 0 ? `+${b.amount.toFixed(2)} €` : `${b.amount.toFixed(2)} €`}
            </motion.span>
          </div>
        ))}
      </div>

      <div className="pt-2 flex gap-2">
        {!settled ? (
          <button
            onClick={handleSettle}
            disabled={animating}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-850/50 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            {animating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saldando cuentas...
              </>
            ) : (
              <>
                <Users2 className="h-3.5 w-3.5" />
                Saldar Deudas con 1 Clic
              </>
            )}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full space-y-2"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl text-center font-medium flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4 stroke-[3px]" /> ¡Hogar liquidado! Todo a cero.
            </div>
            <button
              onClick={handleReset}
              className="w-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 py-1.5 rounded-lg transition-colors font-medium text-[10px]"
            >
              Reiniciar Simulación
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// --- 2. ESCÁNER DE TICKETS CON IA ---
export function EscanerIADemo() {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle')
  const [data, setData] = useState<any>(null)
  const [isHovered, setIsHovered] = useState(false)

  const startScan = () => {
    setScanState('scanning')
    setData(null)
    setTimeout(() => {
      setScanState('success')
      setData({
        establecimiento: 'Mercadona Supermercados',
        fecha: '14/08/2026',
        total: '34.15 €',
        categoria: '🛒 Alimentación',
        items: ['Tomates cherry', 'Leche de avena', 'Detergente'],
      })
    }, 2500)
  }

  return (
    <div
      className="flex flex-col h-full justify-between text-xs space-y-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 rounded-xl p-3 flex-1 overflow-hidden flex flex-col justify-center min-h-32.5">
        {scanState === 'idle' && (
          <div className="flex items-center flex-col space-y-2 py-4">
            <span className="text-2xl select-none">
              <MorphIcon
                icon={isHovered ? ScanFaceData : StickerData}
                spring="snappy"
                className="h-5.5 w-5.5"
              />
            </span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              Sube un ticket de compra de ejemplo para ver extraer a Gemini la información.
            </p>
          </div>
        )}

        {scanState === 'scanning' && (
          <div className="relative flex flex-col items-center justify-center h-full py-4 space-y-2">
            {/* Línea de escaneo láser */}
            <div className="absolute left-0 right-0 h-0.5 bg-emerald-500/80 shadow-md shadow-emerald-500 z-10 pointer-events-none animate-scan-laser" />
            {/* <span className="text-2xl animate-pulse">🧾</span> */}
            <span className="text-2xl select-none">
              <Loader2
                size={22}
                className="animate-spin"
              />
            </span>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] animate-pulse">
              Gemini extrae los datos...
            </p>
          </div>
        )}

        {scanState === 'success' && data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 text-[11px]"
          >
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1 font-bold text-slate-800 dark:text-slate-200">
              <span>{data.establecimiento}</span>
              <span className="text-emerald-600 dark:text-emerald-400">{data.total}</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-slate-500 dark:text-slate-400 text-[10px]">
              <div>Fecha: <span className="text-slate-700 dark:text-slate-300 font-semibold">{data.fecha}</span></div>
              <div>Categoría: <span className="text-slate-700 dark:text-slate-300 font-semibold">{data.categoria}</span></div>
            </div>
            <div className="mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                Artículos detectados:
              </p>
              <div className="flex flex-wrap gap-1">
                {data.items.map((item: string) => (
                  <span
                    key={item}
                    className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 rounded text-[9px]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <button
        onClick={startScan}
        disabled={scanState === 'scanning'}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {scanState === 'scanning' ? 'Analizando...' : 'Escanear Ticket 🧾'}
      </button>
    </div>
  )
}

// --- 3. PRESUPUESTOS Y LÍMITES ---
export function PresupuestosDemo() {
  const [spent, setSpent] = useState(70) // porcentaje
  const limitValue = 100 // Euros de límite
  const currentSpend = (spent / 100) * limitValue

  const addExpense = (amount: number) => {
    setSpent((prev) => Math.min(prev + amount, 115))
  }

  const resetSpend = () => {
    setSpent(70)
  }

  return (
    <div className="flex flex-col h-full justify-between text-xs space-y-4">
      <div className="space-y-3.5">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Presupuesto Ocio (Mensual)
            </span>
            <div className="text-lg font-bold text-foreground mt-0.5">
              {currentSpend.toFixed(2)} € <span className="text-slate-500 text-xs font-normal">/ {limitValue.toFixed(2)} €</span>
            </div>
          </div>
          <span
            className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border ${spent >= 100
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
              : spent >= 80
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
          >
            {spent}%
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
          <motion.div
            animate={{ width: `${Math.min(spent, 100)}%` }}
            className={`h-full rounded-full ${spent >= 100 ? 'bg-rose-500' : spent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
          />
        </div>

        {/* Notificación Alerta */}
        <div className="h-12">
          <AnimatePresence mode="wait">
            {spent >= 100 ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-rose-500/10 border border-rose-500/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 p-2 rounded-xl text-[10px] leading-relaxed flex gap-1.5 items-start"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 stroke-[2.5px]" />
                <div>
                  <span className="font-bold">¡Límite superado!</span> Habéis gastado{' '}
                  <span className="font-bold">{(currentSpend - limitValue).toFixed(2)} €</span> de más. Se ha
                  notificado a la familia.
                </div>
              </motion.div>
            ) : spent >= 80 ? (
              <motion.div
                key="warning"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 p-2 rounded-xl text-[10px] leading-relaxed flex gap-1.5 items-start"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 stroke-[2.5px]" />
                <div>
                  <span className="font-bold">Alerta 80% alcanzada:</span> Solo os quedan{' '}
                  <span className="font-bold">{(limitValue - currentSpend).toFixed(2)} €</span> de ocio este mes. Bot
                  avisará en el chat.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ok"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-slate-500 dark:text-slate-400 italic text-[10.5px] leading-normal pt-2 text-center"
              >
                "Simula añadir gastos en cenas o cines para activar las notificaciones predictivas automáticas."
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => addExpense(15)}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Añadir Gasto (+15€)
        </button>
        <button
          onClick={resetSpend}
          className="border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 px-3.5 rounded-xl transition-colors"
        >
          Reiniciar
        </button>
      </div>
    </div>
  )
}

// --- 4. CHAT FAMILIAR Y GEMINI BOT ---
interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
}

export function ChatGeminiDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hola @gemini, ¿cuál es nuestro balance actual?', sender: 'user' },
    {
      id: 2,
      text: '¡Hola! Este mes habéis gastado 1.450,20 €. Alimentación está al 82% y Ocio ha superado el límite por 5,00 €. Mateu tiene a favor 12,50 € de saldo familiar.',
      sender: 'bot',
    },
  ])
  const [typing, setTyping] = useState(false)

  const askQuestion = (q: string) => {
    if (typing) return
    const userMsg: Message = { id: Date.now(), text: q, sender: 'user' }
    setMessages((prev) => [...prev, userMsg])
    setTyping(true)

    // Respuesta simulada inteligente
    setTimeout(() => {
      let reply = 'Lo siento, no he entendido esa pregunta. Pregúntame sobre presupuestos o deudas.'
      if (q.includes('alimentación')) {
        reply = 'Habéis gastado 164,00 € en Alimentación. Quedan 36,00 € (18%) para alcanzar el límite establecido de 200,00 €.'
      } else if (q.includes('deben')) {
        reply = 'Mamá debe 8,20 € y Papi debe 4,30 € a Mateu. Podéis saldar esta cuenta pulsando "Saldar Deudas" en la pestaña Hogar.'
      } else if (q.includes('consejo')) {
        reply = 'Recomiendo frenar gastos en Ocio / Cenas (actualmente al 105%). Si reducís un 10% el gasto en alimentación el mes que viene, ahorraréis unos 20,00 € extra.'
      }

      const botMsg: Message = { id: Date.now() + 1, text: reply, sender: 'bot' }
      setMessages((prev) => [...prev, botMsg])
      setTyping(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col h-55 justify-between text-xs overflow-hidden">
      {/* Caja de mensajes */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pb-2 pr-1 scrollbar-none flex flex-col justify-end">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[8px] text-muted-foreground font-bold mb-0.5">
              {m.sender === 'user' ? 'Tú (Familia)' : '🤖 Gemini Bot'}
            </span>
            <div
              className={`px-3 py-1.5 rounded-2xl max-w-[85%] leading-normal text-[10.5px] ${m.sender === 'user'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tr-none'
                : 'bg-violet-600 text-white rounded-tl-none'
                }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex flex-col items-start">
            <span className="text-[8px] text-muted-foreground font-bold mb-0.5">🤖 Gemini Bot</span>
            <div className="bg-violet-600/30 text-violet-300 px-3 py-1.5 rounded-2xl rounded-tl-none font-bold animate-pulse text-[10px]">
              Analizando vuestros gastos...
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias de preguntas rápidas */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 shrink-0">
        <p className="text-[8.5px] text-muted-foreground uppercase font-bold tracking-wider">
          Preguntas sugeridas:
        </p>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          <button
            onClick={() => askQuestion('¿Cuánto gastamos en alimentación?')}
            disabled={typing}
            className="text-[9.5px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-colors shrink-0"
          >
            📊 Gastos Alimentación
          </button>
          <button
            onClick={() => askQuestion('¿Quiénes deben dinero y cuánto?')}
            disabled={typing}
            className="text-[9.5px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-colors shrink-0"
          >
            💸 Saldos familiares
          </button>
          <button
            onClick={() => askQuestion('Dame un consejo para ahorrar')}
            disabled={typing}
            className="text-[9.5px] bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-colors shrink-0"
          >
            💡 Consejo ahorro
          </button>
        </div>
      </div>
    </div>
  )
}

// --- 5. LISTA DE COMPRA INTELIGENTE ---
interface ShoppingItem {
  id: number
  name: string
  qty: string
  addedBy: string
  price: number
  done: boolean
}

export function ListaCompraDemo() {
  const [items, setItems] = useState<ShoppingItem[]>([
    { id: 1, name: 'Leche de avena', qty: '2 bricks', addedBy: 'Mamá', price: 2.1, done: false },
    { id: 2, name: 'Tomates cherry', qty: '1 pack', addedBy: 'Papi', price: 1.45, done: false },
    { id: 3, name: 'Detergente lavadora', qty: '1 bote', addedBy: 'Papi', price: 6.8, done: true },
  ])
  const [expenseNotice, setExpenseNotice] = useState<string | null>(null)

  const toggleItem = (id: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextDone = !item.done
          // Si se marca como completado, mostrar notificación de conversión a gasto
          if (nextDone) {
            setExpenseNotice(`Gasto de ${item.price.toFixed(2)}€ registrado en Alimentación`)
            setTimeout(() => setExpenseNotice(null), 3000)
          }
          return { ...item, done: nextDone }
        }
        return item
      })
    )
  }

  return (
    <div className="flex flex-col h-full justify-between text-xs space-y-3">
      {/* Alerta de gasto registrado */}
      <div className="h-6 relative">
        <AnimatePresence>
          {expenseNotice && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold py-0.5 rounded-md text-center"
            >
              📢 {expenseNotice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista */}
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-none">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${item.done
              ? 'bg-background/40 border-dashed border-slate-200 dark:border-slate-800 opacity-60'
              : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                  }`}
              >
                {item.done && <Check className="h-2.5 w-2.5 font-bold" />}
              </div>
              <div className="truncate">
                <p
                  className={`font-semibold leading-tight text-[11px] truncate ${item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'
                    }`}
                >
                  {item.name}
                </p>
                <p className="text-[8.5px] text-muted-foreground">
                  {item.qty} • por {item.addedBy}
                </p>
              </div>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${item.done
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10'
                }`}
            >
              {item.price.toFixed(2)} €
            </span>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-muted-foreground text-center italic select-none pt-1">
        "Haz clic en cualquier artículo para comprarlo y registrarlo automáticamente como gasto."
      </p>
    </div>
  )
}

// --- 6. PROYECCIÓN E INFORMES ---
export function ProyeccionInformesDemo() {
  const [reportState, setReportState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const sendReport = () => {
    setReportState('sending')
    setTimeout(() => {
      setReportState('sent')
    }, 2000)
  }

  const resetReport = () => {
    setReportState('idle')
  }

  return (
    <div className="flex flex-col h-full justify-between text-xs space-y-3">
      {/* Vista previa del Informe */}
      <div className="border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3 flex-1 text-[10px] space-y-2">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1 font-bold text-slate-700 dark:text-slate-300">
          <span>INFORMES MENSUALES</span>
          <span className="text-[8px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded uppercase">Agosto</span>
        </div>

        {/* Gráfico de barras mini */}
        <div className="space-y-1.5 pt-1">
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8.5px] text-slate-500 dark:text-slate-400">
              <span>Alimentación (Presupuesto: 200€)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">164,00 €</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: '82%' }}></div>
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between text-[8.5px] text-slate-500 dark:text-slate-400">
              <span>Ocio y Cenas (Presupuesto: 100€)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">105,00 €</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[9px] pt-1 text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/50 mt-2">
          <span>Gasto Total: <strong className="text-slate-800 dark:text-slate-200">1.450,20 €</strong></span>
          <span>Proyección: <strong className="text-violet-600 dark:text-violet-400">~1.680 €</strong></span>
        </div>
      </div>

      <div>
        {reportState === 'idle' && (
          <button
            onClick={sendReport}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Mail className="h-3.5 w-3.5" />
            Enviar Informe PDF/HTML a Familia
          </button>
        )}

        {reportState === 'sending' && (
          <div className="w-full bg-indigo-800 text-white font-bold py-2 rounded-xl text-center flex items-center justify-center gap-1.5 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generando y enviando correos...
          </div>
        )}

        {reportState === 'sent' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl text-center font-medium flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4 stroke-[3px]" /> ¡Enviado a toda la familia! 🚀
            </div>
            <button
              onClick={resetReport}
              className="w-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 py-1.5 rounded-lg transition-colors font-medium text-[10px]"
            >
              Reiniciar Simulación
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
