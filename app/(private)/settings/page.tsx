import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Ajustes',
  robots: {
    index: false,
    follow: false,
  },
}
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
import { User, Mail } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cargar perfil actual y membresía del hogar en paralelo
  const [profileRes, membershipRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, email, avatar_url, status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('household_members')
      .select('household_id, monthly_income')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileRes.data
  const membership = membershipRes.data
  const householdId = membership?.household_id || null
  const monthlyIncome = Number(membership?.monthly_income || 0)

  // Cargar ingresos mensuales específicos del usuario logueado en este hogar
  let memberIncomes: any[] = []
  if (householdId) {
    const { data: incomesRes } = await supabase
      .from('member_incomes')
      .select('id, month, amount, payroll_path')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
    memberIncomes = incomesRes || []
  }

  const displayName = profile?.display_name || ''
  const email = profile?.email || ''
  const avatarUrl = profile?.avatar_url || ''
  const status = profile?.status || ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
          Ajustes de Perfil
        </h1>
        <p className="text-muted-foreground">
          Administra la información de tu cuenta y de tu usuario.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Perfil, Ingresos Base e Informes */}
        <div className="space-y-6">
          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Información Personal e Ingreso Base</CardTitle>
              <CardDescription>
                Actualiza los datos de tu perfil y tus ingresos netos base para el reparto equitativo de los gastos del hogar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Correo electrónico (deshabilitado por seguridad de Auth) */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico de la cuenta</Label>
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
                  El correo electrónico está vinculado a tu autenticación y no puede modificarse directamente.
                </p>
              </div>

              {/* Grid interno de dos columnas: Datos personales a la izquierda, Ingreso Base a la derecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
                {/* Formulario de perfil */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-foreground">Datos del Perfil</h3>
                  <ProfileNameForm
                    initialName={displayName}
                    initialAvatarUrl={avatarUrl}
                    initialStatus={status}
                    userId={user.id}
                  />
                </div>

                {/* Formulario de ingresos mensuales base */}
                {householdId && (
                  <div className="border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-slate-800/50 pt-6 md:pt-0 md:pl-6 space-y-4">
                    <h3 className="font-semibold text-sm text-foreground font-heading">Ingresos Mensuales (Base)</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Introduce tus ingresos netos base habituales. Se usarán para calcular la cuota proporcional de los gastos del hogar si no registras una nómina específica en un mes concreto.
                    </p>
                    <MemberIncomeForm
                      initialIncome={monthlyIncome}
                      householdId={householdId}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reportes del Hogar (Opción C) */}
          {householdId && (
            <Card className="border-slate-200/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Reportes del Hogar</CardTitle>
                <CardDescription>
                  Envía un reporte financiero detallado por email a todos los miembros de tu familia. El informe incluye desglose de gastos mensuales, límites de presupuestos consumidos y sugerencias de transferencias para liquidar saldos pendientes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SendReportButton householdId={householdId} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Derecha: Nóminas e Ingresos Variables */}
        <div className="space-y-6">
          {householdId && (
            <Card className="border-slate-200/50 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Nóminas e Ingresos Variables</CardTitle>
                <CardDescription>
                  Registra ingresos netos específicos para meses concretos (ej. nóminas con pagas extra, comisiones o bonus). Si un mes no tiene registro aquí, se usará tu ingreso base por defecto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyIncomesListForm
                  initialIncomes={memberIncomes}
                  householdId={householdId}
                  userId={user.id}
                />
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Seguridad de la Cuenta</CardTitle>
              <CardDescription>
                Cambia la contraseña de tu cuenta para mantener tu información segura.
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
