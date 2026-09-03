'use client'

import React, { useState } from 'react'
import { SettleDebtDialog } from './settle-debt-dialog'
import { SettlementActions } from './settlement-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Coins, ArrowRight, History, Calendar, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Member {
  id: string
  user_id: string
  role: string
  profiles?: {
    display_name: string | null
    email: string
  } | null
}

interface MemberBalance {
  user_id: string
  name: string
  email: string
  spent: number
  paid: number
  received: number
  fairShare: number
  balance: number
  contribution?: number
  income?: number
  weight?: number
}

interface Debt {
  from_user_id: string
  from_name: string
  to_user_id: string
  to_name: string
  amount: number
}

interface Settlement {
  id?: string
  payer_id: string
  receiver_id: string
  amount: number
  settled_at?: string
}

interface SettlementsTabContentProps {
  householdId: string
  membersList: Member[]
  balances: MemberBalance[]
  debts: Debt[]
  settlementsList: Settlement[]
}

export function SettlementsTabContent({
  householdId,
  membersList,
  balances,
  debts,
  settlementsList,
}: SettlementsTabContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogPayer, setDialogPayer] = useState('')
  const [dialogReceiver, setDialogReceiver] = useState('')
  const [dialogAmount, setDialogAmount] = useState('')

  const handleOpenSettleDialog = (payerId = '', receiverId = '', amount = '') => {
    setDialogPayer(payerId)
    setDialogReceiver(receiverId)
    setDialogAmount(amount)
    setIsDialogOpen(true)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Columna izquierda: Resumen de saldos y simplificación de deudas */}
      <div className="lg:col-span-2 space-y-6">
        {/* Balances de miembros */}
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              Saldos del Grupo
            </CardTitle>
            <CardDescription>
              Resumen detallado de cuánto ha aportado cada miembro a los gastos del hogar respecto a su cuota acordada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {balances.map((b) => {
                const isPositive = b.balance > 0.01
                const isNegative = b.balance < -0.01
                const isSettled = !isPositive && !isNegative

                return (
                  <div
                    key={b.user_id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-xl bg-muted/20 gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{b.name}</p>
                        {b.weight !== undefined && b.weight > 0 ? (
                          <Badge variant="outline" className="text-[10px] bg-indigo-50/50 text-indigo-600 border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-400">
                            Reparto: {b.weight}%
                          </Badge>
                        ) : null}
                        {b.contribution && b.contribution > 0 ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50/50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                            Cuota: {b.contribution.toFixed(2)}€
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Gastado en Hogar: <span className="font-medium">{b.spent.toFixed(2)}€</span> (Cuota justa: {b.fairShare.toFixed(2)}€)
                        {b.paid > 0 && <span className="text-emerald-600 font-medium"> (+{b.paid.toFixed(2)}€ liquidados)</span>}
                        {b.received > 0 && <span className="text-rose-600 font-medium"> (-{b.received.toFixed(2)}€ recibidos)</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-muted-foreground'
                            }`}
                        >
                          {isPositive ? '+' : ''}
                          {b.balance.toFixed(2)}€
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isPositive
                            ? 'Se le debe'
                            : isNegative
                              ? 'Debe'
                              : 'Al día'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Deudas Activas simplificadas */}
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-500" />
              Compensación de Deudas
            </CardTitle>
            <CardDescription>
              Transferencias sugeridas para saldar todas las cuentas del hogar de forma simplificada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {debts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  🎉 ¡Cuentas saldadas!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos están al día en el hogar y no hay deudas pendientes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {debts.map((d, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 border rounded-xl bg-indigo-500/5 border-indigo-500/10"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{d.from_name}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{d.to_name}</span>
                      <span className="text-muted-foreground ml-1">debe pagar</span>
                      <span className="font-bold text-foreground">{d.amount.toFixed(2)}€</span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() =>
                        handleOpenSettleDialog(d.from_user_id, d.to_user_id, d.amount.toFixed(2))
                      }
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    >
                      Liquidar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Columna derecha: Historial de liquidaciones y botón registrar */}
      <div className="space-y-6">
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Coins className="h-4 w-4 text-emerald-500" />
              Operaciones de Saldo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              onClick={() => handleOpenSettleDialog()}
            >
              <Plus className="h-4 w-4" />
              Registrar Pago Directo
            </Button>
          </CardContent>
        </Card>

        {/* Historial de liquidaciones */}
        <Card className="border-slate-200/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Historial de Pagos
            </CardTitle>
            <CardDescription>
              Histórico de transferencias de saldo registradas en el grupo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settlementsList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No se han registrado pagos de saldo todavía.
              </p>
            ) : (
              <div className="space-y-4">
                {settlementsList.map((s) => {
                  const payerName =
                    membersList.find((m) => m.user_id === s.payer_id)?.profiles
                      ?.display_name || 'Miembro'
                  const receiverName =
                    membersList.find((m) => m.user_id === s.receiver_id)?.profiles
                      ?.display_name || 'Miembro'

                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 border rounded-xl bg-muted/10 gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {payerName} pagó a {receiverName}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {s.settled_at &&
                            format(new Date(s.settled_at), "d 'de' MMMM, HH:mm", {
                              locale: es,
                            })}
                        </p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {Number(s.amount).toFixed(2)}€
                        </p>
                      </div>

                      {s.id && (
                        <SettlementActions
                          settlementId={s.id}
                          householdId={householdId}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para liquidar deudas */}
      <SettleDebtDialog
        householdId={householdId}
        membersList={membersList}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        defaultPayerId={dialogPayer}
        defaultReceiverId={dialogReceiver}
        defaultAmount={dialogAmount}
      />
    </div>
  )
}
