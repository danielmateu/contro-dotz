'use client'

import React from 'react'
import { useI18n } from '@/lib/i18n/i18n-context'
import { ProfileNameForm } from '@/components/household/profile-name-form'
import { SendReportButton } from '@/components/household/send-report-button'
import { MemberIncomeForm } from '@/components/household/member-income-form'
import { MonthlyIncomesListForm } from '@/components/household/monthly-incomes-list-form'
import { ChangePasswordForm } from '@/components/household/change-password-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Mail } from 'lucide-react'

interface SettingsViewClientProps {
  userId: string
  email: string
  displayName: string
  avatarUrl: string
  status: string
  householdId: string | null
  monthlyIncome: number
  monthlyContribution: number
  memberIncomes: any[]
}

export function SettingsViewClient({
  userId,
  email,
  displayName,
  avatarUrl,
  status,
  householdId,
  monthlyIncome,
  monthlyContribution,
  memberIncomes,
}: SettingsViewClientProps) {
  const { t, locale } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          {locale === 'en' ? 'Profile Settings' : locale === 'ca' ? 'Ajustos de Perfil' : 'Ajustes de Perfil'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'en'
            ? 'Manage your account and user profile information.'
            : locale === 'ca'
            ? 'Administra la informació del teu compte i usuari.'
            : 'Administra la información de tu cuenta y de tu usuario.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Personal info, base income, reports */}
        <div className="space-y-6">
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">
                {locale === 'en' ? 'Personal Information & Base Income' : locale === 'ca' ? 'Informació Personal i Ingrés Base' : 'Información Personal e Ingreso Base'}
              </CardTitle>
              <CardDescription>
                {locale === 'en'
                  ? 'Update your profile and base net income for proportional sharing of household expenses.'
                  : locale === 'ca'
                  ? 'Actualitza el teu perfil i ingressos nets base per al repartiment equitatiu.'
                  : 'Actualiza los datos de tu perfil y tus ingresos netos base para el reparto equitativo de los gastos del hogar.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Account Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  {locale === 'en' ? 'Account Email' : locale === 'ca' ? 'Correu electrònic del compte' : 'Correo electrónico de la cuenta'}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="pl-9 bg-muted/60 text-muted-foreground cursor-not-allowed border-muted-foreground/20"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {locale === 'en'
                    ? 'Email is linked to your Auth account and cannot be modified directly.'
                    : locale === 'ca'
                    ? 'El correu electrònic està vinculat al teu compte d\'autenticació.'
                    : 'El correo electrónico está vinculado a tu autenticación y no puede modificarse directamente.'}
                </p>
              </div>

              {/* Inner 2-column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
                {/* Profile Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">
                    {locale === 'en' ? 'Profile Data' : locale === 'ca' ? 'Dades del Perfil' : 'Datos del Perfil'}
                  </h3>
                  <ProfileNameForm
                    initialName={displayName}
                    initialAvatarUrl={avatarUrl}
                    initialStatus={status}
                    userId={userId}
                  />
                </div>

                {/* Base Income Form */}
                {householdId && (
                  <div className="border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800/50 pt-6 md:pt-0 md:pl-6 space-y-4">
                    <h3 className="font-semibold text-sm text-foreground font-heading">
                      {t('household.monthlyIncomes')} (Base)
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {locale === 'en'
                        ? 'Enter your regular net base income. It will be used for proportional expense sharing unless a specific monthly income is logged.'
                        : locale === 'ca'
                        ? 'Introdueix els teus ingressos nets base habituals per calcular la quota proporcional.'
                        : 'Introduce tus ingresos netos base habituales. Se usarán para calcular la cuota proporcional de los gastos del hogar si no registras una nómina específica en un mes concreto.'}
                    </p>
                    <MemberIncomeForm
                      initialIncome={monthlyIncome}
                      initialContribution={monthlyContribution}
                      householdId={householdId}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Household Reports */}
          {householdId && (
            <Card className="border-slate-200/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'en' ? 'Household Reports' : locale === 'ca' ? 'Informes de la Llar' : 'Reportes del Hogar'}
                </CardTitle>
                <CardDescription>
                  {locale === 'en'
                    ? 'Send a detailed financial report by email to all family members.'
                    : locale === 'ca'
                    ? 'Envia un informe financer detallat per correu a tots els membres de la família.'
                    : 'Envía un reporte financiero detallado por email a todos los miembros de tu familia.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SendReportButton householdId={householdId} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Payrolls & Variable Incomes, Security */}
        <div className="space-y-6">
          {householdId && (
            <Card className="border-slate-200/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'en' ? 'Payrolls & Variable Incomes' : locale === 'ca' ? 'Nòmines i Ingressos Variables' : 'Nóminas e Ingresos Variables'}
                </CardTitle>
                <CardDescription>
                  {locale === 'en'
                    ? 'Log specific net incomes for specific months (e.g. bonus, commission).'
                    : locale === 'ca'
                    ? 'Enregistra ingressos nets específics per a mesos concrets.'
                    : 'Registra ingresos netos específicos para meses concretos (ej. nóminas con pagas extra, comisiones o bonus).'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyIncomesListForm
                  initialIncomes={memberIncomes}
                  householdId={householdId}
                  userId={userId}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">
                {locale === 'en' ? 'Account Security' : locale === 'ca' ? 'Seguretat del Compte' : 'Seguridad de la Cuenta'}
              </CardTitle>
              <CardDescription>
                {locale === 'en'
                  ? 'Change your account password to keep your data secure.'
                  : locale === 'ca'
                  ? 'Canvia la contrasenya del teu compte per mantenir les teves dades segures.'
                  : 'Cambia la contraseña de tu cuenta para mantener tu información segura.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
